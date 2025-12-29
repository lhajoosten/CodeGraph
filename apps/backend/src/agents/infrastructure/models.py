"""Model factory for initializing language models via LangChain.

This module provides a centralized factory for creating chat model instances
with consistent configuration across all agent nodes. Primary backend is
local vLLM running Qwen 2.5 Coder, with Claude API as optional fallback.

Model tiers (for cost comparison, all use same local model):
- haiku: Fast, cost-effective tasks (planning, simple queries)
- sonnet: Balanced for most coding tasks (default)
- opus: Complex reasoning tasks (architecture, security review)

Token usage tracking and cost estimation is implemented via:
- src/models/usage_metrics.py (database model)
- src/services/metrics_service.py (metrics collection)
- src/services/cost_calculator.py (cost estimation)

Rate limiting is implemented via ModelRateLimiter to prevent API errors.
"""

import asyncio
import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock
from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Type aliases
ModelTier = Literal["haiku", "sonnet", "opus"]
ChatModel = ChatAnthropic | ChatOpenAI


# =============================================================================
# Rate Limiting
# =============================================================================


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting per model/backend.

    Attributes:
        requests_per_minute: Maximum requests allowed per minute
        tokens_per_minute: Maximum tokens allowed per minute (optional)
        min_request_interval_ms: Minimum time between requests in milliseconds
    """

    requests_per_minute: int = 60
    tokens_per_minute: int | None = None
    min_request_interval_ms: int = 100  # 100ms minimum between requests


@dataclass
class RateLimitState:
    """Tracks rate limit state for a specific model/backend combination."""

    request_timestamps: list[float] = field(default_factory=list)
    token_counts: list[tuple[float, int]] = field(default_factory=list)
    last_request_time: float = 0.0


class ModelRateLimiter:
    """Rate limiter for model API calls.

    Implements a sliding window rate limiter that:
    - Tracks requests per minute per model tier and backend
    - Adds delays when approaching rate limits
    - Provides async-friendly waiting

    Rate limits are configurable per backend:
    - Local vLLM: Higher limits (local resource only)
    - Claude API: Conservative limits matching Anthropic's rate limits

    Usage:
        limiter = ModelRateLimiter()
        await limiter.acquire("sonnet", "cloud")  # Wait if needed
        response = await model.ainvoke(...)
        limiter.record_tokens("sonnet", "cloud", 1500)  # Track token usage

    Thread Safety:
        This class is thread-safe and can be used from multiple coroutines.
    """

    # Default rate limit configs per backend
    DEFAULT_CONFIGS: dict[str, dict[ModelTier, RateLimitConfig]] = {
        "local": {
            # Local vLLM is only limited by GPU memory/compute
            "haiku": RateLimitConfig(requests_per_minute=120, min_request_interval_ms=50),
            "sonnet": RateLimitConfig(requests_per_minute=60, min_request_interval_ms=100),
            "opus": RateLimitConfig(requests_per_minute=30, min_request_interval_ms=200),
        },
        "cloud": {
            # Claude API rate limits (conservative to avoid 429 errors)
            # Actual limits vary by plan, these are safe defaults
            "haiku": RateLimitConfig(
                requests_per_minute=50,
                tokens_per_minute=100000,
                min_request_interval_ms=200,
            ),
            "sonnet": RateLimitConfig(
                requests_per_minute=40,
                tokens_per_minute=80000,
                min_request_interval_ms=300,
            ),
            "opus": RateLimitConfig(
                requests_per_minute=20,
                tokens_per_minute=40000,
                min_request_interval_ms=500,
            ),
        },
    }

    def __init__(self) -> None:
        """Initialize the rate limiter."""
        self._states: dict[str, RateLimitState] = defaultdict(RateLimitState)
        self._lock = Lock()
        self._configs = self.DEFAULT_CONFIGS.copy()

    def _get_key(self, tier: ModelTier, backend: str) -> str:
        """Generate a unique key for tier/backend combination."""
        return f"{backend}:{tier}"

    def _get_config(self, tier: ModelTier, backend: str) -> RateLimitConfig:
        """Get rate limit config for tier/backend."""
        backend_configs = self._configs.get(backend, self._configs["local"])
        return backend_configs.get(tier, RateLimitConfig())

    def _cleanup_old_entries(self, state: RateLimitState, window_seconds: float = 60.0) -> None:
        """Remove entries older than the sliding window."""
        now = time.time()
        cutoff = now - window_seconds

        # Clean up request timestamps
        state.request_timestamps = [ts for ts in state.request_timestamps if ts > cutoff]

        # Clean up token counts
        state.token_counts = [(ts, tokens) for ts, tokens in state.token_counts if ts > cutoff]

    def _calculate_wait_time(
        self,
        state: RateLimitState,
        config: RateLimitConfig,
    ) -> float:
        """Calculate how long to wait before the next request.

        Returns:
            Wait time in seconds (0.0 if no wait needed)
        """
        now = time.time()

        # Check minimum interval since last request
        time_since_last = (now - state.last_request_time) * 1000  # Convert to ms
        if time_since_last < config.min_request_interval_ms:
            interval_wait = (config.min_request_interval_ms - time_since_last) / 1000
        else:
            interval_wait = 0.0

        # Check requests per minute
        self._cleanup_old_entries(state)
        current_rpm = len(state.request_timestamps)

        if current_rpm >= config.requests_per_minute:
            # Find when the oldest request will fall outside the window
            oldest_ts = min(state.request_timestamps)
            rpm_wait = (oldest_ts + 60.0) - now + 0.1  # Add 100ms buffer
        else:
            rpm_wait = 0.0

        # Check tokens per minute if configured
        tpm_wait = 0.0
        if config.tokens_per_minute:
            total_tokens = sum(tokens for _, tokens in state.token_counts)
            if total_tokens >= config.tokens_per_minute:
                oldest_ts = min(ts for ts, _ in state.token_counts)
                tpm_wait = (oldest_ts + 60.0) - now + 0.1

        return max(interval_wait, rpm_wait, tpm_wait)

    async def acquire(self, tier: ModelTier, backend: str = "local") -> None:
        """Acquire permission to make a request, waiting if necessary.

        This should be called before making a model API call. It will
        block (asynchronously) if the rate limit would be exceeded.

        Args:
            tier: The model tier being used
            backend: The backend ("local" or "cloud")
        """
        key = self._get_key(tier, backend)
        config = self._get_config(tier, backend)

        while True:
            with self._lock:
                state = self._states[key]
                wait_time = self._calculate_wait_time(state, config)

                if wait_time <= 0:
                    # Record the request
                    now = time.time()
                    state.request_timestamps.append(now)
                    state.last_request_time = now
                    return

            # Wait outside the lock
            if wait_time > 0:
                logger.debug(
                    "Rate limit delay",
                    tier=tier,
                    backend=backend,
                    wait_seconds=round(wait_time, 2),
                )
                await asyncio.sleep(wait_time)

    def record_tokens(self, tier: ModelTier, backend: str, tokens: int) -> None:
        """Record token usage for TPM tracking.

        Call this after a successful request to track token consumption.

        Args:
            tier: The model tier used
            backend: The backend ("local" or "cloud")
            tokens: Number of tokens used (input + output)
        """
        key = self._get_key(tier, backend)

        with self._lock:
            state = self._states[key]
            state.token_counts.append((time.time(), tokens))

    def get_status(self, tier: ModelTier, backend: str) -> dict[str, int | float]:
        """Get current rate limit status for a tier/backend.

        Returns:
            Dictionary with current usage and limits
        """
        key = self._get_key(tier, backend)
        config = self._get_config(tier, backend)

        with self._lock:
            state = self._states[key]
            self._cleanup_old_entries(state)

            current_rpm = len(state.request_timestamps)
            current_tpm = sum(tokens for _, tokens in state.token_counts)

            return {
                "current_rpm": current_rpm,
                "max_rpm": config.requests_per_minute,
                "current_tpm": current_tpm,
                "max_tpm": config.tokens_per_minute or 0,
                "available_requests": max(0, config.requests_per_minute - current_rpm),
            }

    def reset(self, tier: ModelTier | None = None, backend: str | None = None) -> None:
        """Reset rate limit state.

        Args:
            tier: Specific tier to reset (None for all)
            backend: Specific backend to reset (None for all)
        """
        with self._lock:
            if tier is None and backend is None:
                self._states.clear()
            elif tier and backend:
                key = self._get_key(tier, backend)
                self._states.pop(key, None)
            else:
                # Reset matching entries
                keys_to_remove = []
                for key in self._states:
                    key_backend, key_tier = key.split(":")
                    if (backend is None or key_backend == backend) and (
                        tier is None or key_tier == tier
                    ):
                        keys_to_remove.append(key)
                for key in keys_to_remove:
                    del self._states[key]

        logger.debug("Rate limiter reset", tier=tier, backend=backend)


# Global rate limiter instance
_rate_limiter: ModelRateLimiter | None = None
_rate_limiter_lock = Lock()


def get_rate_limiter() -> ModelRateLimiter:
    """Get the global rate limiter instance (singleton).

    Returns:
        The global ModelRateLimiter instance
    """
    global _rate_limiter

    if _rate_limiter is None:
        with _rate_limiter_lock:
            if _rate_limiter is None:
                _rate_limiter = ModelRateLimiter()
                logger.info("Model rate limiter initialized")

    return _rate_limiter


def reset_rate_limiter() -> None:
    """Reset the global rate limiter.

    Useful for testing or when starting a new workflow.
    """
    global _rate_limiter

    with _rate_limiter_lock:
        if _rate_limiter is not None:
            _rate_limiter.reset()


class ModelConfig:
    """Configuration for model tiers.

    Each tier has different token limits and timeouts optimized for
    different task complexities. When using local vLLM, all tiers
    use the same underlying model but with different configurations.
    """

    # Configuration per model tier
    TIERS: dict[ModelTier, dict[str, int | float]] = {
        "haiku": {
            "max_tokens": 2048,
            "temperature": 0.0,
            "timeout": 120.0,  # 2 minutes
        },
        "sonnet": {
            "max_tokens": 4096,
            "temperature": 0.0,
            "timeout": 180.0,  # 3 minutes
        },
        "opus": {
            "max_tokens": 8192,
            "temperature": 0.0,
            "timeout": 300.0,  # 5 minutes
        },
    }

    # Claude model names (used when fallback to Claude API)
    CLAUDE_MODELS: dict[ModelTier, str] = {
        "haiku": "claude-haiku-4-5-20251001",
        "sonnet": "claude-sonnet-4-5-20250514",
        "opus": "claude-opus-4-5-20250514",
    }

    @classmethod
    def get_config(cls, tier: ModelTier) -> dict[str, int | float]:
        """Get configuration for a model tier."""
        return cls.TIERS[tier].copy()


class ModelFactory:
    """Factory for creating and configuring language models.

    Primary backend is local vLLM (Qwen 2.5 Coder). Falls back to
    Claude API if local model fails and fallback is enabled.

    Fallback behavior:
    - If USE_LOCAL_LLM=true and local fails → try Claude (if API key set)
    - If USE_LOCAL_LLM=false → use Claude directly
    - Fallback can be disabled via create(..., allow_fallback=False)
    """

    @classmethod
    def _create_local_model(
        cls,
        tier: ModelTier = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatOpenAI:
        """Create a local model instance via vLLM (OpenAI-compatible API).

        Args:
            tier: Model tier (determines config, not model selection)
            temperature: Override default temperature
            max_tokens: Override default max_tokens

        Returns:
            ChatOpenAI instance pointing to local vLLM server
        """
        config = ModelConfig.get_config(tier)
        if temperature is not None:
            config["temperature"] = temperature
        if max_tokens is not None:
            config["max_tokens"] = max_tokens

        logger.debug(
            "Creating local vLLM model",
            model=settings.local_llm_model,
            tier=tier,
            max_tokens=config["max_tokens"],
        )

        return ChatOpenAI(
            model=settings.local_llm_model,
            base_url=settings.local_llm_base_url,
            api_key="not-needed",  # vLLM doesn't require API key
            temperature=float(config["temperature"]),
            max_tokens=int(config["max_tokens"]),
            timeout=float(config["timeout"]),
        )

    @classmethod
    def _create_claude_model(
        cls,
        tier: ModelTier = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatAnthropic:
        """Create a Claude model instance via Anthropic API.

        Args:
            tier: Model tier (haiku, sonnet, opus)
            temperature: Override default temperature
            max_tokens: Override default max_tokens

        Returns:
            ChatAnthropic instance

        Raises:
            ValueError: If Anthropic API key is not configured
        """
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured for Claude fallback")

        config = ModelConfig.get_config(tier)
        if temperature is not None:
            config["temperature"] = temperature
        if max_tokens is not None:
            config["max_tokens"] = max_tokens

        model_name = ModelConfig.CLAUDE_MODELS[tier]

        logger.debug(
            "Creating Claude model",
            model=model_name,
            tier=tier,
            max_tokens=config["max_tokens"],
        )

        return ChatAnthropic(
            model=model_name,
            api_key=settings.anthropic_api_key,
            temperature=float(config["temperature"]),
            max_tokens=int(config["max_tokens"]),
            timeout=float(config["timeout"]),
            max_retries=2,
        )

    @classmethod
    def create(
        cls,
        tier: ModelTier = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
        allow_fallback: bool = True,
    ) -> ChatModel:
        """Create a chat model instance with optional fallback.

        When USE_LOCAL_LLM is enabled (default), creates a local vLLM model.
        If local model creation fails and allow_fallback=True, attempts to
        create a Claude model instead.

        Args:
            tier: Model tier ('haiku', 'sonnet', or 'opus')
            temperature: Override default temperature (0.0-1.0)
            max_tokens: Override default max_tokens
            allow_fallback: Whether to try Claude if local fails

        Returns:
            Configured chat model instance

        Raises:
            ValueError: If tier is invalid
            RuntimeError: If both local and fallback fail
        """
        if tier not in ModelConfig.TIERS:
            raise ValueError(
                f"Unknown tier: {tier}. Must be one of {list(ModelConfig.TIERS.keys())}"
            )

        # Determine primary backend
        use_local = settings.use_local_llm

        if use_local:
            try:
                return cls._create_local_model(tier, temperature, max_tokens)
            except Exception as e:
                if not allow_fallback:
                    raise RuntimeError(f"Local model creation failed: {e}") from e

                # Try Claude fallback
                if settings.anthropic_api_key:
                    logger.warning(
                        "Local model failed, falling back to Claude",
                        tier=tier,
                        error=str(e),
                    )
                    try:
                        return cls._create_claude_model(tier, temperature, max_tokens)
                    except Exception as fallback_error:
                        raise RuntimeError(
                            f"Both local ({e}) and Claude ({fallback_error}) failed"
                        ) from fallback_error
                else:
                    raise RuntimeError(
                        f"Local model failed and no Claude API key for fallback: {e}"
                    ) from e
        else:
            # Claude is primary
            try:
                return cls._create_claude_model(tier, temperature, max_tokens)
            except Exception as e:
                if not allow_fallback:
                    raise RuntimeError(f"Claude model creation failed: {e}") from e

                # Try local fallback
                logger.warning(
                    "Claude failed, falling back to local model",
                    tier=tier,
                    error=str(e),
                )
                try:
                    return cls._create_local_model(tier, temperature, max_tokens)
                except Exception as fallback_error:
                    raise RuntimeError(
                        f"Both Claude ({e}) and local ({fallback_error}) failed"
                    ) from fallback_error

    @classmethod
    async def create_with_health_check(
        cls,
        tier: ModelTier = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatModel:
        """Create a model and verify it's responsive with a health check.

        Sends a simple test message to verify the model is working before
        returning it. Automatically falls back if health check fails.

        Args:
            tier: Model tier
            temperature: Override temperature
            max_tokens: Override max tokens

        Returns:
            Verified working chat model

        Raises:
            RuntimeError: If no working model could be created
        """
        # Try primary backend
        use_local = settings.use_local_llm
        backends = ["local", "claude"] if use_local else ["claude", "local"]

        last_error: Exception | None = None

        for backend in backends:
            try:
                model: ChatModel
                if backend == "local":
                    model = cls._create_local_model(tier, temperature, max_tokens)
                else:
                    if not settings.anthropic_api_key:
                        continue
                    model = cls._create_claude_model(tier, temperature, max_tokens)

                # Health check with simple message
                response = await asyncio.wait_for(
                    model.ainvoke([("human", "Say 'ok' if you're working.")]),
                    timeout=30.0,
                )

                if response and response.content:
                    logger.info(
                        "Model health check passed",
                        backend=backend,
                        tier=tier,
                    )
                    return model

            except Exception as e:
                last_error = e
                logger.warning(
                    "Model health check failed",
                    backend=backend,
                    tier=tier,
                    error=str(e),
                )
                continue

        raise RuntimeError(f"No working model available: {last_error}")

    @classmethod
    def create_for_task(
        cls,
        task_complexity: Literal["low", "medium", "high"] = "medium",
    ) -> ChatModel:
        """Create a model based on task complexity.

        Maps complexity to model tier:
        - low → haiku (fast, efficient)
        - medium → sonnet (balanced, default)
        - high → opus (powerful, thorough)

        For automatic complexity detection, use get_model_for_task()
        which analyzes the task description.

        Args:
            task_complexity: Task difficulty level

        Returns:
            Chat model optimized for the task complexity
        """
        tier_map: dict[str, ModelTier] = {
            "low": "haiku",
            "medium": "sonnet",
            "high": "opus",
        }
        tier = tier_map.get(task_complexity, "sonnet")
        logger.debug("Creating model for task", complexity=task_complexity, tier=tier)
        return cls.create(tier)


# Convenience functions for agent nodes


def get_planner_model() -> ChatModel:
    """Get model for planning tasks.

    Planning benefits from thorough analysis, uses sonnet tier.

    Returns:
        Chat model for planning
    """
    return ModelFactory.create("sonnet")


def get_coder_model() -> ChatModel:
    """Get model for code generation.

    Coding requires high-quality output, uses sonnet tier.

    Returns:
        Chat model for coding
    """
    return ModelFactory.create("sonnet")


def get_tester_model() -> ChatModel:
    """Get model for test generation.

    Testing requires thorough coverage, uses sonnet tier.

    Returns:
        Chat model for testing
    """
    return ModelFactory.create("sonnet")


def get_reviewer_model() -> ChatModel:
    """Get model for code review.

    Review is critical for quality, uses sonnet tier.
    For council review, use get_council_judge_model() instead.

    Returns:
        Chat model for review
    """
    return ModelFactory.create("sonnet")


# =============================================================================
# Council Review and Task Complexity
# =============================================================================


class TaskComplexityAnalyzer:
    """Analyze task description to determine complexity level.

    Uses keyword matching to classify tasks as low, medium, or high complexity.
    This helps with model tier selection and cost optimization.

    Example:
        analyzer = TaskComplexityAnalyzer()
        complexity = analyzer.analyze("Create a simple hello world function")
        # Returns: "low"

        complexity = analyzer.analyze("Design a distributed caching system")
        # Returns: "high"
    """

    # Keywords that indicate high complexity tasks
    HIGH_COMPLEXITY_KEYWORDS = [
        "distributed",
        "concurrent",
        "security",
        "cryptography",
        "database migration",
        "api design",
        "architecture",
        "machine learning",
        "optimization",
        "real-time",
        "authentication",
        "authorization",
        "microservices",
        "scalable",
        "high availability",
        "fault tolerant",
        "race condition",
        "thread safe",
        "async",
        "websocket",
    ]

    # Keywords that indicate low complexity tasks
    LOW_COMPLEXITY_KEYWORDS = [
        "simple",
        "basic",
        "hello world",
        "print",
        "format",
        "rename",
        "refactor",
        "comment",
        "typo",
        "fix bug",
        "update",
        "add docstring",
        "lint",
        "style",
        "trivial",
    ]

    @classmethod
    def analyze(cls, task_description: str) -> Literal["low", "medium", "high"]:
        """Analyze task description and return complexity level.

        Args:
            task_description: The task description to analyze

        Returns:
            Complexity level: "low", "medium", or "high"
        """
        desc_lower = task_description.lower()

        # Count keyword matches
        high_matches = sum(1 for keyword in cls.HIGH_COMPLEXITY_KEYWORDS if keyword in desc_lower)
        low_matches = sum(1 for keyword in cls.LOW_COMPLEXITY_KEYWORDS if keyword in desc_lower)

        # Determine complexity based on matches
        if high_matches >= 2:
            logger.debug(
                "Task classified as high complexity",
                high_matches=high_matches,
                low_matches=low_matches,
            )
            return "high"
        elif low_matches >= 2 and high_matches == 0:
            logger.debug(
                "Task classified as low complexity",
                high_matches=high_matches,
                low_matches=low_matches,
            )
            return "low"
        else:
            logger.debug(
                "Task classified as medium complexity",
                high_matches=high_matches,
                low_matches=low_matches,
            )
            return "medium"


def get_council_judge_model(
    persona: str,
    tier: ModelTier | None = None,
) -> ChatModel:
    """Get a model configured for a specific council judge persona.

    For local vLLM: Returns the same model for all personas (differentiation
    is done via system prompts in the council module).

    For Claude API: Can optionally use different tiers for different personas.

    Args:
        persona: The judge persona (e.g., "security", "performance")
        tier: Optional model tier override. If None, uses sonnet.

    Returns:
        Chat model configured for the judge
    """
    # Default all judges to sonnet tier for consistency
    model_tier = tier or "sonnet"

    logger.debug(
        "Creating council judge model",
        persona=persona,
        tier=model_tier,
        backend="local" if settings.use_local_llm else "cloud",
    )

    return ModelFactory.create(model_tier)


def get_council_models() -> dict[str, ChatModel]:
    """Get all models needed for a council review.

    For local vLLM: Returns three identical model instances (differentiation
    is done via system prompts).

    For Claude API: Returns three different model tiers for diverse perspectives.

    Returns:
        Dictionary mapping judge persona to model instance
    """
    if settings.use_local_llm:
        # Local mode: same model, different prompts
        return {
            "security_judge": ModelFactory.create("sonnet"),
            "performance_judge": ModelFactory.create("sonnet"),
            "maintainability_judge": ModelFactory.create("sonnet"),
        }
    else:
        # Cloud mode: different model tiers
        return {
            "security_judge": ModelFactory.create("haiku"),  # Quick security scan
            "performance_judge": ModelFactory.create("opus"),  # Deep performance analysis
            "maintainability_judge": ModelFactory.create("sonnet"),  # Balanced review
        }


def get_model_for_task(task_description: str) -> ChatModel:
    """Get a model automatically selected based on task complexity.

    Analyzes the task description to determine complexity and returns
    an appropriately-sized model.

    Args:
        task_description: The task to be performed

    Returns:
        Chat model optimized for the task complexity
    """
    complexity = TaskComplexityAnalyzer.analyze(task_description)
    return ModelFactory.create_for_task(complexity)


# =============================================================================
# Quality-Based Tier Adjustment
# =============================================================================


class QualityBasedTierSelector:
    """Select model tier based on code quality scores.

    When reviewing code, lower quality code may benefit from more thorough
    review by a more capable model (opus). Higher quality code can be
    reviewed efficiently by a faster model (haiku).

    This enables cost optimization by using expensive models only when needed.

    Thresholds:
    - score < 50: Use opus (low quality needs deep analysis)
    - 50 <= score < 75: Use sonnet (medium quality, balanced)
    - score >= 75: Use haiku (high quality, quick verification)
    """

    # Quality score thresholds for tier selection
    OPUS_THRESHOLD = 50  # Below this, use opus
    HAIKU_THRESHOLD = 75  # At or above this, use haiku

    @classmethod
    def get_tier_for_quality(cls, quality_score: float) -> ModelTier:
        """Get recommended model tier based on quality score.

        Args:
            quality_score: Code quality score (0-100)

        Returns:
            Recommended model tier
        """
        if quality_score < cls.OPUS_THRESHOLD:
            logger.debug(
                "Low quality score, recommending opus tier",
                quality_score=quality_score,
            )
            return "opus"
        elif quality_score >= cls.HAIKU_THRESHOLD:
            logger.debug(
                "High quality score, recommending haiku tier",
                quality_score=quality_score,
            )
            return "haiku"
        else:
            logger.debug(
                "Medium quality score, recommending sonnet tier",
                quality_score=quality_score,
            )
            return "sonnet"

    @classmethod
    def get_model_for_review(
        cls,
        quality_score: float | None = None,
        code: str | None = None,
    ) -> ChatModel:
        """Get a model for code review, adjusted by quality if available.

        If quality_score is provided, uses it to select tier.
        If only code is provided, analyzes it first.
        If neither, defaults to sonnet tier.

        Args:
            quality_score: Pre-calculated quality score (0-100)
            code: Source code to analyze if score not provided

        Returns:
            Chat model for review
        """
        tier: ModelTier = "sonnet"  # Default

        if quality_score is not None:
            tier = cls.get_tier_for_quality(quality_score)
        elif code is not None:
            # Analyze code quality on demand
            from src.agents.analyzers.code_quality import analyze_code_quality

            analysis = analyze_code_quality(code)
            tier = cls.get_tier_for_quality(analysis.overall_score)
            logger.info(
                "Analyzed code quality for tier selection",
                quality_score=analysis.overall_score,
                selected_tier=tier,
            )
        else:
            logger.debug("No quality info provided, using default sonnet tier")

        return ModelFactory.create(tier)


def get_reviewer_model_for_code(code: str) -> ChatModel:
    """Get a review model with tier automatically adjusted for code quality.

    Convenience function that analyzes code and returns an appropriate
    model for reviewing it.

    Args:
        code: The source code to be reviewed

    Returns:
        Chat model with tier adjusted for code quality
    """
    return QualityBasedTierSelector.get_model_for_review(code=code)


def get_tier_for_quality_score(quality_score: float) -> ModelTier:
    """Get recommended tier for a quality score.

    Convenience function for external use.

    Args:
        quality_score: Code quality score (0-100)

    Returns:
        Recommended model tier
    """
    return QualityBasedTierSelector.get_tier_for_quality(quality_score)
