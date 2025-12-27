"""LangGraph workflow definitions for agent orchestration.

This module defines the StateGraph that orchestrates all agent nodes in the
multi-agent coding workflow. In Phase 1, it's a simple linear flow from
planner to completion. Phase 2 will add coder, tester, and reviewer nodes
with conditional routing for review loops.

TODO: Add coder, tester, reviewer nodes (Phase 2)
TODO: Add conditional routing for review loops (Phase 2)
TODO: Add supervisor pattern for node orchestration (Phase 2)
TODO: Add checkpointer integration (Phase 4)
"""

from typing import Any

from langgraph.graph import END, START, StateGraph

from src.agents.planner import planner_node
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)


def create_workflow() -> StateGraph[WorkflowState]:
    """Create the multi-agent coding workflow graph.

    In Phase 1, this is a simple linear graph:
        START -> planner -> END

    In Phase 2, it will expand to:
        START -> planner -> coder -> tester -> reviewer -> (conditional) -> END

    Returns:
        Compiled StateGraph ready for execution

    TODO: Make graph compilation conditional on environment config (Phase 4)
    TODO: Add error handling node for failure recovery (Phase 3)
    """
    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    # TODO: Add coder node (Phase 2)
    # workflow.add_node("coder", coder_node)
    # TODO: Add tester node (Phase 2)
    # workflow.add_node("tester", tester_node)
    # TODO: Add reviewer node (Phase 2)
    # workflow.add_node("reviewer", reviewer_node)

    # Add edges
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", END)
    # TODO: Add conditional routing after planner (Phase 2)
    # workflow.add_edge("planner", "coder")
    # workflow.add_edge("coder", "tester")
    # workflow.add_edge("tester", "reviewer")
    # workflow.add_conditional_edges("reviewer", route_after_review, {...})

    logger.info("Created workflow graph", nodes=["planner"], edges=["START->planner->END"])

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
) -> WorkflowState:
    """Execute the complete workflow and return final state.

    This is a synchronous wrapper around the graph execution for simple
    use cases where you want to wait for the complete workflow result.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task in the database
        thread_id: Optional thread ID for resuming checkpointed execution

    Returns:
        Final workflow state with all accumulated results

    TODO: Add error handling and recovery (Phase 2)
    TODO: Add timeout handling (Phase 3)
    """
    logger.info("Invoking workflow", task_id=task_id, has_thread_id=thread_id is not None)

    graph = get_compiled_graph()

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
            "workflow_started_at": __import__("datetime").datetime.utcnow().isoformat(),
            "thread_id": thread_id,
        },
    }

    config: dict[str, Any] = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    result: WorkflowState = await graph.ainvoke(initial_state, config)

    logger.info("Workflow execution completed", task_id=task_id, final_status=result.get("status"))

    return result


async def stream_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
) -> Any:
    """Stream workflow execution with full event tracking.

    This streams detailed execution events from the graph, useful for
    sending real-time updates to the frontend via SSE.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task
        thread_id: Optional thread ID for resumable execution

    Yields:
        Events from the workflow (node starts, LLM tokens, node completions)

    TODO: Document event format and types (Phase 2)
    TODO: Add event filtering and sampling options (Phase 2)
    """
    logger.info("Starting workflow stream", task_id=task_id, has_thread_id=thread_id is not None)

    graph = get_compiled_graph()

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
            "workflow_started_at": __import__("datetime").datetime.utcnow().isoformat(),
            "thread_id": thread_id,
        },
    }

    config = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    async for event in graph.astream_events(initial_state, config, version="v2"):
        yield event

    logger.info("Workflow stream completed", task_id=task_id)
