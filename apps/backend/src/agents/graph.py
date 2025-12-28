"""LangGraph workflow definitions for agent orchestration.

This module defines the StateGraph that orchestrates all agent nodes in the
multi-agent coding workflow. In Phase 1, it's a simple linear flow from
planner to completion. Phase 2 adds coder, tester, and reviewer nodes
with conditional routing for review loops and iteration limits.

TODO: Add supervisor pattern for node orchestration (Phase 3)
TODO: Add checkpointer integration (Phase 4)
TODO: Add workflow interrupts for user intervention (Phase 4)
"""

import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from langgraph.graph import END, START, StateGraph

from src.agents.coder import coder_node
from src.agents.planner import planner_node
from src.agents.reviewer import reviewer_node
from src.agents.state import WorkflowState
from src.agents.tester import tester_node
from src.core.logging import get_logger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

# Workflow configuration constants
MAX_REVIEW_ITERATIONS = 3  # Maximum number of coder revisions after review feedback
WORKFLOW_TIMEOUT_SECONDS = 300  # 5 minutes total workflow timeout


def create_workflow() -> StateGraph[WorkflowState]:
    """Create the multi-agent coding workflow graph.

    In Phase 1, this was a simple linear graph:
        START -> planner -> END

    In Phase 2 (current), it's a full pipeline with review loop:
        START -> planner -> coder -> tester -> reviewer -> (conditional) -> coder or END

    In Phase 3, it will add:
        - Council-based review with multiple judges
        - Supervisor pattern for orchestration

    Returns:
        Compiled StateGraph ready for execution

    TODO: Make graph compilation conditional on environment config (Phase 4)
    TODO: Add error handling node for failure recovery (Phase 3)
    TODO: Add council review (Phase 3)
    """
    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("tester", tester_node)
    workflow.add_node("reviewer", reviewer_node)

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

        Args:
            state: Current workflow state with review_feedback and iterations

        Returns:
            "coder" if REVISE and iterations < MAX, otherwise "END"

        TODO: Add feedback to state when max iterations reached (Phase 3)
        """
        feedback = state.get("review_feedback", "").upper()
        iterations = state.get("iterations", 0)

        # Check if we should loop back to coder for revisions
        if "REVISE" in feedback and iterations < MAX_REVIEW_ITERATIONS:
            logger.info(
                "Routing back to coder for revision",
                task_id=state.get("task_id"),
                iteration=iterations + 1,
                max_iterations=MAX_REVIEW_ITERATIONS,
            )
            return "coder"

        # End workflow if approved, rejected, or max iterations reached
        if iterations >= MAX_REVIEW_ITERATIONS and "REVISE" in feedback:
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

        return END

    workflow.add_conditional_edges("reviewer", route_after_review)

    logger.info(
        "Created workflow graph",
        nodes=["planner", "coder", "tester", "reviewer"],
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
) -> WorkflowState:
    """Execute the complete workflow and return final state.

    This function executes the complete multi-agent workflow with optional timeout.
    If the workflow exceeds the timeout, execution is cancelled and an error is returned.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task in the database
        thread_id: Optional thread ID for resuming checkpointed execution
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records

    Returns:
        Final workflow state with all accumulated results

    Raises:
        asyncio.TimeoutError: If workflow exceeds timeout

    TODO: Add graceful cancellation handling (Phase 3)
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
        "test_results": "",
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
        from src.agents.tracking import AgentRunTracker

        tracker = AgentRunTracker(db=db, task_id=task_id)
        config["callbacks"] = [tracker]

    try:
        result: WorkflowState = await asyncio.wait_for(
            graph.ainvoke(initial_state, config), timeout=timeout
        )
        logger.info(
            "Workflow execution completed", task_id=task_id, final_status=result.get("status")
        )
        return result
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

    TODO: Document event format and types (Phase 3)
    TODO: Add event filtering and sampling options (Phase 3)
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
        "test_results": "",
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
        from src.agents.tracking import AgentRunTracker

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
