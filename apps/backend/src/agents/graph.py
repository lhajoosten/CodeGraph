"""LangGraph workflow definitions for agent orchestration.

This module defines the StateGraph that orchestrates all agent nodes in the
multi-agent coding workflow. The workflow includes planner, coder, tester,
and reviewer nodes with conditional routing for review loops and iteration limits.

Features:
- Council-based review with multiple judges (optional, config-driven)
- Enhanced routing with confidence-based decisions
- Detailed metrics collection
- Graceful cancellation support
- Error recovery with retry and fallback strategies
- Checkpointing for workflow persistence and resumption

TODO: Add supervisor pattern for node orchestration (Phase 4)
TODO: Add workflow interrupts for user intervention (Phase 4)
"""

import asyncio
import threading
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from functools import wraps
from typing import TYPE_CHECKING, Any

from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph

from src.agents.council.node import council_reviewer_node
from src.agents.infrastructure.error_handler import ErrorHandler, ErrorType, RecoveryAction
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

# Type alias for node functions
NodeFunction = Callable[[WorkflowState, RunnableConfig | None], Awaitable[dict[str, Any]]]

# Global error handler instance for the workflow
_workflow_error_handler = ErrorHandler()


def create_resilient_node(
    node_fn: NodeFunction,
    node_name: str,
    model_tier: str = "sonnet",
) -> NodeFunction:
    """Wrap a node function with error recovery capabilities.

    This wrapper integrates the ErrorHandler to provide:
    - Automatic retry with exponential backoff for transient errors
    - Error classification and appropriate recovery strategies
    - State truncation for context length errors
    - Graceful degradation with fallback to simpler models

    Args:
        node_fn: The original node async function
        node_name: Name of the node for tracking/logging
        model_tier: Current model tier for fallback decisions

    Returns:
        Wrapped node function with error recovery

    Example:
        resilient_planner = create_resilient_node(planner_node, "planner")
        workflow.add_node("planner", resilient_planner)
    """

    @wraps(node_fn)
    async def resilient_wrapper(
        state: WorkflowState, config: RunnableConfig | None = None
    ) -> dict[str, Any]:
        handler = _workflow_error_handler
        current_state = state
        last_error: Exception | None = None

        while True:
            try:
                result = await node_fn(current_state, config)

                # Reset retry counts on success
                handler.reset_retries(node_name)

                # Add error recovery metadata if we recovered from errors
                if last_error is not None:
                    result.setdefault("metadata", {})
                    result["metadata"]["recovered_from_error"] = True
                    result["metadata"]["recovery_error_type"] = str(type(last_error).__name__)

                return result

            except Exception as e:
                last_error = e
                recovery = handler.handle_error(e, node_name, current_state, model_tier)

                if recovery.should_retry:
                    logger.info(
                        "Node error - retrying",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        delay=recovery.retry_delay_seconds,
                        attempt=recovery.current_retry,
                        max_retries=recovery.max_retries,
                    )

                    if recovery.retry_delay_seconds > 0:
                        await asyncio.sleep(recovery.retry_delay_seconds)

                    # Use modified state if provided (e.g., truncated for context length)
                    if recovery.modified_state:
                        current_state = recovery.modified_state  # type: ignore[assignment]
                    continue

                elif recovery.should_fallback:
                    logger.warning(
                        "Node error - fallback required",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        fallback_tier=recovery.fallback_model_tier,
                    )
                    # For now, re-raise with context - future: implement model tier switching
                    raise RuntimeError(
                        f"Fallback to {recovery.fallback_model_tier} required: {e}"
                    ) from e

                else:
                    # No recovery possible - add error to state and return
                    logger.error(
                        "Node error - recovery exhausted",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        error=str(e),
                    )

                    return {
                        "error": f"Node '{node_name}' failed: {e}",
                        "status": "error",
                        "metadata": {
                            **(state.get("metadata", {})),
                            "error_node": node_name,
                            "error_type": recovery.error_type.value,
                            "error_message": str(e),
                            "recovery_exhausted": True,
                        },
                    }

    return resilient_wrapper


def reset_workflow_error_handler() -> None:
    """Reset the workflow error handler retry counts.

    Call this at the start of a new workflow execution to ensure
    clean retry state.
    """
    _workflow_error_handler.reset_retries()


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


