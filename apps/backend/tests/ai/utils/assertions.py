"""Custom assertions for AI agent testing.

Provides reusable assertions for validating workflow state, plans, code,
and other agent outputs.
"""

from typing import Any


def assert_status_transition(
    status: str,
    valid_states: list[str] | None = None,
) -> None:
    """Assert that a status is valid.

    Args:
        status: Current status value
        valid_states: List of valid status values (defaults to all workflow states)

    Raises:
        AssertionError: If status is invalid
    """
    if valid_states is None:
        valid_states = [
            "planning",
            "coding",
            "testing",
            "reviewing",
            "complete",
            "timeout",
            "cancelled",
            "error",
        ]

    assert status in valid_states, f"Invalid status '{status}'. Expected one of {valid_states}"


def assert_plan_format(
    plan: str,
    min_length: int = 10,
) -> None:
    """Assert that a plan has valid format.

    Args:
        plan: Plan content to validate
        min_length: Minimum plan length

    Raises:
        AssertionError: If plan format is invalid
    """
    assert plan, "Plan should not be empty"
    assert len(plan) >= min_length, f"Plan too short: {len(plan)} < {min_length}"


def assert_code_valid(
    code: str,
    min_length: int = 5,
) -> None:
    """Assert that code is valid.

    Args:
        code: Code to validate
        min_length: Minimum code length

    Raises:
        AssertionError: If code is invalid
    """
    assert code, "Code should not be empty"
    assert len(code) >= min_length, f"Code too short: {len(code)} < {min_length}"


def assert_metadata_complete(
    metadata: dict[str, Any],
    required_keys: list[str] | None = None,
) -> None:
    """Assert that metadata has expected structure.

    Args:
        metadata: Metadata dictionary
        required_keys: Optional list of required keys

    Raises:
        AssertionError: If metadata is incomplete
    """
    assert isinstance(metadata, dict), "Metadata should be a dictionary"

    if required_keys:
        for key in required_keys:
            assert key in metadata, f"Missing required metadata key: {key}"


def assert_metadata_has_timestamps(metadata: dict[str, Any]) -> None:
    """Assert that metadata contains timestamp fields.

    Args:
        metadata: Metadata dictionary

    Raises:
        AssertionError: If timestamps missing
    """
    timestamp_keys = [
        "plan_generated_at",
        "code_generated_at",
        "tests_generated_at",
    ]

    found = [k for k in timestamp_keys if k in metadata]
    assert len(found) > 0, f"No timestamp fields found. Expected one of: {timestamp_keys}"


def assert_messages_accumulated(
    messages: list[Any],
    min_count: int = 1,
    validate_content: bool = False,
) -> None:
    """Assert that messages have accumulated properly.

    Args:
        messages: List of messages
        min_count: Minimum expected message count
        validate_content: Whether to validate message content

    Raises:
        AssertionError: If messages are invalid
    """
    assert isinstance(messages, list), "Messages should be a list"
    assert len(messages) >= min_count, (
        f"Expected at least {min_count} messages, got {len(messages)}"
    )

    if validate_content:
        for msg in messages:
            # LangChain messages have 'content' attribute
            assert hasattr(msg, "content") or isinstance(msg, dict), (
                f"Invalid message type: {type(msg)}"
            )


def assert_workflow_state_valid(state: Any) -> None:
    """Assert that a workflow state has all required fields.

    Args:
        state: Workflow state to validate (dict or TypedDict)

    Raises:
        AssertionError: If state is missing required fields
    """
    required_fields = [
        "task_id",
        "task_description",
        "plan",
        "code",
        "code_files",
        "test_results",
        "test_analysis",
        "review_feedback",
        "status",
        "messages",
        "metadata",
        "iterations",
    ]

    # Handle both dict and TypedDict
    if hasattr(state, "keys"):
        state_keys = set(state.keys())
    else:
        state_keys = set(dir(state))

    for field in required_fields:
        assert field in state_keys, f"Missing required field: {field}"
