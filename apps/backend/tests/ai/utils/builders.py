"""Test data builders and factories for AI agent tests.

Provides fluent builders for constructing test data (WorkflowState, etc.)
without needing complex fixtures.

TODO: Add CodeBuilder for building test code (Phase 2)
TODO: Add PlanBuilder for building complex plans (Phase 2)
TODO: Add TestResultBuilder for test results (Phase 2)
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
        """Set the task ID.

        Args:
            task_id: ID of the task

        Returns:
            Self for chaining
        """
        self._state["task_id"] = task_id
        return self

    def with_description(self, description: str) -> "WorkflowStateBuilder":
        """Set the task description.

        Args:
            description: Task description

        Returns:
            Self for chaining
        """
        self._state["task_description"] = description
        return self

    def with_plan(self, plan: str) -> "WorkflowStateBuilder":
        """Set the execution plan.

        Args:
            plan: Execution plan

        Returns:
            Self for chaining
        """
        self._state["plan"] = plan
        return self

    def with_code(self, code: str) -> "WorkflowStateBuilder":
        """Set the generated code.

        Args:
            code: Generated code

        Returns:
            Self for chaining
        """
        self._state["code"] = code
        return self

    def with_test_results(self, results: str) -> "WorkflowStateBuilder":
        """Set the test results.

        Args:
            results: Test results

        Returns:
            Self for chaining
        """
        self._state["test_results"] = results
        return self

    def with_review_feedback(self, feedback: str) -> "WorkflowStateBuilder":
        """Set the review feedback.

        Args:
            feedback: Review feedback

        Returns:
            Self for chaining
        """
        self._state["review_feedback"] = feedback
        return self

    def with_status(self, status: str) -> "WorkflowStateBuilder":
        """Set the workflow status.

        Args:
            status: One of: planning, coding, testing, reviewing, complete, timeout, cancelled

        Returns:
            Self for chaining

        Raises:
            ValueError: If status is invalid
        """
        valid_statuses = [
            "planning",
            "coding",
            "testing",
            "reviewing",
            "complete",
            "timeout",
            "cancelled",
        ]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")
        self._state["status"] = status
        return self

    def with_code_files(self, code_files: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the code files dictionary.

        Args:
            code_files: Dictionary of code files with metadata

        Returns:
            Self for chaining
        """
        self._state["code_files"] = code_files
        return self

    def with_test_analysis(self, test_analysis: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the test analysis dictionary.

        Args:
            test_analysis: Test analysis with coverage and quality metrics

        Returns:
            Self for chaining
        """
        self._state["test_analysis"] = test_analysis
        return self

    def with_iterations(self, count: int) -> "WorkflowStateBuilder":
        """Set the iteration count.

        Args:
            count: Number of iterations

        Returns:
            Self for chaining
        """
        self._state["iterations"] = count
        return self

    def with_error(self, error: str | None) -> "WorkflowStateBuilder":
        """Set the error message.

        Args:
            error: Error message or None

        Returns:
            Self for chaining
        """
        self._state["error"] = error
        return self

    def with_metadata(self, metadata: dict[str, Any]) -> "WorkflowStateBuilder":
        """Set the metadata.

        Args:
            metadata: Metadata dictionary

        Returns:
            Self for chaining
        """
        self._state["metadata"] = metadata
        return self

    def add_metadata(self, key: str, value: Any) -> "WorkflowStateBuilder":
        """Add a single metadata entry.

        Args:
            key: Metadata key
            value: Metadata value

        Returns:
            Self for chaining
        """
        self._state["metadata"][key] = value
        return self

    def build(self) -> WorkflowState:
        """Build the WorkflowState.

        Returns:
            Constructed WorkflowState

        Raises:
            ValueError: If state is invalid
        """
        # Validate required fields
        if not self._state["task_description"]:
            raise ValueError("task_description is required")

        return self._state  # type: ignore[return-value]


class MockModelBuilder:
    """Builder for creating mock ChatAnthropic models.

    Example:
        model = (
            MockModelBuilder()
            .with_model_name("claude-haiku-4-5-20251001")
            .with_response("Generated plan")
            .build()
        )

    TODO: Add streaming response support (Phase 2)
    TODO: Add error response support (Phase 2)
    """

    def __init__(self) -> None:
        """Initialize the builder."""
        self._config: dict[str, Any] = {
            "model": "claude-haiku-4-5-20251001",
            "response": "",
            "tokens": 1000,
        }

    def with_model_name(self, name: str) -> "MockModelBuilder":
        """Set the model name.

        Args:
            name: Model name

        Returns:
            Self for chaining
        """
        self._config["model"] = name
        return self

    def with_response(self, response: str) -> "MockModelBuilder":
        """Set the model response.

        Args:
            response: Response text

        Returns:
            Self for chaining
        """
        self._config["response"] = response
        return self

    def with_tokens(self, count: int) -> "MockModelBuilder":
        """Set the token count.

        Args:
            count: Token count

        Returns:
            Self for chaining
        """
        self._config["tokens"] = count
        return self

    def build(self) -> dict[str, Any]:
        """Build the mock model configuration.

        Returns:
            Configuration dictionary

        Raises:
            ValueError: If required fields missing
        """
        if not self._config["response"]:
            raise ValueError("response is required")
        return self._config
