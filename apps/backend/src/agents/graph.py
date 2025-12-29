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
- Human-in-the-loop interrupts for plan approval and code review

Supervisor pattern available via create_supervised_workflow() for dynamic routing.
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


# =============================================================================
# Workflow Interrupts for Human-in-the-Loop
# =============================================================================


class InterruptPoint:
    """Defines points where the workflow can be interrupted for human review.

    Interrupt points allow human-in-the-loop workflows where users can:
    - Review and approve generated plans before coding
    - Review generated code before testing
    - Override reviewer decisions

    Usage:
        # Create workflow with interrupts
        workflow = create_workflow_with_interrupts(
            interrupt_before=["coder"],  # Pause after planning
        )

        # Compile with checkpointer (required for interrupts)
        checkpointer = await get_checkpointer()
        graph = workflow.compile(checkpointer=checkpointer, interrupt_before=["coder"])

        # First run - will pause after planner
        result = await graph.ainvoke(state, config)

        # Resume with optional modifications
        modified_state = result.copy()
        modified_state["plan"] = "Modified plan..."
        final_result = await graph.ainvoke(modified_state, config)
    """

    # Standard interrupt points
    AFTER_PLANNING = "coder"  # Interrupt before coder (after plan is ready)
    AFTER_CODING = "tester"  # Interrupt before tester (after code is ready)
    AFTER_TESTING = "reviewer"  # Interrupt before review (after tests ready)
    AFTER_REVIEW = "coder"  # Interrupt before revision (if REVISE verdict)

    @classmethod
    def all_points(cls) -> list[str]:
        """Get all available interrupt points (node names)."""
        return ["coder", "tester", "reviewer"]

    @classmethod
    def for_plan_approval(cls) -> list[str]:
        """Get interrupt points for plan approval workflow."""
        return ["coder"]

    @classmethod
    def for_code_review(cls) -> list[str]:
        """Get interrupt points for manual code review workflow."""
        return ["tester", "reviewer"]

    @classmethod
    def for_full_human_review(cls) -> list[str]:
        """Get all interrupt points for full human-in-the-loop workflow."""
        return cls.all_points()


class WorkflowInterruptedError(Exception):
    """Raised when a workflow is interrupted and waiting for human input.

    This is not an error condition - it indicates the workflow is paused
    and waiting for human review/approval before continuing.

    Attributes:
        interrupt_node: The node where the interrupt occurred
        state: The current workflow state at the interrupt point
        thread_id: The thread ID for resuming the workflow
    """

    def __init__(
        self,
        message: str,
        interrupt_node: str,
        state: WorkflowState,
        thread_id: str,
    ) -> None:
        super().__init__(message)
        self.interrupt_node = interrupt_node
        self.state = state
        self.thread_id = thread_id


def get_interrupt_status(state: WorkflowState) -> dict[str, Any]:
    """Get information about the current interrupt state.

    Useful for determining what user action is needed when a workflow
    is interrupted.

    Args:
        state: Current workflow state

    Returns:
        Dictionary with interrupt context:
        - stage: Current workflow stage (planning, coding, testing, reviewing)
        - awaiting: What type of input is awaited
        - content: The content to review (plan, code, etc.)
        - can_modify: Whether the content can be modified before resuming
    """
    status = state.get("status", "planning")

    if status == "planning" or (state.get("plan") and not state.get("code")):
        return {
            "stage": "plan_review",
            "awaiting": "plan_approval",
            "content": state.get("plan", ""),
            "can_modify": True,
            "description": "Review and optionally modify the execution plan before coding begins.",
        }
    elif status == "coding" or (state.get("code") and not state.get("test_results")):
        return {
            "stage": "code_review",
            "awaiting": "code_approval",
            "content": state.get("code", ""),
            "code_files": state.get("code_files", {}),
            "can_modify": True,
            "description": "Review generated code before testing.",
        }
    elif status == "testing" or (state.get("test_results") and not state.get("review_feedback")):
        return {
            "stage": "test_review",
            "awaiting": "test_approval",
            "content": state.get("test_results", ""),
            "test_analysis": state.get("test_analysis", {}),
            "can_modify": False,
            "description": "Review test results before final review.",
        }
    elif status == "reviewing":
        return {
            "stage": "review_override",
            "awaiting": "review_decision",
            "content": state.get("review_feedback", ""),
            "verdict": state.get("metadata", {}).get("verdict", ""),
            "can_modify": True,
            "description": "Override the reviewer's decision if needed.",
        }
    else:
        return {
            "stage": "unknown",
            "awaiting": "none",
            "content": "",
            "can_modify": False,
            "description": "Workflow is in an unknown state.",
        }


