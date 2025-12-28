"""Error handling for LangGraph workflow nodes.

This module provides error classification and recovery strategies for
agent node failures. It can be used as a standalone error handler or
integrated into the workflow graph.

Features:
- Error type classification (LLM timeout, rate limit, API error, etc.)
- Recovery strategies per error type
- Retry with exponential backoff
- Fallback to simpler model on timeout
- Graceful degradation options

Usage:
    handler = ErrorHandler()
    recovery = await handler.handle_error(error, node_name, state)
    if recovery.should_retry:
        # Retry with recovery.modified_state
    elif recovery.should_fallback:
        # Use fallback model
    else:
        # Propagate error
"""

import asyncio
import enum
from dataclasses import dataclass, field
from typing import Any

from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class ErrorType(str, enum.Enum):
    """Classification of error types for recovery strategies."""

    LLM_TIMEOUT = "llm_timeout"
    RATE_LIMIT = "rate_limit"
    API_ERROR = "api_error"
    VALIDATION_ERROR = "validation_error"
    SYNTAX_ERROR = "syntax_error"
    CONTEXT_LENGTH = "context_length"
    CONNECTION_ERROR = "connection_error"
    AUTHENTICATION_ERROR = "authentication_error"
    UNKNOWN = "unknown"


@dataclass
class RecoveryAction:
    """Result of error handling with recovery instructions."""

    error_type: ErrorType
    should_retry: bool = False
    should_fallback: bool = False
    should_skip: bool = False
    retry_delay_seconds: float = 0.0
    max_retries: int = 3
    current_retry: int = 0
    fallback_model_tier: str | None = None
    modified_state: dict[str, Any] = field(default_factory=dict)
    error_message: str = ""
    recovery_notes: str = ""


class ErrorClassifier:
    """Classifies errors into types for appropriate handling."""

    # Error message patterns for classification
    TIMEOUT_PATTERNS = [
        "timeout",
        "timed out",
        "deadline exceeded",
        "request timeout",
        "read timeout",
    ]

    RATE_LIMIT_PATTERNS = [
        "rate limit",
        "too many requests",
        "429",
        "quota exceeded",
        "throttled",
    ]

    CONTEXT_LENGTH_PATTERNS = [
        "context length",
        "maximum context",
        "token limit",
        "too long",
        "max_tokens",
    ]

    AUTH_PATTERNS = [
        "authentication",
        "unauthorized",
        "401",
        "invalid api key",
        "api key",
    ]

    CONNECTION_PATTERNS = [
        "connection",
        "network",
        "unreachable",
        "dns",
        "ssl",
        "certificate",
    ]

    @classmethod
    def classify(cls, error: BaseException) -> ErrorType:
        """Classify an error into an ErrorType.

        Args:
            error: The exception to classify

        Returns:
            The classified ErrorType
        """
        error_str = str(error).lower()
        error_type_name = type(error).__name__.lower()

        # Check for timeout
        if any(p in error_str or p in error_type_name for p in cls.TIMEOUT_PATTERNS):
            return ErrorType.LLM_TIMEOUT

        # Check for rate limiting
        if any(p in error_str for p in cls.RATE_LIMIT_PATTERNS):
            return ErrorType.RATE_LIMIT

        # Check for context length issues
        if any(p in error_str for p in cls.CONTEXT_LENGTH_PATTERNS):
            return ErrorType.CONTEXT_LENGTH

        # Check for authentication issues
        if any(p in error_str for p in cls.AUTH_PATTERNS):
            return ErrorType.AUTHENTICATION_ERROR

        # Check for connection issues
        if any(p in error_str for p in cls.CONNECTION_PATTERNS):
            return ErrorType.CONNECTION_ERROR

        # Check for validation errors
        if "validation" in error_str or "pydantic" in error_type_name:
            return ErrorType.VALIDATION_ERROR

        # Check for syntax errors in generated code
        if "syntax" in error_str or isinstance(error, SyntaxError):
            return ErrorType.SYNTAX_ERROR

        # Check for API errors
        if "api" in error_str or "anthropic" in error_type_name:
            return ErrorType.API_ERROR

        return ErrorType.UNKNOWN


