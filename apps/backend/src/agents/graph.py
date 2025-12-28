"""LangGraph workflow definitions for agent orchestration.

This module defines the StateGraph that orchestrates all agent nodes in the
multi-agent coding workflow. The workflow includes planner, coder, tester,
and reviewer nodes with conditional routing for review loops and iteration limits.

Features:
- Council-based review with multiple judges (optional, config-driven)
- Enhanced routing with confidence-based decisions
- Detailed metrics collection
- Graceful cancellation support

TODO: Add supervisor pattern for node orchestration (Phase 4)
TODO: Add checkpointer integration (Phase 4)
TODO: Add workflow interrupts for user intervention (Phase 4)
"""

import asyncio
import threading
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from langgraph.graph import END, START, StateGraph

from src.agents.council.node import council_reviewer_node
from src.agents.nodes.coder import coder_node
from src.agents.nodes.planner import planner_node
from src.agents.nodes.reviewer import reviewer_node
from src.agents.nodes.tester import tester_node
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

# Workflow configuration constants
MAX_REVIEW_ITERATIONS = 3  # Maximum number of coder revisions after review feedback
WORKFLOW_TIMEOUT_SECONDS = 300  # 5 minutes total workflow timeout


class CancellationToken:
    """Thread-safe token for workflow cancellation.

    Provides a mechanism to signal cancellation to running workflows
    and check cancellation status from within workflow nodes.

    Usage:
        token = CancellationToken()

        # In main code
        token.cancel()  # Signal cancellation

        # In workflow node
        if token.is_cancelled:
            raise WorkflowCancelledError()

    Thread Safety:
        The token is thread-safe and can be checked/set from any thread.
    """

    def __init__(self) -> None:
        """Initialize an uncancelled token."""
        self._cancelled = threading.Event()
        self._cancel_reason: str | None = None

    @property
    def is_cancelled(self) -> bool:
        """Check if cancellation has been requested."""
        return self._cancelled.is_set()

    @property
    def cancel_reason(self) -> str | None:
        """Get the reason for cancellation, if provided."""
        return self._cancel_reason

    def cancel(self, reason: str | None = None) -> None:
        """Request cancellation of the workflow.

        Args:
            reason: Optional reason for the cancellation
        """
        self._cancel_reason = reason
        self._cancelled.set()

    def reset(self) -> None:
        """Reset the token to uncancelled state."""
        self._cancelled.clear()
        self._cancel_reason = None

    def raise_if_cancelled(self) -> None:
        """Raise WorkflowCancelledError if cancelled.

        Raises:
            WorkflowCancelledError: If cancellation was requested
        """
        if self.is_cancelled:
            raise WorkflowCancelledError(self._cancel_reason or "Workflow cancelled")


class WorkflowCancelledError(Exception):
    """Raised when a workflow is cancelled."""

    pass


# Global registry for active workflow cancellation tokens
_active_tokens: dict[int, CancellationToken] = {}
_token_lock = threading.Lock()


def get_cancellation_token(task_id: int) -> CancellationToken:
    """Get or create a cancellation token for a task.

    Args:
        task_id: The task ID

    Returns:
        CancellationToken for the task
    """
    with _token_lock:
        if task_id not in _active_tokens:
            _active_tokens[task_id] = CancellationToken()
        return _active_tokens[task_id]


def cancel_workflow(task_id: int, reason: str | None = None) -> bool:
    """Cancel a running workflow.

    Args:
        task_id: The task ID to cancel
        reason: Optional reason for cancellation

    Returns:
        True if a token was found and cancelled, False otherwise
    """
    with _token_lock:
        if task_id in _active_tokens:
            _active_tokens[task_id].cancel(reason)
            logger.info("Workflow cancellation requested", task_id=task_id, reason=reason)
            return True
        return False


def cleanup_cancellation_token(task_id: int) -> None:
    """Remove a cancellation token after workflow completion.

    Args:
        task_id: The task ID
    """
    with _token_lock:
        _active_tokens.pop(task_id, None)


