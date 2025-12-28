"""Workflow state definitions for LangGraph agent orchestration.

This module defines the shared state that flows through all agent nodes.
State is defined using TypedDict with annotated reducers that control how
updates merge across nodes without overwriting previous values.

TODO: Add state persistence integration with AsyncPostgresSaver (Phase 4)
TODO: Add metrics collection for council deliberation (Phase 3)
"""

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph.message import add_messages


class WorkflowState(TypedDict):
    """Shared state for the multi-agent coding workflow.

    This TypedDict defines all state shared across planning, coding, testing,
    and reviewing nodes. Uses Annotated with add_messages to accumulate LLM
    messages rather than overwriting them.

    Attributes:
        messages: Accumulated messages from all LLM calls in the workflow
        task_id: ID of the task being executed
        task_description: User-provided description of the coding task
        plan: Step-by-step plan created by the planner
        code: Generated code from the coder
        test_results: Results from running tests
        review_feedback: Feedback from the reviewer
        iterations: Counter for review loop iterations
        status: Current workflow status (planning -> coding -> testing -> reviewing -> complete)
        error: Error message if any step fails
        metadata: Additional context (timestamps, execution info, etc.)

    Example:
        state = {
            "task_id": 123,
            "task_description": "Create a FastAPI endpoint for user authentication",
            "messages": [...],
            "plan": "1. Design auth schema...",
            "code": "...",
            "status": "coding",
            ...
        }
    """

    messages: Annotated[list[Any], add_messages]
    task_id: int
    task_description: str
    plan: str
    code: str
    test_results: str
    review_feedback: str
    iterations: int
    status: Literal["planning", "coding", "testing", "reviewing", "complete", "timeout"]
    error: str | None
    metadata: dict[str, Any]


# TODO: Phase 2 - Add council state when implementing multi-model review
# class CouncilState(TypedDict):
#     """Extended state for council review with multiple judges."""
#     base_state: WorkflowState
#     judge_verdicts: dict[str, dict[str, Any]]  # judge_name -> verdict
#     council_conclusion: str
#     confidence_score: float
