"""Base classes and utilities for agent tools.

This module provides the foundation for all agent tools including:
- ToolContext: Execution context passed to tools
- ToolResult: Standard result wrapper
- execute_tool: Helper to execute tool calls from LLM responses
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any

from langchain_core.messages import ToolMessage
from langchain_core.tools import BaseTool

from src.core.logging import get_logger
from src.tools.exceptions import ToolError, ToolExecutionError

if TYPE_CHECKING:
    from src.tools.registry import AgentType

logger = get_logger(__name__)


class ToolPermission(str, Enum):
    """Permission levels for tool operations."""

    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    DELETE = "delete"


@dataclass
class ToolContext:
    """Execution context passed to tools.

    Contains information about the current execution environment,
    including workspace path, user info, and task context.
    """

    workspace_path: str
    """Root path of the workspace for file operations."""

    task_id: int | None = None
    """ID of the current task, if applicable."""

    user_id: int | None = None
    """ID of the user executing the tool, if applicable."""

    repository_path: str | None = None
    """Path to the repository root, if different from workspace."""

    permissions: set[ToolPermission] = field(default_factory=lambda: {ToolPermission.READ})
    """Set of permissions granted for this execution."""

    metadata: dict[str, Any] = field(default_factory=dict)
    """Additional metadata for tool execution."""

    def has_permission(self, permission: ToolPermission) -> bool:
        """Check if context has a specific permission.

        Args:
            permission: Permission to check

        Returns:
            True if permission is granted
        """
        return permission in self.permissions

    def require_permission(self, permission: ToolPermission) -> None:
        """Require a specific permission, raising if not granted.

        Args:
            permission: Required permission

        Raises:
            PermissionDeniedError: If permission is not granted
        """
        from src.tools.exceptions import PermissionDeniedError

        if not self.has_permission(permission):
            raise PermissionDeniedError(
                f"Permission denied: {permission.value} not granted",
                operation=permission.value,
                resource=self.workspace_path,
            )


@dataclass
class ToolResult:
    """Standard result wrapper for tool execution.

    Provides a consistent interface for returning tool results
    with success/error handling and metadata.
    """

    success: bool
    """Whether the tool execution succeeded."""

    output: str
    """Output message or data from the tool."""

    data: Any = None
    """Structured data returned by the tool, if any."""

    error: str | None = None
    """Error message if execution failed."""

    execution_time_ms: float | None = None
    """Execution time in milliseconds."""

    metadata: dict[str, Any] = field(default_factory=dict)
    """Additional metadata about the execution."""

    @classmethod
    def ok(
        cls,
        output: str,
        data: Any = None,
        execution_time_ms: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ToolResult:
        """Create a successful result.

        Args:
            output: Output message
            data: Optional structured data
            execution_time_ms: Optional execution time
            metadata: Optional metadata

        Returns:
            Successful ToolResult
        """
        return cls(
            success=True,
            output=output,
            data=data,
            execution_time_ms=execution_time_ms,
            metadata=metadata or {},
        )

    @classmethod
    def fail(
        cls,
        error: str,
        output: str | None = None,
        execution_time_ms: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ToolResult:
        """Create a failed result.

        Args:
            error: Error message
            output: Optional output message
            execution_time_ms: Optional execution time
            metadata: Optional metadata

        Returns:
            Failed ToolResult
        """
        return cls(
            success=False,
            output=output or f"Error: {error}",
            error=error,
            execution_time_ms=execution_time_ms,
            metadata=metadata or {},
        )

    def to_string(self) -> str:
        """Convert result to string for LLM consumption.

        Returns:
            String representation of the result
        """
        if self.success:
            return self.output
        return f"Error: {self.error}"


# Global context storage for tool execution
_current_context: ToolContext | None = None


def get_current_context() -> ToolContext | None:
    """Get the current tool execution context.

    Returns:
        Current ToolContext or None if not set
    """
    return _current_context


def set_current_context(context: ToolContext | None) -> None:
    """Set the current tool execution context.

    Args:
        context: ToolContext to set or None to clear
    """
    global _current_context
    _current_context = context


async def execute_tool(
    tool_call: dict[str, Any],
    tools: list[BaseTool],
    context: ToolContext,
) -> ToolMessage:
    """Execute a tool call from an LLM response.

    This function handles the execution of tool calls, including:
    - Finding the appropriate tool
    - Setting up execution context
    - Executing the tool with proper error handling
    - Returning a ToolMessage for the conversation

    Args:
        tool_call: Tool call dict from LLM response with 'name', 'args', 'id'
        tools: List of available tools
        context: Execution context

    Returns:
        ToolMessage with the tool execution result

    Raises:
        ToolExecutionError: If tool execution fails
    """
    tool_name = tool_call.get("name", "")
    tool_args = tool_call.get("args", {})
    tool_call_id = tool_call.get("id", "")

    start_time = datetime.now()

    logger.info(
        "tool_execution_started",
        tool_name=tool_name,
        tool_call_id=tool_call_id,
        task_id=context.task_id,
    )

    try:
        # Find the tool by name
        tool = next((t for t in tools if t.name == tool_name), None)
        if not tool:
            raise ToolExecutionError(
                f"Tool not found: {tool_name}",
                details={"available_tools": [t.name for t in tools]},
            )

        # Set context for the tool execution
        set_current_context(context)

        try:
            # Execute the tool
            result = await tool.ainvoke(tool_args)

            # Handle result formatting
            if isinstance(result, ToolResult):
                output = result.to_string()
            elif isinstance(result, str):
                output = result
            else:
                output = str(result)

            execution_time_ms = (datetime.now() - start_time).total_seconds() * 1000

            logger.info(
                "tool_execution_completed",
                tool_name=tool_name,
                tool_call_id=tool_call_id,
                execution_time_ms=execution_time_ms,
                success=True,
            )

            return ToolMessage(
                content=output,
                tool_call_id=tool_call_id,
            )

        finally:
            # Always clear context after execution
            set_current_context(None)

    except ToolError as e:
        execution_time_ms = (datetime.now() - start_time).total_seconds() * 1000

        logger.error(
            "tool_execution_failed",
            tool_name=tool_name,
            tool_call_id=tool_call_id,
            error=str(e),
            error_type=type(e).__name__,
            execution_time_ms=execution_time_ms,
        )

        return ToolMessage(
            content=f"Error executing {tool_name}: {e.message}",
            tool_call_id=tool_call_id,
        )

    except Exception as e:
        execution_time_ms = (datetime.now() - start_time).total_seconds() * 1000

        logger.exception(
            "tool_execution_unexpected_error",
            tool_name=tool_name,
            tool_call_id=tool_call_id,
            error=str(e),
            execution_time_ms=execution_time_ms,
        )

        return ToolMessage(
            content=f"Unexpected error executing {tool_name}: {e!s}",
            tool_call_id=tool_call_id,
        )


def with_context[T](func: Callable[..., T]) -> Callable[..., T]:
    """Decorator to inject current context into tool functions.

    Usage:
        @with_context
        async def my_tool(path: str, context: ToolContext) -> str:
            ...

    The context parameter will be automatically injected.
    """
    import functools
    import inspect
    from collections.abc import Coroutine

    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        context = get_current_context()
        if context is None:
            raise ToolExecutionError(
                "No execution context set. Tools must be executed via execute_tool()."
            )

        # Check if function expects context parameter
        sig = inspect.signature(func)
        if "context" in sig.parameters:
            kwargs["context"] = context

        result = func(*args, **kwargs)
        # Handle both async and sync functions
        if isinstance(result, Coroutine):
            return await result
        return result

    return wrapper  # type: ignore[return-value]


# =============================================================================
# Tool Context Builder
# =============================================================================


def build_tool_context(
    state: dict[str, Any],
    agent_type: AgentType,
) -> ToolContext:
    """Build a ToolContext from workflow state with appropriate permissions.

    This helper creates a ToolContext configured for a specific agent type,
    ensuring each agent has the correct permission level for its role.

    Permission mapping:
        - PLANNER: READ only (explore codebase, cannot modify)
        - CODER: READ, WRITE, EXECUTE (full access for implementation)
        - TESTER: READ, EXECUTE (can run tests but not modify production code)
        - REVIEWER: READ only (verification without modification)

    Args:
        state: Workflow state dict containing task_id, workspace_path, etc.
        agent_type: The type of agent requesting tool access

    Returns:
        Configured ToolContext with appropriate permissions

    Example:
        >>> from src.tools.registry import AgentType
        >>> state = {"task_id": 123, "workspace_path": "/tmp/workspace"}
        >>> context = build_tool_context(state, AgentType.CODER)
        >>> context.has_permission(ToolPermission.WRITE)
        True
    """
    from src.tools.registry import AgentType

    # Map agent types to their permission sets
    permission_map: dict[AgentType, set[ToolPermission]] = {
        AgentType.PLANNER: {ToolPermission.READ},
        AgentType.CODER: {
            ToolPermission.READ,
            ToolPermission.WRITE,
            ToolPermission.EXECUTE,
        },
        AgentType.TESTER: {
            ToolPermission.READ,
            ToolPermission.EXECUTE,
        },
        AgentType.REVIEWER: {ToolPermission.READ},
    }

    # Get permissions for this agent type (default to READ only)
    permissions = permission_map.get(agent_type, {ToolPermission.READ})

    # Extract workspace path from state
    workspace_path = state.get("workspace_path")
    if not workspace_path:
        # Default to a temp workspace if not specified
        import tempfile

        workspace_path = tempfile.gettempdir() + "/codegraph_workspaces"

    # Build the context
    return ToolContext(
        workspace_path=workspace_path,
        task_id=state.get("task_id"),
        user_id=state.get("user_id"),
        repository_path=state.get("repository_path"),
        permissions=permissions,
        metadata={
            "agent_type": agent_type.value if hasattr(agent_type, "value") else str(agent_type),
            "status": state.get("status"),
        },
    )
