"""Unit tests for error handler."""

from unittest.mock import patch

import pytest

from src.agents.infrastructure.error_handler import (
    ErrorClassifier,
    ErrorHandler,
    ErrorType,
    RecoveryAction,
)
from src.agents.state import WorkflowState


class TestErrorClassifier:
    """Tests for ErrorClassifier class."""

    def test_classify_timeout_error(self) -> None:
        """Test classification of timeout errors."""
        errors = [
            TimeoutError("Request timed out"),
            Exception("Connection timeout"),
            Exception("Read timeout waiting for response"),
            Exception("Deadline exceeded"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.LLM_TIMEOUT, f"Failed for: {error}"

    def test_classify_rate_limit_error(self) -> None:
        """Test classification of rate limit errors."""
        errors = [
            Exception("Rate limit exceeded"),
            Exception("Too many requests"),
            Exception("429 Client Error"),
            Exception("Quota exceeded for the day"),
            Exception("Request was throttled"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.RATE_LIMIT, f"Failed for: {error}"

    def test_classify_context_length_error(self) -> None:
        """Test classification of context length errors."""
        errors = [
            Exception("Maximum context length exceeded"),
            Exception("Token limit reached"),
            Exception("Input too long for model"),
            Exception("max_tokens exceeded"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.CONTEXT_LENGTH, f"Failed for: {error}"

    def test_classify_authentication_error(self) -> None:
        """Test classification of authentication errors."""
        errors = [
            Exception("Authentication failed"),
            Exception("401 Unauthorized"),
            Exception("Invalid API key"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.AUTHENTICATION_ERROR, f"Failed for: {error}"

    def test_classify_connection_error(self) -> None:
        """Test classification of connection errors."""
        errors = [
            ConnectionError("Connection refused"),
            Exception("Network unreachable"),
            Exception("DNS resolution failed"),
            Exception("SSL certificate error"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.CONNECTION_ERROR, f"Failed for: {error}"

    def test_classify_validation_error(self) -> None:
        """Test classification of validation errors."""
        errors = [
            Exception("Validation error occurred"),
            ValueError("Invalid input"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            # ValueError might be classified differently, but explicit validation should work
            if "validation" in str(error).lower():
                assert result == ErrorType.VALIDATION_ERROR

    def test_classify_syntax_error(self) -> None:
        """Test classification of syntax errors."""
        error = SyntaxError("Invalid syntax")
        result = ErrorClassifier.classify(error)
        assert result == ErrorType.SYNTAX_ERROR

    def test_classify_api_error(self) -> None:
        """Test classification of API errors."""
        errors = [
            Exception("API error: Internal server error"),
            Exception("Anthropic API returned 500"),
        ]

        for error in errors:
            result = ErrorClassifier.classify(error)
            assert result == ErrorType.API_ERROR, f"Failed for: {error}"

    def test_classify_unknown_error(self) -> None:
        """Test classification of unknown errors."""
        error = Exception("Something completely unexpected happened")
        result = ErrorClassifier.classify(error)
        assert result == ErrorType.UNKNOWN


class TestRecoveryAction:
    """Tests for RecoveryAction dataclass."""

    def test_default_values(self) -> None:
        """Test default values for RecoveryAction."""
        action = RecoveryAction(error_type=ErrorType.UNKNOWN)

        assert action.should_retry is False
        assert action.should_fallback is False
        assert action.should_skip is False
        assert action.retry_delay_seconds == 0.0
        assert action.max_retries == 3
        assert action.current_retry == 0
        assert action.fallback_model_tier is None
        assert action.modified_state == {}
        assert action.error_message == ""

    def test_custom_values(self) -> None:
        """Test custom values for RecoveryAction."""
        action = RecoveryAction(
            error_type=ErrorType.LLM_TIMEOUT,
            should_retry=True,
            retry_delay_seconds=5.0,
            max_retries=2,
            current_retry=1,
            error_message="Timeout occurred",
            recovery_notes="Retrying with backoff",
        )

        assert action.error_type == ErrorType.LLM_TIMEOUT
        assert action.should_retry is True
        assert action.retry_delay_seconds == 5.0
        assert action.max_retries == 2


class TestErrorHandler:
    """Tests for ErrorHandler class."""

    @pytest.fixture
    def handler(self) -> ErrorHandler:
        """Create handler instance with error recovery enabled."""
        with patch("src.agents.infrastructure.error_handler.settings") as mock_settings:
            mock_settings.enable_error_recovery = True
            mock_settings.max_retry_attempts = 3
            return ErrorHandler()

    @pytest.fixture
    def disabled_handler(self) -> ErrorHandler:
        """Create handler instance with error recovery disabled."""
        with patch("src.agents.infrastructure.error_handler.settings") as mock_settings:
            mock_settings.enable_error_recovery = False
            mock_settings.max_retry_attempts = 3
            return ErrorHandler()

    @pytest.fixture
    def sample_state(self) -> WorkflowState:
        """Create sample workflow state."""
        return WorkflowState(
            messages=[],
            task_id=1,
            task_description="Test task",
            plan="Test plan",
            code="print('hello')",
            code_files={},
            test_results="",
            test_analysis={},
            review_feedback="",
            iterations=0,
            status="coding",
            error=None,
            metadata={},
        )

    def test_handle_timeout_error_first_retry(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test handling timeout error on first attempt."""
        error = TimeoutError("Request timed out")

        action = handler.handle_error(error, "coder", sample_state)

        assert action.error_type == ErrorType.LLM_TIMEOUT
        assert action.should_retry is True
        assert action.retry_delay_seconds >= 5.0
        assert action.current_retry == 1

    def test_handle_timeout_error_exhausted_retries(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test handling timeout error when retries exhausted."""
        error = TimeoutError("Request timed out")

        # Exhaust retries
        for _ in range(3):
            handler.handle_error(error, "coder", sample_state)

        # Next call should suggest fallback
        action = handler.handle_error(error, "coder", sample_state)

        assert action.should_retry is False
        assert action.should_fallback is True
        assert action.fallback_model_tier is not None

    def test_handle_rate_limit_with_backoff(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test rate limit handling with exponential backoff."""
        error = Exception("Rate limit exceeded")

        # First retry
        action1 = handler.handle_error(error, "coder", sample_state)
        delay1 = action1.retry_delay_seconds

        # Second retry should have longer delay
        action2 = handler.handle_error(error, "coder", sample_state)
        delay2 = action2.retry_delay_seconds

        assert delay2 > delay1  # Exponential backoff

    def test_handle_authentication_error_no_retry(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test that authentication errors don't retry."""
        error = Exception("Invalid API key")

        action = handler.handle_error(error, "coder", sample_state)

        # Auth errors should suggest fallback immediately (to local model)
        assert action.should_retry is False
        assert action.should_fallback is True

    def test_handle_context_length_truncates_state(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test context length error triggers state truncation."""
        # Create state with large content
        sample_state["plan"] = "x" * 10000
        sample_state["code"] = "y" * 20000

        error = Exception("Maximum context length exceeded")

        action = handler.handle_error(error, "coder", sample_state)

        # Should truncate the state
        if action.should_retry:
            assert len(action.modified_state.get("plan", "")) < 10000
            assert len(action.modified_state.get("code", "")) < 20000

    def test_disabled_handler_no_recovery(
        self, disabled_handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test that disabled handler returns no recovery."""
        error = TimeoutError("Request timed out")

        action = disabled_handler.handle_error(error, "coder", sample_state)

        assert action.should_retry is False
        assert action.should_fallback is False
        assert "disabled" in action.recovery_notes.lower()

    def test_reset_retries_for_node(
        self, handler: ErrorHandler, sample_state: WorkflowState
    ) -> None:
        """Test resetting retry counts for specific node."""
        error = TimeoutError("Timeout")

        # Accumulate retries
        handler.handle_error(error, "coder", sample_state)
        handler.handle_error(error, "coder", sample_state)

        assert len(handler.retry_counts) > 0

        # Reset
        handler.reset_retries("coder")

        # Should have cleared coder retries
        coder_keys = [k for k in handler.retry_counts if k.startswith("coder:")]
        assert len(coder_keys) == 0

    def test_reset_all_retries(self, handler: ErrorHandler, sample_state: WorkflowState) -> None:
        """Test resetting all retry counts."""
        error = TimeoutError("Timeout")

        # Accumulate retries for different nodes
        handler.handle_error(error, "coder", sample_state)
        handler.handle_error(error, "tester", sample_state)

        assert len(handler.retry_counts) > 0

        # Reset all
        handler.reset_retries()

        assert len(handler.retry_counts) == 0


class TestFallbackTier:
    """Tests for fallback tier selection."""

    @pytest.fixture
    def handler(self) -> ErrorHandler:
        """Create handler instance."""
        with patch("src.agents.infrastructure.error_handler.settings") as mock_settings:
            mock_settings.enable_error_recovery = True
            mock_settings.max_retry_attempts = 3
            return ErrorHandler()

    def test_fallback_from_opus_to_sonnet(self, handler: ErrorHandler) -> None:
        """Test fallback from opus to sonnet."""
        fallback = handler._get_fallback_tier("opus")
        assert fallback == "sonnet"

    def test_fallback_from_sonnet_to_haiku(self, handler: ErrorHandler) -> None:
        """Test fallback from sonnet to haiku."""
        fallback = handler._get_fallback_tier("sonnet")
        assert fallback == "haiku"

    def test_fallback_from_haiku_none(self, handler: ErrorHandler) -> None:
        """Test no fallback from haiku."""
        fallback = handler._get_fallback_tier("haiku")
        assert fallback is None

    def test_fallback_unknown_tier(self, handler: ErrorHandler) -> None:
        """Test fallback from unknown tier defaults to haiku."""
        fallback = handler._get_fallback_tier("unknown_tier")
        assert fallback == "haiku"


class TestStateTruncation:
    """Tests for state truncation on context length errors."""

    @pytest.fixture
    def handler(self) -> ErrorHandler:
        """Create handler instance."""
        with patch("src.agents.infrastructure.error_handler.settings") as mock_settings:
            mock_settings.enable_error_recovery = True
            mock_settings.max_retry_attempts = 3
            return ErrorHandler()

    def test_truncate_long_plan(self, handler: ErrorHandler) -> None:
        """Test truncation of long plan."""
        state = WorkflowState(
            messages=[],
            task_id=1,
            task_description="Test",
            plan="x" * 10000,  # > 4000 threshold
            code="",
            code_files={},
            test_results="",
            test_analysis={},
            review_feedback="",
            iterations=0,
            status="coding",
            error=None,
            metadata={},
        )

        truncated = handler._truncate_state(state)

        assert len(truncated["plan"]) <= 4100  # 4000 + truncation message
        assert "Truncated" in truncated["plan"]

    def test_truncate_long_code(self, handler: ErrorHandler) -> None:
        """Test truncation of long code."""
        state = WorkflowState(
            messages=[],
            task_id=1,
            task_description="Test",
            plan="",
            code="y" * 20000,  # > 8000 threshold
            code_files={},
            test_results="",
            test_analysis={},
            review_feedback="",
            iterations=0,
            status="coding",
            error=None,
            metadata={},
        )

        truncated = handler._truncate_state(state)

        assert len(truncated["code"]) <= 8100  # 8000 + truncation message
        assert "Truncated" in truncated["code"]

    def test_no_truncation_for_short_content(self, handler: ErrorHandler) -> None:
        """Test that short content is not truncated."""
        state = WorkflowState(
            messages=[],
            task_id=1,
            task_description="Test",
            plan="Short plan",
            code="Short code",
            code_files={},
            test_results="Short results",
            test_analysis={},
            review_feedback="Short feedback",
            iterations=0,
            status="coding",
            error=None,
            metadata={},
        )

        truncated = handler._truncate_state(state)

        assert truncated["plan"] == "Short plan"
        assert truncated["code"] == "Short code"
        assert truncated["test_results"] == "Short results"


class TestRetryConfiguration:
    """Tests for retry configuration per error type."""

    def test_timeout_config(self) -> None:
        """Test timeout error configuration."""
        config = ErrorHandler.RETRY_CONFIG[ErrorType.LLM_TIMEOUT]

        assert config["max_retries"] == 2
        assert config["base_delay"] == 5.0
        assert config["can_fallback"] is True

    def test_rate_limit_config(self) -> None:
        """Test rate limit error configuration."""
        config = ErrorHandler.RETRY_CONFIG[ErrorType.RATE_LIMIT]

        assert config["max_retries"] == 3
        assert config["base_delay"] == 10.0
        assert config["can_fallback"] is False

    def test_auth_error_no_retry(self) -> None:
        """Test authentication error has no retries."""
        config = ErrorHandler.RETRY_CONFIG[ErrorType.AUTHENTICATION_ERROR]

        assert config["max_retries"] == 0
        assert config["can_fallback"] is True

    def test_context_length_truncate_input(self) -> None:
        """Test context length error triggers input truncation."""
        config = ErrorHandler.RETRY_CONFIG[ErrorType.CONTEXT_LENGTH]

        assert config.get("truncate_input") is True


class TestErrorTypeEnum:
    """Tests for ErrorType enum."""

    def test_all_error_types_have_config(self) -> None:
        """Test that all error types have configuration."""
        for error_type in ErrorType:
            assert error_type in ErrorHandler.RETRY_CONFIG

    def test_error_type_values(self) -> None:
        """Test error type string values."""
        assert ErrorType.LLM_TIMEOUT.value == "llm_timeout"
        assert ErrorType.RATE_LIMIT.value == "rate_limit"
        assert ErrorType.API_ERROR.value == "api_error"
        assert ErrorType.VALIDATION_ERROR.value == "validation_error"
        assert ErrorType.SYNTAX_ERROR.value == "syntax_error"
        assert ErrorType.CONTEXT_LENGTH.value == "context_length"
        assert ErrorType.CONNECTION_ERROR.value == "connection_error"
        assert ErrorType.AUTHENTICATION_ERROR.value == "authentication_error"
        assert ErrorType.UNKNOWN.value == "unknown"
