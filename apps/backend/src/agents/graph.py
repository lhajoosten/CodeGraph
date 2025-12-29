"""LangGraph workflow definitions for agent orchestration.

This module defines the StateGraph that orchestrates all agent nodes in the
multi-agent coding workflow. The workflow includes planner, coder, tester,
and reviewer nodes with conditional routing for review loops and iteration limits.

Features:
- Council-based review with multiple judges (optional, config-driven)
- Enhanced routing with confidence-based decisions
- Error recovery with retry and fallback strategies
- Checkpointing for workflow persistence and resumption

Related modules:
- cancellation.py: Workflow cancellation support
- interrupts.py: Human-in-the-loop interrupt support
- resilience.py: Error recovery and retry logic
- execution.py: Workflow invocation and streaming

Supervisor pattern available via create_supervised_workflow() for dynamic routing.
"""

from collections.abc import Callable
from typing import Any

from langgraph.graph import END, START, StateGraph

from src.agents.council.node import council_reviewer_node
from src.agents.nodes.coder import coder_node
from src.agents.nodes.planner import planner_node
from src.agents.nodes.reviewer import reviewer_node
from src.agents.nodes.tester import tester_node
from src.agents.resilience import create_resilient_node, reset_workflow_error_handler
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Workflow configuration constants
MAX_REVIEW_ITERATIONS = 3  # Maximum number of coder revisions after review feedback


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

    Example:
        workflow = create_workflow()
        graph = workflow.compile()
        result = await graph.ainvoke(initial_state, config)
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
        logger.info("Use get_compiled_graph_with_checkpointer() for async initialization")
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
