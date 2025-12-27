"""Custom exceptions for the CodeGraph application."""

from typing import Any

from src.core.error_codes import AuthErrorCode


class CodeGraphException(Exception):
    """Base exception for all CodeGraph errors."""

    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ):
        """
        Initialize the exception.

        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            status_code: HTTP status code for this error
            details: Additional context about the error
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class DatabaseException(CodeGraphException):
    """Exception raised for database-related errors."""

    pass


class AuthenticationException(CodeGraphException):
    """Exception raised for authentication failures."""

    def __init__(
        self,
        message: str,
        error_code: str | AuthErrorCode,
        details: dict[str, Any] | None = None,
    ):
        """Initialize authentication exception with 401 status."""
        super().__init__(
            message=message,
            error_code=error_code.value if isinstance(error_code, AuthErrorCode) else error_code,
            status_code=401,
            details=details,
        )


class AuthorizationException(CodeGraphException):
    """Exception raised for authorization failures."""

    def __init__(
        self,
        message: str,
        error_code: str | AuthErrorCode,
        details: dict[str, Any] | None = None,
    ):
        """Initialize authorization exception with 403 status."""
        super().__init__(
            message=message,
            error_code=error_code.value if isinstance(error_code, AuthErrorCode) else error_code,
            status_code=403,
            details=details,
        )


class ResourceNotFoundException(CodeGraphException):
    """Exception raised when a requested resource is not found."""

    pass


class BadRequestException(CodeGraphException):
    """Exception raised for bad request errors (400)."""

    def __init__(
        self,
        message: str,
        error_code: str = "BAD_REQUEST",
        details: dict[str, Any] | None = None,
    ):
        """Initialize bad request exception with 400 status."""
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=400,
            details=details,
        )


class ValidationException(CodeGraphException):
    """Exception raised for data validation errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "VALIDATION_ERROR",
        details: dict[str, Any] | None = None,
    ):
        """Initialize validation exception with 422 status."""
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=422,
            details=details,
        )


class AgentException(CodeGraphException):
    """Exception raised for agent execution errors."""

    pass


class AgentTimeoutException(AgentException):
    """Exception raised when an agent execution times out."""

    pass


class AgentToolException(AgentException):
    """Exception raised when an agent tool fails."""

    pass


class GitHubException(CodeGraphException):
    """Exception raised for GitHub API errors."""

    pass


class RepositoryNotFoundException(GitHubException):
    """Exception raised when a GitHub repository is not found."""

    pass


class ExternalServiceException(CodeGraphException):
    """Exception raised for external service errors (Anthropic, etc.)."""

    pass


class RateLimitException(CodeGraphException):
    """Exception raised when rate limits are exceeded."""

    pass