def create_workflow(
    use_council_review: bool | None = None,
    use_error_recovery: bool | None = None,
) -> StateGraph[WorkflowState]:
    """Create the multi-agent coding workflow graph.

    In Phase 1, this was a simple linear graph:
        START -> planner -> END

    In Phase 2, it's a full pipeline with review loop:
        START -> planner -> coder -> tester -> reviewer -> (conditional) -> coder or END

    Current features:
        - Council-based review with multiple judges (when use_council_review=True)
        - Enhanced routing with confidence-based decisions
        - Error recovery with retry and fallback (when use_error_recovery=True)

    Args:
        use_council_review: Whether to use council-based review. If None, uses
                           settings.use_council_review (defaults to True).
        use_error_recovery: Whether to wrap nodes with error recovery. If None,
                           uses settings.enable_error_recovery (defaults to True).

    Returns:
        Compiled StateGraph ready for execution

    TODO: Make graph compilation conditional on environment config (Phase 4)
    """
    # Determine if we should use council review
    if use_council_review is None:
        use_council_review = getattr(settings, "use_council_review", True)

    # Determine if we should use error recovery
    if use_error_recovery is None:
        use_error_recovery = getattr(settings, "enable_error_recovery", True)

    workflow = StateGraph(WorkflowState)

    # Reset error handler for clean state
    if use_error_recovery:
        reset_workflow_error_handler()

    # Prepare node functions - optionally wrap with error recovery
    if use_error_recovery:
        planner = create_resilient_node(planner_node, "planner", "sonnet")
        coder = create_resilient_node(coder_node, "coder", "sonnet")
        tester = create_resilient_node(tester_node, "tester", "sonnet")
        reviewer = create_resilient_node(
            council_reviewer_node if use_council_review else reviewer_node,
            "reviewer",
            "sonnet",
        )
        logger.info("Using resilient nodes with error recovery")
    else:
        planner = planner_node
        coder = coder_node
        tester = tester_node
        reviewer = council_reviewer_node if use_council_review else reviewer_node

    # Add nodes
    workflow.add_node("planner", planner)
    workflow.add_node("coder", coder)
    workflow.add_node("tester", tester)
    workflow.add_node("reviewer", reviewer)

    # Log configuration
    if use_council_review:
        logger.info("Using council-based reviewer with multiple judges")
    else:
        logger.info("Using standard single-judge reviewer")

    # Helper function to check for error state and route accordingly
    def route_or_end_on_error(next_node: str) -> Callable[[WorkflowState], str]:
        """Create a routing function that ends workflow on error.

        Args:
            next_node: The node to route to if no error

        Returns:
            Routing function that checks for errors
        """

        def router(state: WorkflowState) -> str:
            if state.get("status") == "error" or state.get("error"):
                logger.warning(
                    "Routing to END due to error state",
                    task_id=state.get("task_id"),
                    error=state.get("error"),
                )
                return END
            return next_node

        return router

    # Add edges with error checking
    workflow.add_edge(START, "planner")
    workflow.add_conditional_edges("planner", route_or_end_on_error("coder"))
    workflow.add_conditional_edges("coder", route_or_end_on_error("tester"))
    workflow.add_conditional_edges("tester", route_or_end_on_error("reviewer"))

    # Add conditional routing after reviewer
    # Routes based on reviewer verdict, iteration limit, and error state
    def route_after_review(state: WorkflowState) -> str:
        """Determine next node based on reviewer verdict and iteration limits.

        The workflow will only loop back to the coder if:
        1. No error occurred
        2. The reviewer verdict is REVISE
        3. We haven't exceeded the maximum review iterations

        Supports both standard and council-based review verdicts.

        Args:
            state: Current workflow state with review_feedback and iterations

        Returns:
            "coder" if REVISE and iterations < MAX, otherwise "END"
        """
        # Check for error state first
        if state.get("status") == "error" or state.get("error"):
            logger.warning(
                "Workflow ending due to error",
                task_id=state.get("task_id"),
                error=state.get("error"),
            )
            return END

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


