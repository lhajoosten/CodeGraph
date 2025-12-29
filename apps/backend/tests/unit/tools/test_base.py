"""Tests for tool base classes and utilities."""

import pytest

from src.tools.base import (
    ToolContext,
    ToolPermission,
    ToolResult,
    get_current_context,
    set_current_context,
)
from src.tools.exceptions import PermissionDeniedError


class TestToolPermission:
    """Tests for ToolPermission enum."""

    def test_permission_values(self) -> None:
        """Permission enum has expected values."""
        assert ToolPermission.READ.value == "read"
        assert ToolPermission.WRITE.value == "write"
        assert ToolPermission.EXECUTE.value == "execute"
        assert ToolPermission.DELETE.value == "delete"


class TestToolContext:
    """Tests for ToolContext class."""

    def test_default_permissions(self) -> None:
        """Default permissions include only READ."""
        ctx = ToolContext(workspace_path="/tmp/test")
        assert ToolPermission.READ in ctx.permissions
        assert ToolPermission.WRITE not in ctx.permissions

    def test_has_permission(self) -> None:
        """has_permission returns correct result."""
        ctx = ToolContext(
            workspace_path="/tmp/test",
            permissions={ToolPermission.READ, ToolPermission.WRITE},
        )
        assert ctx.has_permission(ToolPermission.READ) is True
        assert ctx.has_permission(ToolPermission.WRITE) is True
        assert ctx.has_permission(ToolPermission.DELETE) is False

    def test_require_permission_granted(self) -> None:
        """require_permission passes when permission granted."""
        ctx = ToolContext(
            workspace_path="/tmp/test",
            permissions={ToolPermission.READ, ToolPermission.WRITE},
        )
        # Should not raise
        ctx.require_permission(ToolPermission.READ)
        ctx.require_permission(ToolPermission.WRITE)

    def test_require_permission_denied(self) -> None:
        """require_permission raises when permission denied."""
        ctx = ToolContext(
            workspace_path="/tmp/test",
            permissions={ToolPermission.READ},
        )
        with pytest.raises(PermissionDeniedError):
            ctx.require_permission(ToolPermission.WRITE)

    def test_context_with_metadata(self) -> None:
        """Context can store additional metadata."""
        ctx = ToolContext(
            workspace_path="/tmp/test",
            task_id=123,
            user_id=456,
            metadata={"custom_key": "custom_value"},
        )
        assert ctx.task_id == 123
        assert ctx.user_id == 456
        assert ctx.metadata["custom_key"] == "custom_value"


class TestToolResult:
    """Tests for ToolResult class."""

    def test_ok_creates_success_result(self) -> None:
        """ToolResult.ok creates successful result."""
        result = ToolResult.ok("Success message", data={"key": "value"})
        assert result.success is True
        assert result.output == "Success message"
        assert result.data == {"key": "value"}
        assert result.error is None

    def test_fail_creates_failure_result(self) -> None:
        """ToolResult.fail creates failure result."""
        result = ToolResult.fail("Error message")
        assert result.success is False
        assert "Error message" in result.output
        assert result.error == "Error message"

    def test_to_string_success(self) -> None:
        """to_string returns output for successful result."""
        result = ToolResult.ok("File read successfully")
        assert result.to_string() == "File read successfully"

    def test_to_string_failure(self) -> None:
        """to_string returns error for failed result."""
        result = ToolResult.fail("File not found")
        assert "Error: File not found" in result.to_string()

    def test_execution_time(self) -> None:
        """Execution time can be recorded."""
        result = ToolResult.ok("Success", execution_time_ms=150.5)
        assert result.execution_time_ms == 150.5


class TestContextManagement:
    """Tests for context management functions."""

    def test_set_and_get_context(self) -> None:
        """Context can be set and retrieved."""
        ctx = ToolContext(workspace_path="/tmp/test")
        set_current_context(ctx)
        try:
            retrieved = get_current_context()
            assert retrieved is ctx
        finally:
            set_current_context(None)

    def test_get_context_when_not_set(self) -> None:
        """get_current_context returns None when not set."""
        set_current_context(None)
        assert get_current_context() is None

    def test_context_can_be_cleared(self) -> None:
        """Context can be cleared by setting None."""
        ctx = ToolContext(workspace_path="/tmp/test")
        set_current_context(ctx)
        set_current_context(None)
        assert get_current_context() is None