async def resume_workflow(
    graph: Any,
    thread_id: str,
    modifications: dict[str, Any] | None = None,
    action: str = "continue",
) -> WorkflowState:
    """Resume an interrupted workflow with optional modifications.

    Args:
        graph: The compiled workflow graph (must have checkpointer)
        thread_id: The thread ID of the interrupted workflow
        modifications: Optional state modifications to apply before resuming
        action: The action to take - "continue", "approve", "reject", or "modify"

    Returns:
        The final workflow state after resumption

    Raises:
        ValueError: If thread_id is not found or workflow is not interrupted

    Example:
        # Resume with plan modification
        result = await resume_workflow(
            graph,
            thread_id="task-123",
            modifications={"plan": "Modified plan..."},
            action="modify",
        )

        # Resume with approval (no modifications)
        result = await resume_workflow(
            graph,
            thread_id="task-123",
            action="approve",
        )
    """
    config = {"configurable": {"thread_id": thread_id}}

    # Get current state from checkpoint
    current_state = await graph.aget_state(config)

    if current_state is None:
        raise ValueError(f"No interrupted workflow found for thread_id: {thread_id}")

    # Check if there are pending tasks (interrupted state)
    if not current_state.next:
        logger.warning(
            "Workflow is not in interrupted state",
            thread_id=thread_id,
        )

    # Apply modifications if provided
    if modifications and action in ("modify", "continue"):
        logger.info(
            "Applying modifications to interrupted workflow",
            thread_id=thread_id,
            modified_fields=list(modifications.keys()),
        )
        await graph.aupdate_state(config, modifications)

    # Handle rejection
    if action == "reject":
        await graph.aupdate_state(
            config,
            {
                "status": "cancelled",
                "error": "Workflow rejected by user",
                "metadata": {
                    **current_state.values.get("metadata", {}),
                    "rejected_at": datetime.now(UTC).isoformat(),
                    "rejection_stage": current_state.values.get("status", "unknown"),
                },
            },
        )
        return await graph.aget_state(config)

    # Resume execution
    logger.info(
        "Resuming interrupted workflow",
        thread_id=thread_id,
        action=action,
        next_node=current_state.next[0] if current_state.next else "END",
    )

    # Continue execution with None to resume from interrupt
    result = await graph.ainvoke(None, config)

    return result


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


