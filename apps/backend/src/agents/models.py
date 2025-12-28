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

TODO: Add rate limiting per model (Phase 4)
"""

import asyncio
from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Type aliases
ModelTier = Literal["haiku", "sonnet", "opus"]
ChatModel = ChatAnthropic | ChatOpenAI


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

        Args:
            task_complexity: Task difficulty level

        Returns:
            Chat model optimized for the task complexity

        TODO: Add task complexity auto-detection (Phase 3)
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

    TODO: Add code quality scoring to adjust tier (Phase 3)
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

    Returns:
        Chat model for review

    TODO: For council review, use multiple models (Phase 3)
    """
    return ModelFactory.create("sonnet")