class ErrorHandler:
    """Handles errors with recovery strategies.

    Provides error classification, retry logic with backoff,
    and fallback strategies for different error types.
    """

    # Retry configuration per error type
    RETRY_CONFIG: dict[ErrorType, dict[str, Any]] = {
        ErrorType.LLM_TIMEOUT: {
            "max_retries": 2,
            "base_delay": 5.0,
            "can_fallback": True,
        },
        ErrorType.RATE_LIMIT: {
            "max_retries": 3,
            "base_delay": 10.0,
            "can_fallback": False,
        },
        ErrorType.API_ERROR: {
            "max_retries": 2,
            "base_delay": 2.0,
            "can_fallback": True,
        },
        ErrorType.CONNECTION_ERROR: {
            "max_retries": 3,
            "base_delay": 3.0,
            "can_fallback": False,
        },
        ErrorType.CONTEXT_LENGTH: {
            "max_retries": 1,
            "base_delay": 0.0,
            "can_fallback": False,
            "truncate_input": True,
        },
        ErrorType.VALIDATION_ERROR: {
            "max_retries": 1,
            "base_delay": 0.0,
            "can_fallback": False,
        },
        ErrorType.SYNTAX_ERROR: {
            "max_retries": 2,
            "base_delay": 0.0,
            "can_fallback": False,
        },
        ErrorType.AUTHENTICATION_ERROR: {
            "max_retries": 0,
            "base_delay": 0.0,
            "can_fallback": True,
        },
        ErrorType.UNKNOWN: {
            "max_retries": 1,
            "base_delay": 1.0,
            "can_fallback": False,
        },
    }

    # Fallback model tiers (from higher to lower capability)
    FALLBACK_TIERS = ["opus", "sonnet", "haiku"]

    def __init__(self) -> None:
        """Initialize the error handler."""
        self.retry_counts: dict[str, int] = {}  # node_name -> retry count
        self.enabled = settings.enable_error_recovery
        self.max_retries = settings.max_retry_attempts

    def handle_error(
        self,
        error: BaseException,
        node_name: str,
        state: WorkflowState,
        current_model_tier: str = "sonnet",
    ) -> RecoveryAction:
        """Handle an error and determine recovery action.

        Args:
            error: The exception that occurred
            node_name: Name of the node that failed
            state: Current workflow state
            current_model_tier: Current model tier being used

        Returns:
            RecoveryAction with instructions for recovery
        """
        error_type = ErrorClassifier.classify(error)
        config = self.RETRY_CONFIG.get(error_type, self.RETRY_CONFIG[ErrorType.UNKNOWN])

        # Get retry key for this node
        retry_key = f"{node_name}:{error_type.value}"
        current_retry = self.retry_counts.get(retry_key, 0)

        logger.info(
            "Handling error",
            node=node_name,
            error_type=error_type.value,
            error=str(error)[:200],
            retry=current_retry,
            max_retries=min(config["max_retries"], self.max_retries),
        )

        # Check if error recovery is disabled
        if not self.enabled:
            return RecoveryAction(
                error_type=error_type,
                error_message=str(error),
                recovery_notes="Error recovery disabled",
            )

        # Check if we've exhausted retries
        max_allowed = min(config["max_retries"], self.max_retries)
        if current_retry >= max_allowed:
            # Try fallback if available
            if config.get("can_fallback"):
                fallback_tier = self._get_fallback_tier(current_model_tier)
                if fallback_tier:
                    return RecoveryAction(
                        error_type=error_type,
                        should_fallback=True,
                        fallback_model_tier=fallback_tier,
                        error_message=str(error),
                        recovery_notes=f"Retries exhausted, falling back to {fallback_tier}",
                    )

            # No more options
            return RecoveryAction(
                error_type=error_type,
                error_message=str(error),
                recovery_notes="Retries exhausted, no fallback available",
            )

        # Calculate retry delay with exponential backoff
        base_delay = config["base_delay"]
        delay = base_delay * (2**current_retry)

        # Update retry count
        self.retry_counts[retry_key] = current_retry + 1

        # Prepare modified state if needed
        modified_state = dict(state)

        # Handle context length by truncating
        if error_type == ErrorType.CONTEXT_LENGTH and config.get("truncate_input"):
            modified_state = self._truncate_state(state)

        return RecoveryAction(
            error_type=error_type,
            should_retry=True,
            retry_delay_seconds=delay,
            max_retries=max_allowed,
            current_retry=current_retry + 1,
            modified_state=modified_state,
            error_message=str(error),
            recovery_notes=f"Retrying after {delay:.1f}s (attempt {current_retry + 1}/{max_allowed})",
        )

    def _get_fallback_tier(self, current_tier: str) -> str | None:
        """Get the next fallback tier.

        Args:
            current_tier: Current model tier

        Returns:
            Next fallback tier or None if no fallback available
        """
        try:
            current_index = self.FALLBACK_TIERS.index(current_tier)
            if current_index < len(self.FALLBACK_TIERS) - 1:
                return self.FALLBACK_TIERS[current_index + 1]
        except ValueError:
            # Current tier not in fallback list, try haiku
            return "haiku"
        return None

    def _truncate_state(self, state: WorkflowState) -> dict[str, Any]:
        """Truncate state to reduce context length.

        Reduces the size of large text fields to fit within context limits.

        Args:
            state: Current workflow state

        Returns:
            Modified state with truncated content
        """
        modified = dict(state)

        # Truncate large fields
        if state.get("plan") and len(state["plan"]) > 4000:
            modified["plan"] = state["plan"][:4000] + "\n[Truncated for context limit]"

        if state.get("code") and len(state["code"]) > 8000:
            modified["code"] = state["code"][:8000] + "\n# [Truncated for context limit]"

        if state.get("test_results") and len(state["test_results"]) > 4000:
            modified["test_results"] = (
                state["test_results"][:4000] + "\n[Truncated for context limit]"
            )

        if state.get("review_feedback") and len(state["review_feedback"]) > 2000:
            modified["review_feedback"] = (
                state["review_feedback"][:2000] + "\n[Truncated for context limit]"
            )

        logger.debug("Truncated state for context limit")
        return modified

    def reset_retries(self, node_name: str | None = None) -> None:
        """Reset retry counts.

        Args:
            node_name: Reset only for this node, or all if None
        """
        if node_name:
            keys_to_remove = [k for k in self.retry_counts if k.startswith(f"{node_name}:")]
            for key in keys_to_remove:
                del self.retry_counts[key]
        else:
            self.retry_counts.clear()


