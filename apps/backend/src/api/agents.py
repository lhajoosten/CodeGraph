"""API routes for agent execution and task management.

This module provides FastAPI endpoints for executing multi-agent workflows
with real-time streaming via Server-Sent Events. Agents process coding tasks
through planning, coding, testing, and review stages.

Streaming Events:
- node_start: Agent node began execution
- token: LLM token received (for streaming response text)
- node_end: Agent node completed
- workflow_complete: Entire workflow finished

Webhook Events:
- task.started: Task execution began
- task.completed: Task execution completed successfully
- task.failed: Task execution failed
- workflow.planning_completed: Planning stage finished
- workflow.coding_completed: Coding stage finished
- workflow.testing_completed: Testing stage finished
- workflow.review_completed: Review stage finished

Additional Features:
- Execution history endpoints for task and user history
- Council review endpoints for multi-judge review data
- Timeline endpoints for visualization

TODO: Add rate limiting per user (Phase 4)
"""

import json
from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.graph import stream_workflow
from src.api.deps import get_current_user
from src.core.database import get_db
from src.core.logging import get_logger
from src.models.task import Task
from src.models.user import User
from src.models.webhook import WebhookEvent
from src.schemas.council import (
    CouncilMetricsResponse,
    CouncilReviewListResponse,
    CouncilReviewSummary,
)
from src.services.agent_run_service import AgentRunService
from src.services.execution_history_service import ExecutionHistoryService
from src.services.webhook_service import WebhookService

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

    # Dispatch task started webhook
    webhook_service = WebhookService(db)
    await webhook_service.dispatch_event(
        event_type=WebhookEvent.TASK_STARTED,
        data={"task_id": task_id, "title": task.title, "status": "started"},
        task_id=task_id,
        user_id=current_user.id,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE formatted events from the workflow.

        Converts LangGraph events into SSE format for streaming to client.
        Each event is a JSON object with event metadata and payload.
        Also dispatches webhook events for node completions.
        """
        completed_nodes: set[str] = set()

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

                        # Dispatch webhook for node completion (avoid duplicates)
                        if node_name not in completed_nodes:
                            completed_nodes.add(node_name)
                            await _dispatch_node_webhook(
                                webhook_service, node_name, task_id, current_user.id
                            )

            # Send completion event
            yield 'data: {"type": "workflow_complete", "status": "success"}\n\n'

            # Dispatch task completed webhook
            await webhook_service.dispatch_event(
                event_type=WebhookEvent.TASK_COMPLETED,
                data={
                    "task_id": task_id,
                    "title": task.title,
                    "status": "completed",
                    "nodes_executed": list(completed_nodes),
                },
                task_id=task_id,
                user_id=current_user.id,
            )

        except Exception as e:
            logger.error("Error in event generator", task_id=task_id, error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

            # Dispatch task failed webhook
            await webhook_service.dispatch_event(
                event_type=WebhookEvent.TASK_FAILED,
                data={
                    "task_id": task_id,
                    "title": task.title,
                    "status": "failed",
                    "error_message": str(e),
                },
                task_id=task_id,
                user_id=current_user.id,
            )

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


# Mapping of node names to webhook events
NODE_WEBHOOK_EVENTS: dict[str, WebhookEvent] = {
    "planner": WebhookEvent.PLANNING_COMPLETED,
    "coder": WebhookEvent.CODING_COMPLETED,
    "tester": WebhookEvent.TESTING_COMPLETED,
    "reviewer": WebhookEvent.REVIEW_COMPLETED,
}


async def _dispatch_node_webhook(
    service: WebhookService,
    node_name: str,
    task_id: int,
    user_id: int,
) -> None:
    """Dispatch webhook event for node completion.

    Args:
        service: Webhook service instance
        node_name: Name of the completed node
        task_id: Associated task ID
        user_id: Owner user ID
    """
    event = NODE_WEBHOOK_EVENTS.get(node_name.lower())
    if event:
        await service.dispatch_event(
            event_type=event,
            data={
                "task_id": task_id,
                "stage": node_name,
                "status": "completed",
            },
            task_id=task_id,
            user_id=user_id,
        )


# =============================================================================
# Execution History and Council Review Endpoints
# =============================================================================


@router.get("/tasks/{task_id}/history")
async def get_task_history(
    task_id: int,
    include_council: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get complete execution history for a task.

    Returns a comprehensive view of all agent runs, including timing,
    tokens, costs, and optionally council review data.

    Args:
        task_id: ID of the task
        include_council: Whether to include council review details (default True)
        db: Database session
        current_user: Authenticated user

    Returns:
        Complete task execution history with all agent runs and metrics

    Raises:
        HTTPException: If task not found or user lacks permission
    """
    logger.info("Get task history requested", task_id=task_id, user_id=current_user.id)

    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    service = ExecutionHistoryService(db)
    history = await service.get_task_history(task_id, include_council=include_council)

    return history


@router.get("/history")
async def get_user_execution_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str | None = Query(None, description="Filter by task status"),
    date_from: datetime | None = Query(None, description="Start date filter"),
    date_to: datetime | None = Query(None, description="End date filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get paginated execution history for the current user.

    Returns a list of all tasks with their execution summary,
    supporting filtering by status and date range.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        status: Optional filter by task status
        date_from: Optional start date filter
        date_to: Optional end date filter
        db: Database session
        current_user: Authenticated user

    Returns:
        Paginated list of task execution summaries
    """
    logger.info(
        "Get user execution history requested",
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )

    service = ExecutionHistoryService(db)
    history = await service.get_user_execution_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status_filter=status,
        date_from=date_from,
        date_to=date_to,
    )

    return history


@router.get("/tasks/{task_id}/timeline")
async def get_execution_timeline(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Get detailed execution timeline for visualization.

    Returns a chronological list of all events during task execution,
    suitable for timeline visualization in the frontend.

    Args:
        task_id: ID of the task
        db: Database session
        current_user: Authenticated user

    Returns:
        List of timeline events with timestamps and event data

    Raises:
        HTTPException: If task not found or user lacks permission
    """
    logger.info("Get execution timeline requested", task_id=task_id, user_id=current_user.id)

    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    service = ExecutionHistoryService(db)
    timeline = await service.get_execution_timeline(task_id)

    return timeline


@router.get("/tasks/{task_id}/council-reviews", response_model=CouncilReviewListResponse)
async def get_task_council_reviews(
    task_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CouncilReviewListResponse:
    """Get council review history for a specific task.

    Returns paginated list of all council reviews for the task,
    including verdict, consensus type, and judge count.

    Args:
        task_id: ID of the task
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        db: Database session
        current_user: Authenticated user

    Returns:
        Paginated list of council reviews

    Raises:
        HTTPException: If task not found or user lacks permission
    """
    logger.info(
        "Get task council reviews requested",
        task_id=task_id,
        user_id=current_user.id,
    )

    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    service = ExecutionHistoryService(db)
    reviews = await service.get_council_review_history(
        task_id=task_id,
        page=page,
        page_size=page_size,
    )

    return CouncilReviewListResponse(
        items=[CouncilReviewSummary(**item) for item in reviews["items"]],
        total=reviews["total"],
        page=reviews["page"],
        page_size=reviews["page_size"],
        has_more=reviews["has_more"],
    )


@router.get("/council-reviews", response_model=CouncilReviewListResponse)
async def get_user_council_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CouncilReviewListResponse:
    """Get all council reviews for the current user's tasks.

    Returns paginated list of all council reviews across all user's tasks,
    useful for analytics and history views.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        db: Database session
        current_user: Authenticated user

    Returns:
        Paginated list of council reviews
    """
    logger.info(
        "Get user council reviews requested",
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )

    service = ExecutionHistoryService(db)
    reviews = await service.get_council_review_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )

    return CouncilReviewListResponse(
        items=[CouncilReviewSummary(**item) for item in reviews["items"]],
        total=reviews["total"],
        page=reviews["page"],
        page_size=reviews["page_size"],
        has_more=reviews["has_more"],
    )


@router.get("/council-metrics", response_model=CouncilMetricsResponse)
async def get_council_metrics(
    date_from: datetime | None = Query(None, description="Start date filter"),
    date_to: datetime | None = Query(None, description="End date filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CouncilMetricsResponse:
    """Get aggregate metrics for council reviews.

    Returns comprehensive metrics including verdict distribution,
    consensus breakdown, and per-judge performance statistics.

    Args:
        date_from: Optional start date filter
        date_to: Optional end date filter
        db: Database session
        current_user: Authenticated user

    Returns:
        Aggregate council review metrics
    """
    logger.info("Get council metrics requested", user_id=current_user.id)

    service = ExecutionHistoryService(db)
    metrics = await service.get_council_metrics(
        user_id=current_user.id,
        date_from=date_from,
        date_to=date_to,
    )

    return CouncilMetricsResponse(**metrics)