def get_compiled_graph(
    use_checkpointer: bool | None = None,
    checkpointer: Any | None = None,
) -> Any:
    """Get a compiled graph ready for execution.

    This is the entry point for running the workflow. The graph can be
    executed with:
        - ainvoke() for single execution
        - astream() for streaming output
        - astream_events() for detailed event tracking

    Args:
        use_checkpointer: Whether to enable checkpointing. If None, uses
            settings.enable_checkpointing (defaults to False).
            Checkpointing enables workflow persistence and resumption.
        checkpointer: Optional pre-configured checkpointer instance.
            If provided, use_checkpointer is ignored.

    Returns:
        Compiled StateGraph (with or without checkpointing)

    Note:
        When checkpointing is enabled, you must provide a thread_id in the
        config to enable state persistence:
            config = {"configurable": {"thread_id": "my-thread"}}
            result = await graph.ainvoke(state, config)
    """
    workflow = create_workflow()

    # Determine if we should use checkpointing
    if use_checkpointer is None:
        use_checkpointer = getattr(settings, "enable_checkpointing", False)

    if checkpointer is not None:
        compiled = workflow.compile(checkpointer=checkpointer)
        logger.info("Compiled workflow graph with provided checkpointer")
    elif use_checkpointer:
        # Import here to avoid circular imports and allow lazy loading
        logger.info("Checkpointing requested but must be initialized separately")
        logger.info(
            "Use get_compiled_graph_with_checkpointer() for async initialization"
        )
        compiled = workflow.compile()
    else:
        compiled = workflow.compile()
        logger.info("Compiled workflow graph (no checkpointing)")

    return compiled


async def get_compiled_graph_with_checkpointer() -> Any:
    """Get a compiled graph with AsyncPostgresSaver checkpointing enabled.

    This is an async version of get_compiled_graph() that initializes
    the PostgreSQL checkpointer for workflow persistence.

    Returns:
        Compiled StateGraph with checkpointing enabled

    Raises:
        ConnectionError: If unable to connect to PostgreSQL

    Example:
        graph = await get_compiled_graph_with_checkpointer()
        config = {"configurable": {"thread_id": f"task-{task_id}"}}
        result = await graph.ainvoke(initial_state, config)
    """
    from src.agents.infrastructure.checkpointer import get_checkpointer

    workflow = create_workflow()
    checkpointer = await get_checkpointer()
    compiled = workflow.compile(checkpointer=checkpointer)

    logger.info("Compiled workflow graph with AsyncPostgresSaver checkpointing")

    return compiled


async def invoke_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
    cancellation_token: CancellationToken | None = None,
    use_checkpointing: bool | None = None,
) -> WorkflowState:
    """Execute the complete workflow and return final state.

    This function executes the complete multi-agent workflow with optional timeout,
    cancellation, and checkpointing support. If the workflow exceeds the timeout
    or is cancelled, execution is stopped and an appropriate error state is returned.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task in the database
        thread_id: Optional thread ID for resuming checkpointed execution.
            When checkpointing is enabled, this ID is used to persist and
            resume workflow state.
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records
        cancellation_token: Optional token for cancellation support
        use_checkpointing: Whether to enable checkpointing for this workflow.
            If None, uses settings.enable_checkpointing. Requires thread_id to be set.

    Returns:
        Final workflow state with all accumulated results

    Raises:
        asyncio.TimeoutError: If workflow exceeds timeout
        WorkflowCancelledError: If workflow is cancelled
    """
    # Determine if we should use checkpointing
    if use_checkpointing is None:
        use_checkpointing = getattr(settings, "enable_checkpointing", False)

    # Checkpointing requires a thread_id
    if use_checkpointing and not thread_id:
        thread_id = f"task-{task_id}"
        logger.info(
            "Auto-generated thread_id for checkpointing",
            task_id=task_id,
            thread_id=thread_id,
        )

    logger.info(
        "Invoking workflow",
        task_id=task_id,
        has_thread_id=thread_id is not None,
        timeout_seconds=timeout_seconds or WORKFLOW_TIMEOUT_SECONDS,
        tracking_enabled=db is not None,
        checkpointing_enabled=use_checkpointing,
    )

    # Get compiled graph with or without checkpointing
    if use_checkpointing:
        graph = await get_compiled_graph_with_checkpointer()
    else:
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
