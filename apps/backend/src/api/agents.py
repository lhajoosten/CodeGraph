"""API routes for agent execution and task management.

This module provides FastAPI endpoints for executing multi-agent workflows
with real-time streaming via Server-Sent Events. Agents process coding tasks
through planning, coding, testing, and review stages.

Streaming Events:
- node_start: Agent node began execution
- token: LLM token received (for streaming response text)
- node_end: Agent node completed
- workflow_complete: Entire workflow finished

TODO: Add webhook integration for async execution (Phase 2)
TODO: Add execution history and metrics endpoints (Phase 3)
TODO: Add rate limiting per user (Phase 4)
"""

import json
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.graph import stream_workflow
from src.api.deps import get_current_user
from src.core.database import get_db
from src.core.logging import get_logger
from src.models.task import Task
from src.models.user import User
from src.services.agent_run_service import AgentRunService

logger = get_logger(__name__)

router = APIRouter()


@router.post("/tasks/{task_id}/execute", response_class=StreamingResponse)
async def execute_task_stream(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Execute a coding task with real-time streaming output.

    Streams the complete execution of the multi-agent workflow, including
    real-time updates from planning, coding, testing, and review stages.
    Uses Server-Sent Events (SSE) for efficient streaming to the client.

    Args:
        task_id: ID of the task to execute
        db: Database session
        current_user: Authenticated user

    Returns:
        StreamingResponse with SSE formatted events

    Raises:
        HTTPException: If task not found or user lacks permission

    Query Parameters:
        thread_id: Optional thread ID for resuming previous execution

    Example:
        GET /api/v1/agents/tasks/123/execute

        Returns streaming events like:
            data: {"type": "node_start", "node": "planner"}\n\n
            data: {"type": "token", "content": "Step 1: "}\n\n
            data: {"type": "node_end", "node": "planner", "duration": 2.5}\n\n

    TODO: Add execution timeout (Phase 3)
    TODO: Add error recovery with checkpoints (Phase 4)
    """
    logger.info("Execute task stream requested", task_id=task_id, user_id=current_user.id)

    # Fetch task from database and verify ownership
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task_description = task.description

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE formatted events from the workflow.

        Converts LangGraph events into SSE format for streaming to client.
        Each event is a JSON object with event metadata and payload.

        TODO: Add event filtering options (Phase 3)
        """
        try:
            async for event in stream_workflow(task_description, task_id, db=db):
                event_type = event.get("event", "unknown")

                # Map LangGraph events to client event format
                if event_type == "on_chat_model_start":
                    # LLM model started processing
                    node_name = event.get("name", "unknown")
                    yield f"data: {json.dumps({'type': 'node_start', 'node': node_name})}\n\n"

                elif event_type == "on_chat_model_stream":
                    # LLM token received
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

                elif event_type == "on_chain_end":
                    # Node finished
                    node_name = event.get("name", "unknown")
                    duration = event.get("data", {}).get("duration", 0)
                    if node_name != "LangGraph":  # Skip workflow-level events for now
                        yield f"data: {json.dumps({'type': 'node_end', 'node': node_name, 'duration': duration})}\n\n"

            # Send completion event
            yield 'data: {"type": "workflow_complete", "status": "success"}\n\n'

        except Exception as e:
            logger.error("Error in event generator", task_id=task_id, error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        finally:
            # Send done marker
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )


@router.get("/tasks/{task_id}/status")
async def get_task_status(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get current status of a task execution.

    Returns the latest execution state including current node, progress,
    and any errors encountered.

    Args:
        task_id: ID of the task
        db: Database session
        current_user: Authenticated user

    Returns:
        Task status object with current state and progress

    Raises:
        HTTPException: If task not found
    """
    logger.info("Get task status requested", task_id=task_id, user_id=current_user.id)

    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get execution summary from AgentRun records
    service = AgentRunService(db)
    summary = await service.get_task_execution_summary(task_id)

    # Calculate progress based on completed stages
    runs_by_type = summary.get("runs_by_type", {})
    stages_complete = len(runs_by_type)
    total_stages = 4  # planner, coder, tester, reviewer
    progress = int((stages_complete / total_stages) * 100)

    # Determine current node
    current_node = None
    if "reviewer" in runs_by_type:
        current_node = "reviewer"
    elif "tester" in runs_by_type:
        current_node = "tester"
    elif "coder" in runs_by_type:
        current_node = "coder"
    elif "planner" in runs_by_type:
        current_node = "planner"

    return {
        "task_id": task_id,
        "status": summary.get("status", "not_started"),
        "current_node": current_node,
        "progress": progress,
        "total_runs": summary.get("total_runs", 0),
        "total_tokens": summary.get("total_tokens", 0),
        "total_duration_seconds": summary.get("total_duration_seconds", 0),
        "runs_by_type": runs_by_type,
    }


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str | int]:
    """Cancel an ongoing task execution.

    Signals the workflow to stop and cleanup resources. If the task has
    checkpoints, it can be resumed later.

    Args:
        task_id: ID of the task to cancel
        db: Database session
        current_user: Authenticated user

    Returns:
        Confirmation message

    Raises:
        HTTPException: If task not found or already completed

    TODO: Implement cancellation with graceful cleanup (Phase 2)
    TODO: Add checkpoint cleanup on cancellation (Phase 4)
    """
    logger.info("Cancel task requested", task_id=task_id, user_id=current_user.id)

    # TODO: Implement actual task cancellation
    # await task_service.cancel_task(task_id, current_user.id)

    return {"message": "Task cancellation requested", "task_id": task_id}


@router.get("/tasks/{task_id}/result")
async def get_task_result(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get final result of completed task execution.

    Returns the complete output from all workflow stages including plan,
    generated code, test results, and review feedback.

    Args:
        task_id: ID of the completed task
        db: Database session
        current_user: Authenticated user

    Returns:
        Complete task execution result

    Raises:
        HTTPException: If task not found or still executing

    TODO: Add result caching (Phase 3)
    TODO: Add result expiration (Phase 4)
    """
    logger.info("Get task result requested", task_id=task_id, user_id=current_user.id)

    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get all agent runs for this task
    service = AgentRunService(db)
    runs = await service.get_runs_for_task(task_id)

    if not runs:
        raise HTTPException(status_code=404, detail="No execution data found")

    # Extract outputs from each agent run
    plan = ""
    code = ""
    test_results = ""
    review_feedback = ""
    verdict = None

    for run in runs:
        output = run.output_data or {}
        if run.agent_type.value == "planner":
            plan = output.get("plan_preview", "")
        elif run.agent_type.value == "coder":
            code = output.get("code_preview", "")
        elif run.agent_type.value == "tester":
            test_results = output.get("tests_preview", "")
        elif run.agent_type.value == "reviewer":
            review_feedback = output.get("feedback_preview", "")
            verdict = run.verdict

    # Get execution summary
    summary = await service.get_task_execution_summary(task_id)

    return {
        "task_id": task_id,
        "status": summary.get("status", "unknown"),
        "plan": plan,
        "code": code,
        "test_results": test_results,
        "review_feedback": review_feedback,
        "verdict": verdict,
        "iterations": summary.get("runs_by_type", {}).get("coder", [{}])[-1].get("iteration", 1),
        "total_tokens": summary.get("total_tokens", 0),
        "total_duration_seconds": summary.get("total_duration_seconds", 0),
    }
