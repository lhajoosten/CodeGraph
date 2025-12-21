"""LangGraph workflow definitions for agent orchestration."""

from typing import Any, TypedDict

from src.core.logging import get_logger

logger = get_logger(__name__)


class AgentState(TypedDict):
    """State shared across agent workflow nodes."""

    task_id: int
    description: str
    plan: list[str]
    code_changes: list[dict[str, Any]]
    test_results: dict[str, Any]
    current_step: int
    error: str | None


# TODO: Implement LangGraph workflows
# This is a placeholder for the full agent workflow implementation
# which will include planning, coding, testing, and reviewing nodes
