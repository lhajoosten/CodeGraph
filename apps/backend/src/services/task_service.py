"""Business logic for task management and execution.

This module provides the TaskService class for managing coding tasks,
including creation, updates, and execution via the agent workflow.

The execute_task() method orchestrates the full multi-agent workflow:
1. Planner creates execution plan
2. Coder implements the code
3. Tester creates test suite
4. Reviewer evaluates and potentially requests revisions

Example:
    from src.services.task_service import TaskService

    # Execute a task
    result = await TaskService.execute_task(db, task_id=123)
    print(f"Task completed with status: {result.status}")
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from src.agents.execution import invoke_workflow
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from src.models.task import Task, TaskStatus

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)


class TaskExecutionError(Exception):
    """Raised when task execution fails."""

    def __init__(self, task_id: int, message: str, workflow_state: WorkflowState | None = None):
        self.task_id = task_id
        self.message = message
        self.workflow_state = workflow_state
        super().__init__(f"Task {task_id} execution failed: {message}")


def _map_workflow_status_to_task_status(workflow_status: str) -> TaskStatus:
    """Map workflow state status to TaskStatus enum.

    Args:
        workflow_status: Status string from workflow state

    Returns:
        Corresponding TaskStatus enum value
    """
    status_mapping = {
        "planning": TaskStatus.PLANNING,
        "coding": TaskStatus.IN_PROGRESS,
        "testing": TaskStatus.TESTING,
        "reviewing": TaskStatus.REVIEWING,
        "complete": TaskStatus.COMPLETED,
        "completed": TaskStatus.COMPLETED,
        "failed": TaskStatus.FAILED,
        "error": TaskStatus.FAILED,
        "timeout": TaskStatus.FAILED,
        "cancelled": TaskStatus.CANCELLED,
    }
    return status_mapping.get(workflow_status, TaskStatus.FAILED)


class TaskService:
    """Service class for task-related business logic.

    Provides methods for:
    - Task execution via agent workflow
    - Task status management
    - Execution result retrieval
    """

    @staticmethod
    async def get_task(db: AsyncSession, task_id: int) -> Task | None:
        """Get a task by ID.

        Args:
            db: Database session
            task_id: Task ID to retrieve

        Returns:
            Task instance if found, None otherwise
        """
        result = await db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_task_status(
        db: AsyncSession,
        task_id: int,
        status: TaskStatus,
    ) -> Task | None:
        """Update a task's status.

        Args:
            db: Database session
            task_id: Task ID to update
            status: New status to set

        Returns:
            Updated task instance if found, None otherwise
        """
        task = await TaskService.get_task(db, task_id)
        if task:
            task.status = status
            await db.commit()
            await db.refresh(task)
            logger.info(
                "task_status_updated",
                task_id=task_id,
                status=status.value,
            )
        return task

    @staticmethod
    async def execute_task(
        db: AsyncSession,
        task_id: int,
        timeout_seconds: int | None = None,
        use_checkpointing: bool | None = None,
    ) -> Task:
        """Execute a coding task using the multi-agent workflow.

        This method orchestrates the complete agent workflow:
        1. Loads the task from the database
        2. Updates task status to PLANNING
        3. Executes the workflow (planner → coder → tester → reviewer)
        4. Updates task status based on workflow result
        5. Returns the updated task

        The workflow automatically handles:
        - Review loops (up to 3 iterations if revisions needed)
        - Error recovery with retries
        - Timeout handling
        - Cancellation support

        Args:
            db: Database session for task lookup and status updates
            task_id: ID of the task to execute
            timeout_seconds: Optional execution timeout (defaults to 5 minutes)
            use_checkpointing: Whether to enable checkpointing for resumable execution

        Returns:
            Updated Task instance with final status

        Raises:
            TaskExecutionError: If task not found or execution fails critically

        Example:
            task = await TaskService.execute_task(db, task_id=123)
            if task.status == TaskStatus.COMPLETED:
                print("Task completed successfully!")
            else:
                print(f"Task ended with status: {task.status}")
        """
        logger.info("task_execution_started", task_id=task_id)

        # 1. Load task from database
        task = await TaskService.get_task(db, task_id)
        if not task:
            raise TaskExecutionError(task_id, "Task not found")

        # 2. Validate task can be executed
        if task.status not in (TaskStatus.PENDING, TaskStatus.FAILED):
            logger.warning(
                "task_already_executed",
                task_id=task_id,
                current_status=task.status.value,
            )
            # Allow re-execution of failed tasks
            if task.status != TaskStatus.FAILED:
                raise TaskExecutionError(
                    task_id,
                    f"Task cannot be executed in status: {task.status.value}",
                )

        # 3. Update status to PLANNING
        task.status = TaskStatus.PLANNING
        await db.commit()
        await db.refresh(task)

        logger.info(
            "task_workflow_starting",
            task_id=task_id,
            title=task.title,
            description_preview=task.description[:100] if task.description else "",
        )

        try:
            # 4. Execute the workflow
            workflow_state = await invoke_workflow(
                task_description=task.description,
                task_id=task_id,
                thread_id=f"task-{task_id}",
                timeout_seconds=timeout_seconds,
                db=db,
                use_checkpointing=use_checkpointing,
            )

            # 5. Map workflow status to task status
            workflow_status = workflow_state.get("status", "failed")
            final_status = _map_workflow_status_to_task_status(workflow_status)

            # 6. Update task with final status
            task.status = final_status
            await db.commit()
            await db.refresh(task)

            logger.info(
                "task_execution_completed",
                task_id=task_id,
                final_status=final_status.value,
                iterations=workflow_state.get("iterations", 0),
                has_error=bool(workflow_state.get("error")),
            )

            return task

        except Exception as e:
            # Handle unexpected errors
            logger.error(
                "task_execution_failed",
                task_id=task_id,
                error=str(e),
                exc_info=True,
            )

            # Update task to failed status
            task.status = TaskStatus.FAILED
            await db.commit()
            await db.refresh(task)

            raise TaskExecutionError(task_id, str(e)) from e

    @staticmethod
    async def cancel_task(db: AsyncSession, task_id: int) -> Task | None:
        """Cancel a running task.

        This cancels the workflow execution and updates the task status.

        Args:
            db: Database session
            task_id: Task ID to cancel

        Returns:
            Updated task if found and cancelled, None otherwise
        """
        from src.agents.cancellation import cancel_workflow

        task = await TaskService.get_task(db, task_id)
        if not task:
            return None

        # Only cancel if task is in an active state
        active_statuses = {
            TaskStatus.PLANNING,
            TaskStatus.IN_PROGRESS,
            TaskStatus.TESTING,
            TaskStatus.REVIEWING,
        }

        if task.status not in active_statuses:
            logger.warning(
                "task_cancel_skipped",
                task_id=task_id,
                status=task.status.value,
                reason="Task not in active state",
            )
            return task

        # Cancel the workflow
        cancel_workflow(task_id, reason="User requested cancellation")

        # Update task status
        task.status = TaskStatus.CANCELLED
        await db.commit()
        await db.refresh(task)

        logger.info("task_cancelled", task_id=task_id)
        return task

    @staticmethod
    async def get_execution_result(
        db: AsyncSession,
        task_id: int,
    ) -> dict[str, Any] | None:
        """Get the execution result for a task.

        Retrieves the latest workflow outputs including plan, code,
        test results, and review feedback from AgentRun records.

        Args:
            db: Database session
            task_id: Task ID to get results for

        Returns:
            Dictionary with execution results, or None if task not found
        """
        from datetime import datetime

        from sqlalchemy.orm import selectinload

        from src.models.agent_run import AgentRunStatus, AgentType

        # Load task with agent runs
        result = await db.execute(
            select(Task).where(Task.id == task_id).options(selectinload(Task.agent_runs))
        )
        task = result.scalar_one_or_none()

        if not task:
            return None

        # Get the latest completed run for each agent type
        agent_outputs: dict[str, dict[str, Any]] = {}
        for agent_type in AgentType:
            # Find latest completed run for this agent
            runs = [
                r
                for r in task.agent_runs
                if r.agent_type == agent_type and r.status == AgentRunStatus.COMPLETED
            ]
            if runs:
                # Sort by completion time (use started_at as fallback)
                latest = max(
                    runs,
                    key=lambda r: r.completed_at or r.started_at or datetime.min,
                )
                agent_outputs[agent_type.value] = {
                    "output": latest.output_data,
                    "model": latest.model_used,
                    "tokens": latest.tokens_used,
                    "latency_ms": latest.total_latency_ms,
                    "iteration": latest.iteration,
                }

        # Build result summary
        return {
            "task_id": task_id,
            "status": task.status.value,
            "title": task.title,
            "description": task.description,
            "agent_outputs": agent_outputs,
            "plan": agent_outputs.get("planner", {}).get("output", {}).get("plan"),
            "code": agent_outputs.get("coder", {}).get("output", {}).get("code"),
            "test_results": agent_outputs.get("tester", {}).get("output", {}).get("test_results"),
            "review_feedback": agent_outputs.get("reviewer", {})
            .get("output", {})
            .get("review_feedback"),
            "verdict": agent_outputs.get("reviewer", {}).get("output", {}).get("verdict"),
            "total_runs": len(task.agent_runs),
            "completed_runs": sum(
                1 for r in task.agent_runs if r.status == AgentRunStatus.COMPLETED
            ),
        }