def create_workflow(use_council_review: bool | None = None) -> StateGraph[WorkflowState]:
    """Create the multi-agent coding workflow graph.

    In Phase 1, this was a simple linear graph:
        START -> planner -> END

    In Phase 2, it's a full pipeline with review loop:
        START -> planner -> coder -> tester -> reviewer -> (conditional) -> coder or END

    Current features:
        - Council-based review with multiple judges (when use_council_review=True)
        - Enhanced routing with confidence-based decisions

    Args:
        use_council_review: Whether to use council-based review. If None, uses
                           settings.use_council_review (defaults to True).

    Returns:
        Compiled StateGraph ready for execution

    TODO: Make graph compilation conditional on environment config (Phase 4)
    TODO: Add error handling node for failure recovery (Phase 4)
    """
    # Determine if we should use council review
    if use_council_review is None:
        use_council_review = getattr(settings, "use_council_review", True)

    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("tester", tester_node)

    # Use council reviewer or standard reviewer based on config
    if use_council_review:
        workflow.add_node("reviewer", council_reviewer_node)
        logger.info("Using council-based reviewer with multiple judges")
    else:
        workflow.add_node("reviewer", reviewer_node)
        logger.info("Using standard single-judge reviewer")

    # Add edges for Phase 2 flow with review loop
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "coder")
    workflow.add_edge("coder", "tester")
    workflow.add_edge("tester", "reviewer")

    # Add conditional routing after reviewer
    # Routes based on reviewer verdict and iteration limit
    def route_after_review(state: WorkflowState) -> str:
        """Determine next node based on reviewer verdict and iteration limits.

        The workflow will only loop back to the coder if:
        1. The reviewer verdict is REVISE
        2. We haven't exceeded the maximum review iterations

        Supports both standard and council-based review verdicts.

        Args:
            state: Current workflow state with review_feedback and iterations

        Returns:
            "coder" if REVISE and iterations < MAX, otherwise "END"
        """
        # Get verdict - check metadata first (council/structured), then feedback text
        metadata = state.get("metadata", {})
        verdict = metadata.get("verdict", "")

        # Fallback to checking feedback text for legacy compatibility
        if not verdict:
            feedback = state.get("review_feedback", "").upper()
            if "REVISE" in feedback:
                verdict = "REVISE"
            elif "APPROVE" in feedback:
                verdict = "APPROVE"
            elif "REJECT" in feedback:
                verdict = "REJECT"

        iterations = state.get("iterations", 0)
        confidence = metadata.get("confidence_score", 1.0)

        # Check if we should loop back to coder for revisions
        if verdict == "REVISE" and iterations < MAX_REVIEW_ITERATIONS:
            logger.info(
                "Routing back to coder for revision",
                task_id=state.get("task_id"),
                iteration=iterations + 1,
                max_iterations=MAX_REVIEW_ITERATIONS,
                verdict=verdict,
                confidence=confidence,
            )
            return "coder"

        # End workflow if approved, rejected, or max iterations reached
        if iterations >= MAX_REVIEW_ITERATIONS and verdict == "REVISE":
            logger.warning(
                "Maximum review iterations reached",
                task_id=state.get("task_id"),
                iterations=iterations,
                max_iterations=MAX_REVIEW_ITERATIONS,
            )
            state["status"] = "complete"  # Mark as complete despite revision feedback
            state["review_feedback"] += (
                f"\n\n[Note: Maximum revisions ({MAX_REVIEW_ITERATIONS}) reached]"
            )

        logger.info(
            "Workflow completing",
            task_id=state.get("task_id"),
            verdict=verdict,
            confidence=confidence,
            iterations=iterations,
        )

        return END

    workflow.add_conditional_edges("reviewer", route_after_review)

    reviewer_type = "council" if use_council_review else "standard"
    logger.info(
        "Created workflow graph",
        nodes=["planner", "coder", "tester", "reviewer"],
        reviewer_type=reviewer_type,
        edges=["START->planner->coder->tester->reviewer", "reviewer->(conditional)->coder/END"],
    )

    return workflow


def get_compiled_graph() -> Any:
    """Get a compiled graph ready for execution.

    This is the entry point for running the workflow. The graph can be
    executed with:
        - ainvoke() for single execution
        - astream() for streaming output
        - astream_events() for detailed event tracking

    Returns:
        Compiled StateGraph

    TODO: Add checkpointer when available (Phase 4)
    """
    workflow = create_workflow()

    # TODO: Add checkpointer integration here (Phase 4)
    # from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    # checkpointer = AsyncPostgresSaver(pool)
    # compiled = workflow.compile(checkpointer=checkpointer)

    compiled = workflow.compile()

    logger.info("Compiled workflow graph")

    return compiled


