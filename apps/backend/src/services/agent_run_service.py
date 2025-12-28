"""Service for managing AgentRun persistence.

This module provides CRUD operations for tracking agent node executions
during workflow processing. Each agent (planner, coder, tester, reviewer)
creates an AgentRun record when it starts and updates it upon completion.

Usage:
    service = AgentRunService(db_session)
    run = await service.create_run(task_id=1, agent_type=AgentType.PLANNER)
    await service.start_run(run.id)
    await service.complete_run(run.id, output_data={"plan": "..."})
"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.agent_run import AgentRun, AgentRunStatus, AgentType

logger = get_logger(__name__)


class AgentRunService:
    """Service for managing AgentRun records."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with a database session.

        Args:
            db: Async database session
        """
        self.db = db

    async def create_run(
        self,
        task_id: int,
        agent_type: AgentType,
        iteration: int = 1,
        model_used: str | None = None,
        input_data: dict[str, Any] | None = None,
    ) -> AgentRun:
        """Create a new AgentRun record.

        Args:
            task_id: ID of the task being processed
            agent_type: Type of agent (planner, coder, tester, reviewer)
            iteration: Iteration number (for review loop)
            model_used: Name of the LLM model used
            input_data: Input provided to the agent

        Returns:
            Created AgentRun record
        """
        run = AgentRun(
            task_id=task_id,
            agent_type=agent_type,
            status=AgentRunStatus.PENDING,
            iteration=iteration,
            model_used=model_used,
            input_data=input_data,
        )
        self.db.add(run)
        await self.db.flush()

        logger.info(
            "Created agent run",
            run_id=run.id,
            task_id=task_id,
            agent_type=agent_type.value,
            iteration=iteration,
        )

        return run

    async def start_run(self, run_id: int) -> AgentRun | None:
        """Mark an agent run as started.

        Args:
            run_id: ID of the run to start

        Returns:
            Updated AgentRun or None if not found
        """
        run = await self.db.get(AgentRun, run_id)
        if not run:
            logger.warning("Agent run not found", run_id=run_id)
            return None

        run.status = AgentRunStatus.RUNNING
        run.started_at = datetime.now(UTC)
        await self.db.flush()

        logger.info(
            "Started agent run",
            run_id=run_id,
            agent_type=run.agent_type.value,
        )

        return run

    async def complete_run(
        self,
        run_id: int,
        output_data: dict[str, Any] | None = None,
        tokens_used: int | None = None,
        verdict: str | None = None,
        run_metadata: dict[str, Any] | None = None,
    ) -> AgentRun | None:
        """Mark an agent run as completed.

        Args:
            run_id: ID of the run to complete
            output_data: Output produced by the agent
            tokens_used: Number of tokens consumed
            verdict: Review verdict (for reviewer agent)
            run_metadata: Additional metadata about the run

        Returns:
            Updated AgentRun or None if not found
        """
        run = await self.db.get(AgentRun, run_id)
        if not run:
            logger.warning("Agent run not found", run_id=run_id)
            return None

        run.status = AgentRunStatus.COMPLETED
        run.completed_at = datetime.now(UTC)
        run.output_data = output_data
        run.tokens_used = tokens_used
        run.verdict = verdict
        run.run_metadata = run_metadata
        await self.db.flush()

        duration = None
        if run.started_at:
            duration = (run.completed_at - run.started_at).total_seconds()

        logger.info(
            "Completed agent run",
            run_id=run_id,
            agent_type=run.agent_type.value,
            duration_seconds=duration,
            tokens_used=tokens_used,
        )

        return run

    async def fail_run(
        self,
        run_id: int,
        error_message: str,
        run_metadata: dict[str, Any] | None = None,
    ) -> AgentRun | None:
        """Mark an agent run as failed.

        Args:
            run_id: ID of the run that failed
            error_message: Description of the error
            run_metadata: Additional metadata about the failure

        Returns:
            Updated AgentRun or None if not found
        """
        run = await self.db.get(AgentRun, run_id)
        if not run:
            logger.warning("Agent run not found", run_id=run_id)
            return None

        run.status = AgentRunStatus.FAILED
        run.completed_at = datetime.now(UTC)
        run.error_message = error_message
        run.run_metadata = run_metadata
        await self.db.flush()

        logger.error(
            "Agent run failed",
            run_id=run_id,
            agent_type=run.agent_type.value,
            error=error_message,
        )

        return run

    async def timeout_run(self, run_id: int) -> AgentRun | None:
        """Mark an agent run as timed out.

        Args:
            run_id: ID of the run that timed out

        Returns:
            Updated AgentRun or None if not found
        """
        run = await self.db.get(AgentRun, run_id)
        if not run:
            logger.warning("Agent run not found", run_id=run_id)
            return None

        run.status = AgentRunStatus.TIMEOUT
        run.completed_at = datetime.now(UTC)
        run.error_message = "Agent execution timed out"
        await self.db.flush()

        logger.warning(
            "Agent run timed out",
            run_id=run_id,
            agent_type=run.agent_type.value,
        )

        return run

    async def get_run(self, run_id: int) -> AgentRun | None:
        """Get an agent run by ID.

        Args:
            run_id: ID of the run to retrieve

        Returns:
            AgentRun or None if not found
        """
        return await self.db.get(AgentRun, run_id)

    async def get_runs_for_task(
        self,
        task_id: int,
        agent_type: AgentType | None = None,
    ) -> list[AgentRun]:
        """Get all agent runs for a task.

        Args:
            task_id: ID of the task
            agent_type: Optional filter by agent type

        Returns:
            List of AgentRun records
        """
        query = select(AgentRun).where(AgentRun.task_id == task_id)

        if agent_type:
            query = query.where(AgentRun.agent_type == agent_type)

        query = query.order_by(AgentRun.created_at)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_latest_run(
        self,
        task_id: int,
        agent_type: AgentType,
    ) -> AgentRun | None:
        """Get the most recent run for a task and agent type.

        Args:
            task_id: ID of the task
            agent_type: Type of agent

        Returns:
            Most recent AgentRun or None
        """
        query = (
            select(AgentRun)
            .where(AgentRun.task_id == task_id)
            .where(AgentRun.agent_type == agent_type)
            .order_by(AgentRun.created_at.desc())
            .limit(1)
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_task_execution_summary(
        self,
        task_id: int,
    ) -> dict[str, Any]:
        """Get a summary of all agent runs for a task.

        Args:
            task_id: ID of the task

        Returns:
            Summary dict with counts, status, and timing info
        """
        runs = await self.get_runs_for_task(task_id)

        if not runs:
            return {
                "task_id": task_id,
                "total_runs": 0,
                "status": "not_started",
                "runs_by_type": {},
            }

        runs_by_type: dict[str, list[dict[str, Any]]] = {}
        total_tokens = 0
        total_duration = 0.0

        for run in runs:
            agent_type = run.agent_type.value
            if agent_type not in runs_by_type:
                runs_by_type[agent_type] = []

            duration = None
            if run.started_at and run.completed_at:
                duration = (run.completed_at - run.started_at).total_seconds()
                total_duration += duration

            if run.tokens_used:
                total_tokens += run.tokens_used

            runs_by_type[agent_type].append(
                {
                    "id": run.id,
                    "iteration": run.iteration,
                    "status": run.status.value,
                    "duration_seconds": duration,
                    "tokens_used": run.tokens_used,
                    "verdict": run.verdict,
                }
            )

        # Determine overall status
        latest_run = runs[-1]
        if latest_run.status == AgentRunStatus.RUNNING:
            overall_status = "running"
        elif latest_run.status == AgentRunStatus.FAILED:
            overall_status = "failed"
        elif latest_run.status == AgentRunStatus.TIMEOUT:
            overall_status = "timeout"
        elif (
            latest_run.agent_type == AgentType.REVIEWER
            and latest_run.status == AgentRunStatus.COMPLETED
        ):
            overall_status = "complete"
        else:
            overall_status = "in_progress"

        return {
            "task_id": task_id,
            "total_runs": len(runs),
            "status": overall_status,
            "total_tokens": total_tokens,
            "total_duration_seconds": total_duration,
            "runs_by_type": runs_by_type,
        }
