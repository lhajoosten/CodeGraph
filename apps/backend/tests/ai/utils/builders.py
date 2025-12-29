"""Test data builders for AI agent tests.

Provides fluent builder for constructing WorkflowState instances.
"""

from typing import Any

from src.agents.state import WorkflowState


class WorkflowStateBuilder:
    """Fluent builder for creating WorkflowState instances.

    Example:
        state = (
            WorkflowStateBuilder()
            .with_task_id(123)
            .with_description("Create API endpoint")
            .with_status("planning")
            .build()
        )
    """

    def __init__(self) -> None:
        """Initialize the builder with default values."""
        self._state: dict[str, Any] = {
            "messages": [],
            "task_id": 1,
            "task_description": "",
            "plan": "",
            "code": "",
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {},
        }

    def with_task_id(self, task_id: int) -> "WorkflowStateBuilder":
        """Set the task ID."""
        self._state["task_id"] = task_id
        return self

    def with_description(self, description: str) -> "WorkflowStateBuilder":
        """Set the task description."""
        self._state["task_description"] = description
        return self

    def with_plan(self, plan: str) -> "WorkflowStateBuilder":
        """Set the execution plan."""
        self._state["plan"] = plan
        return self

    def with_code(self, code: str) -> "WorkflowStateBuilder":
        """Set the generated code."""
        self._state["code"] = code
        return self

    def with_test_results(self, results: str) -> "WorkflowStateBuilder":
        """Set the test results."""
        self._state["test_results"] = results
        return self

    def with_review_feedback(self, feedback: str) -> "WorkflowStateBuilder":
        """Set the review feedback."""
        self._state["review_feedback"] = feedback
        return self

    def with_status(self, status: str) -> "WorkflowStateBuilder":
        """Set the workflow status."""
        valid_statuses = [
            "planning",
            "coding",
            "testing",
            "reviewing",
            "complete",
            "timeout",
            "cancelled",
            "error",
        ]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")
        self._state["status"] = status
        return self

    def with_code_files(self, code_files: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the code files dictionary."""
        self._state["code_files"] = code_files
        return self

    def with_test_analysis(self, test_analysis: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the test analysis dictionary."""
        self._state["test_analysis"] = test_analysis
        return self

    def with_iterations(self, count: int) -> "WorkflowStateBuilder":
        """Set the iteration count."""
        self._state["iterations"] = count
        return self

    def with_error(self, error: str | None) -> "WorkflowStateBuilder":
        """Set the error message."""
        self._state["error"] = error
        return self

    def with_metadata(self, metadata: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the metadata."""
        self._state["metadata"] = metadata
        return self

    def add_metadata(self, key: str, value: Any) -> "WorkflowStateBuilder":
        """Add a single metadata entry."""
        self._state["metadata"][key] = value
        return self

    def build(self) -> WorkflowState:
        """Build the WorkflowState."""
        return self._state  # type: ignore[return-value]