def create_supervised_workflow(
    use_council_review: bool | None = None,
    use_error_recovery: bool | None = None,
) -> StateGraph[WorkflowState]:
    """Create a workflow with supervisor-based dynamic routing.

    Unlike the standard workflow which has fixed edges, the supervised workflow
    uses a supervisor node to dynamically decide the next step based on
    the current state. This enables:

    - Skipping tests for simple tasks
    - Adding extra review cycles for security-sensitive code
    - Adaptive behavior based on intermediate results
    - Dynamic complexity-based routing

    The supervisor analyzes:
    - Plan complexity score
    - Security-related keywords in code
    - Current iteration count
    - Review verdicts

    Args:
        use_council_review: Whether to use council-based review
        use_error_recovery: Whether to wrap nodes with error recovery

    Returns:
        StateGraph with supervisor-based routing

    Example:
        workflow = create_supervised_workflow()
        graph = workflow.compile()

        # The supervisor will dynamically route based on state
        result = await graph.ainvoke(initial_state)
    """
    from src.agents.nodes.supervisor import (
        SupervisorConfig,
        create_supervisor_router,
        supervisor_node,
    )

    # Determine settings
    if use_council_review is None:
        use_council_review = getattr(settings, "use_council_review", True)

    if use_error_recovery is None:
        use_error_recovery = getattr(settings, "enable_error_recovery", True)

    workflow = StateGraph(WorkflowState)

    # Reset error handler for clean state
    if use_error_recovery:
        reset_workflow_error_handler()

    # Prepare node functions
    if use_error_recovery:
        planner = create_resilient_node(planner_node, "planner", "sonnet")
        coder = create_resilient_node(coder_node, "coder", "sonnet")
        tester = create_resilient_node(tester_node, "tester", "sonnet")
        reviewer = create_resilient_node(
            council_reviewer_node if use_council_review else reviewer_node,
            "reviewer",
            "sonnet",
        )
    else:
        planner = planner_node
        coder = coder_node
        tester = tester_node
        reviewer = council_reviewer_node if use_council_review else reviewer_node

    # Add all nodes including supervisor
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("planner", planner)
    workflow.add_node("coder", coder)
    workflow.add_node("tester", tester)
    workflow.add_node("reviewer", reviewer)

    # Start with supervisor
    workflow.add_edge(START, "supervisor")

    # Create supervisor router
    router = create_supervisor_router(SupervisorConfig())

    # All nodes route back to supervisor for next decision
    workflow.add_edge("planner", "supervisor")
    workflow.add_edge("coder", "supervisor")
    workflow.add_edge("tester", "supervisor")
    workflow.add_edge("reviewer", "supervisor")

    # Supervisor routes to next node or END
    workflow.add_conditional_edges(
        "supervisor",
        router,
        {
            "planner": "planner",
            "coder": "coder",
            "tester": "tester",
            "reviewer": "reviewer",
            "__end__": END,
        },
    )

    logger.info(
        "Created supervised workflow graph",
        nodes=["supervisor", "planner", "coder", "tester", "reviewer"],
        pattern="supervisor",
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


async def get_interruptible_graph(
    interrupt_before: list[str] | None = None,
    interrupt_after: list[str] | None = None,
) -> Any:
    """Get a compiled graph with interrupt support for human-in-the-loop workflows.

    Interrupts allow pausing the workflow at specific points for human review
    and approval. The workflow can then be resumed with optional modifications.

    Args:
        interrupt_before: List of node names to interrupt BEFORE execution.
            Common values: ["coder"] for plan approval, ["reviewer"] for code review.
        interrupt_after: List of node names to interrupt AFTER execution.
            Use this when you want to review a node's output before the next step.

    Returns:
        Compiled StateGraph with checkpointing and interrupts enabled

    Raises:
        ConnectionError: If unable to connect to PostgreSQL (checkpointing required)

    Example:
        # Create graph that pauses after planning for approval
        graph = await get_interruptible_graph(interrupt_before=["coder"])

        # Start workflow - will pause after planner completes
        config = {"configurable": {"thread_id": f"task-{task_id}"}}
        state = await graph.ainvoke(initial_state, config)

        # Review the plan...
        print(state["plan"])

        # Resume with approval (or modify plan first)
        final_state = await resume_workflow(graph, thread_id, action="approve")

    Note:
        Interrupts require checkpointing to be enabled. This function automatically
        initializes the AsyncPostgresSaver checkpointer.
    """
    from src.agents.infrastructure.checkpointer import get_checkpointer

    workflow = create_workflow()
    checkpointer = await get_checkpointer()

    # Build compile kwargs
    compile_kwargs: dict[str, Any] = {"checkpointer": checkpointer}

    if interrupt_before:
        compile_kwargs["interrupt_before"] = interrupt_before
        logger.info(
            "Workflow will interrupt before nodes",
            interrupt_before=interrupt_before,
        )

    if interrupt_after:
        compile_kwargs["interrupt_after"] = interrupt_after
        logger.info(
            "Workflow will interrupt after nodes",
            interrupt_after=interrupt_after,
        )

    compiled = workflow.compile(**compile_kwargs)

    logger.info(
        "Compiled interruptible workflow graph",
        has_interrupt_before=bool(interrupt_before),
        has_interrupt_after=bool(interrupt_after),
    )

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


class StreamEventType:
    """Event types emitted during workflow streaming.

    Use these constants to filter events in stream_workflow.

    Categories:
    - Graph events: on_chain_start, on_chain_end, on_chain_error
    - Node events: on_node_start, on_node_end
    - LLM events: on_llm_start, on_llm_end, on_llm_stream (tokens)
    - Tool events: on_tool_start, on_tool_end
    """

    # Graph lifecycle
    ON_CHAIN_START = "on_chain_start"
    ON_CHAIN_END = "on_chain_end"
    ON_CHAIN_ERROR = "on_chain_error"

    # Node execution
    ON_NODE_START = "on_node_start"
    ON_NODE_END = "on_node_end"

    # LLM interactions
    ON_LLM_START = "on_llm_start"
    ON_LLM_END = "on_llm_end"
    ON_LLM_STREAM = "on_llm_stream"  # Token-by-token streaming

    # Tool usage
    ON_TOOL_START = "on_tool_start"
    ON_TOOL_END = "on_tool_end"

    @classmethod
    def all_types(cls) -> list[str]:
        """Get all event types."""
        return [
            cls.ON_CHAIN_START,
            cls.ON_CHAIN_END,
            cls.ON_CHAIN_ERROR,
            cls.ON_NODE_START,
            cls.ON_NODE_END,
            cls.ON_LLM_START,
            cls.ON_LLM_END,
            cls.ON_LLM_STREAM,
            cls.ON_TOOL_START,
            cls.ON_TOOL_END,
        ]

    @classmethod
    def node_events(cls) -> list[str]:
        """Get only node-related events."""
        return [cls.ON_NODE_START, cls.ON_NODE_END]

    @classmethod
    def llm_events(cls) -> list[str]:
        """Get only LLM-related events."""
        return [cls.ON_LLM_START, cls.ON_LLM_END, cls.ON_LLM_STREAM]

    @classmethod
    def progress_events(cls) -> list[str]:
        """Get events useful for progress tracking (minimal set)."""
        return [cls.ON_NODE_START, cls.ON_NODE_END, cls.ON_CHAIN_END]


def filter_stream_events(
    event: dict[str, Any],
    include_types: list[str] | None = None,
    exclude_types: list[str] | None = None,
    include_nodes: list[str] | None = None,
) -> bool:
    """Filter streaming events based on criteria.

    Args:
        event: The event to check
        include_types: If set, only include these event types
        exclude_types: If set, exclude these event types
        include_nodes: If set, only include events from these nodes

    Returns:
        True if the event should be included, False otherwise

    Example:
        # Only get node completion events
        async for event in stream_workflow(...):
            if filter_stream_events(event, include_types=["on_node_end"]):
                print(f"Node completed: {event['name']}")

        # Exclude streaming tokens (reduce noise)
        async for event in stream_workflow(...):
            if filter_stream_events(event, exclude_types=["on_llm_stream"]):
                process_event(event)
    """
    event_type = event.get("event", "")

    # Check type inclusion
    if include_types and event_type not in include_types:
        return False

    # Check type exclusion
    if exclude_types and event_type in exclude_types:
        return False

    # Check node filtering
    if include_nodes:
        event_name = event.get("name", "")
        # Check if event is related to one of the included nodes
        if not any(node in event_name for node in include_nodes):
            return False

    return True


async def stream_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
    event_filter: list[str] | None = None,
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
        event_filter: Optional list of event types to include. If None, yields all events.
            Use StreamEventType constants for filtering.

    Yields:
        Events from the workflow. Each event is a dict with:
        - event: Event type (see StreamEventType)
        - name: Name of the component (node name, chain name, etc.)
        - data: Event-specific data
        - run_id: UUID of the run
        - parent_ids: List of parent run IDs
        - tags: List of tags for the event

        Common event structures:
        - on_node_start: {"input": {...}, "name": "planner"}
        - on_node_end: {"output": {...}, "name": "planner"}
        - on_llm_stream: {"chunk": "token text"}
        - on_chain_end: {"output": {...}}  # Final result
        - error: {"error": "message", "task_id": int}  # On timeout/error

    Example:
        # Full streaming with all events
        async for event in stream_workflow("Build auth", task_id=123):
            if event.get("event") == "on_node_end":
                print(f"Completed: {event['name']}")

        # Only node events (less noise)
        async for event in stream_workflow(
            "Build auth", task_id=123,
            event_filter=StreamEventType.progress_events()
        ):
            update_progress_bar(event)

        # Filter with helper function
        async for event in stream_workflow("Build auth", task_id=123):
            if filter_stream_events(event, exclude_types=["on_llm_stream"]):
                process_event(event)
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
                # Apply event filtering if specified
                if event_filter is not None:
                    event_type = event.get("event", "")
                    if event_type not in event_filter:
                        continue
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