async def invoke_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
    cancellation_token: CancellationToken | None = None,
) -> WorkflowState:
    """Execute the complete workflow and return final state.

    This function executes the complete multi-agent workflow with optional timeout
    and cancellation support. If the workflow exceeds the timeout or is cancelled,
    execution is stopped and an appropriate error state is returned.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task in the database
        thread_id: Optional thread ID for resuming checkpointed execution
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records
        cancellation_token: Optional token for cancellation support

    Returns:
        Final workflow state with all accumulated results

    Raises:
        asyncio.TimeoutError: If workflow exceeds timeout
        WorkflowCancelledError: If workflow is cancelled

    TODO: Add checkpoint save on timeout (Phase 4)
    """
    logger.info(
        "Invoking workflow",
        task_id=task_id,
        has_thread_id=thread_id is not None,
        timeout_seconds=timeout_seconds or WORKFLOW_TIMEOUT_SECONDS,
        tracking_enabled=db is not None,
    )

    graph = get_compiled_graph()
    timeout = timeout_seconds or WORKFLOW_TIMEOUT_SECONDS

    initial_state: WorkflowState = {
        "messages": [],
        "task_id": task_id,
        "task_description": task_description,
        "plan": "",
        "code": "",
        "code_files": {},
        "test_results": "",
        "test_analysis": {},
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {
            "workflow_started_at": datetime.now(UTC).isoformat(),
            "thread_id": thread_id,
            "timeout_seconds": timeout,
        },
    }

    config: dict[str, Any] = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    # Add tracking callback if database session provided
    tracker = None
    if db is not None:
        from src.agents.infrastructure.tracking import AgentRunTracker

        tracker = AgentRunTracker(db=db, task_id=task_id)
        config["callbacks"] = [tracker]

    # Get or use provided cancellation token
    token = cancellation_token or get_cancellation_token(task_id)

    # Store cancellation check in metadata for nodes to access
    initial_state["metadata"]["cancellation_token_id"] = task_id

    try:
        # Check for pre-cancellation
        token.raise_if_cancelled()

        result: WorkflowState = await asyncio.wait_for(
            graph.ainvoke(initial_state, config), timeout=timeout
        )

        # Check for cancellation after completion
        if token.is_cancelled:
            raise WorkflowCancelledError(token.cancel_reason or "Workflow cancelled")

        logger.info(
            "Workflow execution completed", task_id=task_id, final_status=result.get("status")
        )
        return result

    except WorkflowCancelledError as e:
        logger.warning(
            "Workflow cancelled",
            task_id=task_id,
            reason=str(e),
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Return state with cancellation information
        initial_state["error"] = f"Workflow cancelled: {e}"
        initial_state["status"] = "cancelled"
        initial_state["metadata"]["workflow_cancelled_at"] = datetime.now(UTC).isoformat()
        initial_state["metadata"]["cancel_reason"] = str(e)
        return initial_state

    except TimeoutError:
        logger.error(
            "Workflow execution timeout",
            task_id=task_id,
            timeout_seconds=timeout,
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Return state with error information
        initial_state["error"] = f"Workflow execution exceeded timeout of {timeout} seconds"
        initial_state["status"] = "timeout"
        initial_state["metadata"]["workflow_timeout_at"] = datetime.now(UTC).isoformat()
        return initial_state

    finally:
        # Cleanup the cancellation token
        cleanup_cancellation_token(task_id)


async def stream_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
) -> Any:
    """Stream workflow execution with full event tracking and timeout.

    This streams detailed execution events from the graph, useful for
    sending real-time updates to the frontend via SSE. If the workflow
    exceeds the timeout, streaming stops and a timeout event is yielded.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task
        thread_id: Optional thread ID for resumable execution
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records

    Yields:
        Events from the workflow (node starts, LLM tokens, node completions)
        On timeout, yields an error event before stopping

    TODO: Document event format and types
    TODO: Add event filtering and sampling options
    """
    logger.info(
        "Starting workflow stream",
        task_id=task_id,
        has_thread_id=thread_id is not None,
        timeout_seconds=timeout_seconds or WORKFLOW_TIMEOUT_SECONDS,
        tracking_enabled=db is not None,
    )

    graph = get_compiled_graph()
    timeout = timeout_seconds or WORKFLOW_TIMEOUT_SECONDS

    initial_state: WorkflowState = {
        "messages": [],
        "task_id": task_id,
        "task_description": task_description,
        "plan": "",
        "code": "",
        "code_files": {},
        "test_results": "",
        "test_analysis": {},
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {
            "workflow_started_at": datetime.now(UTC).isoformat(),
            "thread_id": thread_id,
            "timeout_seconds": timeout,
        },
    }

    config: dict[str, Any] = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    # Add tracking callback if database session provided
    tracker = None
    if db is not None:
        from src.agents.infrastructure.tracking import AgentRunTracker

        tracker = AgentRunTracker(db=db, task_id=task_id)
        config["callbacks"] = [tracker]

    try:
        async with asyncio.timeout(timeout):
            async for event in graph.astream_events(initial_state, config, version="v2"):
                yield event
    except TimeoutError:
        logger.error(
            "Workflow stream timeout",
            task_id=task_id,
            timeout_seconds=timeout,
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Yield a timeout error event
        yield {
            "type": "error",
            "data": {
                "error": f"Workflow execution exceeded timeout of {timeout} seconds",
                "task_id": task_id,
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }

    logger.info("Workflow stream completed", task_id=task_id)
