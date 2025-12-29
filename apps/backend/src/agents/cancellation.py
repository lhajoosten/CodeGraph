"""Workflow cancellation support for graceful shutdown.

This module provides a thread-safe cancellation mechanism for workflows,
allowing long-running workflows to be cancelled gracefully from external
code (e.g., API handlers, scheduled tasks).

Features:
- Thread-safe CancellationToken for cross-thread signaling
- Global registry for active workflow tokens
- Clean cancellation with reason tracking

Example:
    # In workflow invocation
    token = get_cancellation_token(task_id)

    # In API handler (different thread/coroutine)
    cancel_workflow(task_id, reason="User requested cancellation")

    # In workflow node
    token.raise_if_cancelled()
"""

import threading

from src.core.logging import get_logger

logger = get_logger(__name__)


class WorkflowCancelledError(Exception):
    """Raised when a workflow is cancelled.

    This exception is raised by CancellationToken.raise_if_cancelled()
    when cancellation has been requested. Workflow nodes should catch
    this exception and perform any necessary cleanup before re-raising
    or returning a cancelled state.
    """

    pass


class CancellationToken:
    """Thread-safe token for workflow cancellation.

    Provides a mechanism to signal cancellation to running workflows
    and check cancellation status from within workflow nodes.

    Usage:
        token = CancellationToken()

        # In main code
        token.cancel()  # Signal cancellation

        # In workflow node
        if token.is_cancelled:
            raise WorkflowCancelledError()

    Thread Safety:
        The token is thread-safe and can be checked/set from any thread.
        Uses threading.Event for efficient cross-thread signaling.
    """

    def __init__(self) -> None:
        """Initialize an uncancelled token."""
        self._cancelled = threading.Event()
        self._cancel_reason: str | None = None

    @property
    def is_cancelled(self) -> bool:
        """Check if cancellation has been requested."""
        return self._cancelled.is_set()

    @property
    def cancel_reason(self) -> str | None:
        """Get the reason for cancellation, if provided."""
        return self._cancel_reason

    def cancel(self, reason: str | None = None) -> None:
        """Request cancellation of the workflow.

        Args:
            reason: Optional reason for the cancellation
        """
        self._cancel_reason = reason
        self._cancelled.set()

    def reset(self) -> None:
        """Reset the token to uncancelled state.

        This is useful for reusing tokens across workflow retries.
        """
        self._cancelled.clear()
        self._cancel_reason = None

    def raise_if_cancelled(self) -> None:
        """Raise WorkflowCancelledError if cancelled.

        Call this periodically in long-running operations to check
        for cancellation requests.

        Raises:
            WorkflowCancelledError: If cancellation was requested
        """
        if self.is_cancelled:
            raise WorkflowCancelledError(self._cancel_reason or "Workflow cancelled")


# =============================================================================
# Global Cancellation Token Registry
# =============================================================================

# Global registry for active workflow cancellation tokens
_active_tokens: dict[int, CancellationToken] = {}
_token_lock = threading.Lock()


def get_cancellation_token(task_id: int) -> CancellationToken:
    """Get or create a cancellation token for a task.

    If a token already exists for the task, returns the existing token.
    Otherwise, creates a new token and registers it.

    Args:
        task_id: The task ID

    Returns:
        CancellationToken for the task
    """
    with _token_lock:
        if task_id not in _active_tokens:
            _active_tokens[task_id] = CancellationToken()
        return _active_tokens[task_id]


def cancel_workflow(task_id: int, reason: str | None = None) -> bool:
    """Cancel a running workflow.

    This is the main entry point for external code to request
    workflow cancellation.

    Args:
        task_id: The task ID to cancel
        reason: Optional reason for cancellation

    Returns:
        True if a token was found and cancelled, False otherwise
    """
    with _token_lock:
        if task_id in _active_tokens:
            _active_tokens[task_id].cancel(reason)
            logger.info("Workflow cancellation requested", task_id=task_id, reason=reason)
            return True
        return False


def cleanup_cancellation_token(task_id: int) -> None:
    """Remove a cancellation token after workflow completion.

    Call this after workflow completion (success or failure) to
    free up resources.

    Args:
        task_id: The task ID
    """
    with _token_lock:
        _active_tokens.pop(task_id, None)


def get_active_tokens() -> list[int]:
    """Get list of task IDs with active cancellation tokens.

    Useful for debugging and monitoring active workflows.

    Returns:
        List of task IDs with registered tokens
    """
    with _token_lock:
        return list(_active_tokens.keys())


def clear_all_tokens() -> int:
    """Clear all active cancellation tokens.

    Useful for testing and shutdown scenarios.

    Returns:
        Number of tokens cleared
    """
    with _token_lock:
        count = len(_active_tokens)
        _active_tokens.clear()
        return count
