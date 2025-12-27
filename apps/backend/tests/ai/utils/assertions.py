"""Assertion helpers for AI agent tests.

Provides specialized assertions for testing workflow states, plan formats,
code generation, and other AI agent outputs.

TODO: Add assertions for test results (Phase 2)
TODO: Add assertions for review feedback (Phase 2)
TODO: Add assertions for error states (Phase 2)
"""

from typing import Any

from src.agents.state import WorkflowState


def assert_workflow_state_valid(state: WorkflowState) -> None:
    """Assert that a WorkflowState is valid and complete.

    Checks all required fields are present and have appropriate types.

    Args:
        state: WorkflowState to validate

    Raises:
        AssertionError: If state is invalid
    """
    assert isinstance(state, dict), "State must be a dictionary"
    assert "task_id" in state, "State must have task_id"
    assert "task_description" in state, "State must have task_description"
    assert "messages" in state, "State must have messages"
    assert "plan" in state, "State must have plan"
    assert "code" in state, "State must have code"
    assert "status" in state, "State must have status"
    assert isinstance(state["messages"], list), "messages must be a list"
    assert isinstance(state["task_id"], int), "task_id must be an integer"
    assert isinstance(state["task_description"], str), "task_description must be a string"


def assert_status_transition(old_status: str, new_status: str) -> None:
    """Assert that a status transition is valid.

    Args:
        old_status: Previous status
        new_status: New status

    Raises:
        AssertionError: If transition is invalid

    TODO: Add more detailed transition rules (Phase 2)
    """
    valid_statuses = ["planning", "coding", "testing", "reviewing", "complete"]
    assert old_status in valid_statuses, f"Invalid old status: {old_status}"
    assert new_status in valid_statuses, f"Invalid new status: {new_status}"

    # Define valid transitions
    valid_transitions = {
        "planning": ["coding"],
        "coding": ["testing"],
        "testing": ["reviewing"],
        "reviewing": ["coding", "complete"],
        "complete": [],
    }

    assert new_status in valid_transitions[old_status], (
        f"Invalid transition from {old_status} to {new_status}"
    )


def assert_plan_format(plan: str) -> None:
    """Assert that a plan follows expected format.

    Checks that plan has steps and is not empty.

    Args:
        plan: Plan text to validate

    Raises:
        AssertionError: If plan format is invalid

    TODO: Add stricter format validation (Phase 2)
    """
    assert plan, "Plan must not be empty"
    assert isinstance(plan, str), "Plan must be a string"
    assert len(plan) > 10, "Plan must have substantial content"


def assert_code_valid(code: str) -> None:
    """Assert that generated code is syntactically valid.

    Args:
        code: Code string to validate

    Raises:
        AssertionError: If code is invalid

    TODO: Add more rigorous code validation (Phase 2)
    """
    assert code, "Code must not be empty"
    assert isinstance(code, str), "Code must be a string"

    # Check basic Python syntax
    try:
        compile(code, "<generated>", "exec")
    except SyntaxError as e:
        raise AssertionError(f"Generated code has syntax error: {e}") from e


def assert_metadata_complete(metadata: dict[str, Any]) -> None:
    """Assert that metadata has expected fields.

    Args:
        metadata: Metadata dictionary to validate

    Raises:
        AssertionError: If metadata is incomplete

    TODO: Add phase-specific metadata validation (Phase 2)
    """
    assert isinstance(metadata, dict), "Metadata must be a dictionary"
    # Metadata can be partial, just ensure it's a valid dict
    for key in metadata.items():
        assert isinstance(key, str), f"Metadata keys must be strings, got {type(key)}"


def assert_messages_accumulated(messages: list[Any], expected_min: int = 1) -> None:
    """Assert that messages have been properly accumulated.

    Args:
        messages: List of messages
        expected_min: Minimum number of messages expected

    Raises:
        AssertionError: If messages are missing

    TODO: Add message content validation (Phase 2)
    """
    assert isinstance(messages, list), "Messages must be a list"
    assert len(messages) >= expected_min, (
        f"Expected at least {expected_min} messages, got {len(messages)}"
    )
