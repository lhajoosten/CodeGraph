"""Tool-specific exceptions for agent tool execution."""

from typing import Any


class ToolError(Exception):
    """Base exception for all tool errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        """Initialize tool error.

        Args:
            message: Error message
            details: Optional additional details
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ToolExecutionError(ToolError):
    """Raised when a tool fails to execute."""

    pass


class PathValidationError(ToolError):
    """Raised when a path fails security validation."""

    def __init__(
        self,
        message: str,
        path: str,
        workspace: str | None = None,
    ) -> None:
        """Initialize path validation error.

        Args:
            message: Error message
            path: The invalid path
            workspace: The workspace root if applicable
        """
        super().__init__(message, {"path": path, "workspace": workspace})
        self.path = path
        self.workspace = workspace


class PermissionDeniedError(ToolError):
    """Raised when a tool operation is denied due to permissions."""

    def __init__(
        self,
        message: str,
        operation: str,
        resource: str | None = None,
    ) -> None:
        """Initialize permission denied error.

        Args:
            message: Error message
            operation: The denied operation
            resource: The resource being accessed
        """
        super().__init__(message, {"operation": operation, "resource": resource})
        self.operation = operation
        self.resource = resource


class WorkspaceNotFoundError(ToolError):
    """Raised when a workspace doesn't exist or is inaccessible."""

    def __init__(self, workspace_path: str) -> None:
        """Initialize workspace not found error.

        Args:
            workspace_path: The missing workspace path
        """
        super().__init__(
            f"Workspace not found: {workspace_path}",
            {"workspace_path": workspace_path},
        )
        self.workspace_path = workspace_path


class FileNotFoundInWorkspaceError(ToolError):
    """Raised when a file doesn't exist in the workspace."""

    def __init__(self, file_path: str, workspace: str) -> None:
        """Initialize file not found error.

        Args:
            file_path: The missing file path
            workspace: The workspace being searched
        """
        super().__init__(
            f"File not found: {file_path}",
            {"file_path": file_path, "workspace": workspace},
        )
        self.file_path = file_path
        self.workspace = workspace


class GitOperationError(ToolError):
    """Raised when a git operation fails."""

    def __init__(
        self,
        message: str,
        operation: str,
        return_code: int | None = None,
        stderr: str | None = None,
    ) -> None:
        """Initialize git operation error.

        Args:
            message: Error message
            operation: The git operation that failed
            return_code: Git command return code
            stderr: Git command stderr output
        """
        super().__init__(
            message,
            {"operation": operation, "return_code": return_code, "stderr": stderr},
        )
        self.operation = operation
        self.return_code = return_code
        self.stderr = stderr


class DatabaseToolError(ToolError):
    """Raised when a database tool operation fails."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        """Initialize database tool error.

        Args:
            message: Error message
            details: Additional error details (connection, query, etc.)
        """
        super().__init__(message, details or {})
        self._details = details or {}


class ExecutionTimeoutError(ToolError):
    """Raised when code execution times out."""

    def __init__(self, timeout_seconds: int, operation: str) -> None:
        """Initialize execution timeout error.

        Args:
            timeout_seconds: The timeout that was exceeded
            operation: The operation that timed out
        """
        super().__init__(
            f"Execution timed out after {timeout_seconds} seconds",
            {"timeout_seconds": timeout_seconds, "operation": operation},
        )
        self.timeout_seconds = timeout_seconds
        self.operation = operation


class SandboxError(ToolError):
    """Raised when sandbox operations fail."""

    def __init__(
        self,
        message: str,
        sandbox_id: str | None = None,
    ) -> None:
        """Initialize sandbox error.

        Args:
            message: Error message
            sandbox_id: The sandbox ID if applicable
        """
        super().__init__(message, {"sandbox_id": sandbox_id})
        self.sandbox_id = sandbox_id