async def with_error_recovery(
    func: Any,
    node_name: str,
    state: WorkflowState,
    handler: ErrorHandler | None = None,
    model_tier: str = "sonnet",
) -> tuple[Any, bool]:
    """Execute a function with error recovery.

    Wrapper that handles errors with retry and fallback logic.

    Args:
        func: Async function to execute
        node_name: Name of the node for tracking
        state: Current workflow state
        handler: Error handler instance (creates new if None)
        model_tier: Current model tier

    Returns:
        Tuple of (result, success)
    """
    if handler is None:
        handler = ErrorHandler()

    last_error: BaseException | None = None

    while True:
        try:
            result = await func(state)
            handler.reset_retries(node_name)
            return result, True

        except Exception as e:
            last_error = e
            recovery = handler.handle_error(e, node_name, state, model_tier)

            if recovery.should_retry:
                logger.info(
                    "Retrying after error",
                    node=node_name,
                    delay=recovery.retry_delay_seconds,
                    attempt=recovery.current_retry,
                )
                if recovery.retry_delay_seconds > 0:
                    await asyncio.sleep(recovery.retry_delay_seconds)
                state = recovery.modified_state  # type: ignore[assignment]
                continue

            elif recovery.should_fallback:
                logger.warning(
                    "Falling back to simpler model",
                    node=node_name,
                    fallback_tier=recovery.fallback_model_tier,
                )
                # Caller should handle fallback by creating new model
                # Return the recovery action for the caller to use
                raise RuntimeError(
                    f"Fallback required to {recovery.fallback_model_tier}: {e}"
                ) from e

            else:
                # No recovery possible
                logger.error(
                    "Error recovery exhausted",
                    node=node_name,
                    error_type=recovery.error_type.value,
                    error=str(e),
                )
                raise

    # Should never reach here, but satisfy type checker
    if last_error:
        raise last_error
    return None, False
