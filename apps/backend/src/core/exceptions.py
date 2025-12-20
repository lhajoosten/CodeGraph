"""Custom exceptions for the CodeGraph application."""

from typing import Any


class CodeGraphException(Exception):
    """Base exception for all CodeGraph errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        """
        Initialize the exception.

        Args:
            message: Human-readable error message
            details: Additional context about the error
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DatabaseException(CodeGraphException):
    """Exception raised for database-related errors."""

    pass


class AuthenticationException(CodeGraphException):
    """Exception raised for authentication failures."""

    pass


class AuthorizationException(CodeGraphException):
    """Exception raised for authorization failures."""

    pass


class ResourceNotFoundException(CodeGraphException):
    """Exception raised when a requested resource is not found."""

    pass


class ValidationException(CodeGraphException):
    """Exception raised for data validation errors."""

    pass


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
