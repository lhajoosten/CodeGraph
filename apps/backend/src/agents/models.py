"""Model factory for initializing language models via LangChain.

This module provides a centralized factory for creating chat model instances
with consistent configuration across all agent nodes. Supports:
- Claude models (Haiku, Sonnet, Opus) via Anthropic API
- Local models via vLLM (OpenAI-compatible API) for cost-effective testing

The USE_LOCAL_LLM environment variable controls which backend is used.
When enabled, all model requests are routed to the local vLLM server
running Qwen 2.5 Coder 14B or similar.

TODO: Add model fallback logic if primary model fails (Phase 2)
TODO: Add token usage tracking and cost estimation (Phase 2)
TODO: Add rate limiting per model (Phase 4)
"""

from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Type alias for chat models (Claude or OpenAI-compatible)
ChatModel = ChatAnthropic | ChatOpenAI


class ModelFactory:
    """Factory for creating and configuring language models.

    Supports both Claude (Anthropic) and local models (vLLM/OpenAI-compatible).
    The USE_LOCAL_LLM environment variable controls which backend is used.
    """

    # Model configuration with defaults
    # Note: Timeouts are higher for local vLLM which may be slower than cloud APIs
    MODEL_CONFIG: dict[str, dict[str, int | float]] = {
        "haiku": {
            "max_tokens": 2048,
            "temperature": 0.0,
            "timeout": 120.0,  # 2 minutes (local vLLM may be slower)
        },
        "sonnet": {
            "max_tokens": 4096,
            "temperature": 0.0,
            "timeout": 180.0,  # 3 minutes
        },
        "opus": {
            "max_tokens": 4096,
            "temperature": 0.0,
            "timeout": 300.0,  # 5 minutes
        },
    }

    # Model name mappings for Claude
    # Using Haiku 4.5 for cost-effective testing
    # Can be updated to use Sonnet/Opus when available or for production
    MODEL_NAMES = {
        "haiku": "claude-haiku-4-5-20251001",
        "sonnet": "claude-haiku-4-5-20251001",  # Use Haiku for testing (Sonnet not yet available)
        "opus": "claude-haiku-4-5-20251001",  # Use Haiku for testing (Opus not yet available)
    }

    @classmethod
    def _create_local_model(
        cls,
        model: Literal["haiku", "sonnet", "opus"] = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatOpenAI:
        """Create a local model instance via vLLM (OpenAI-compatible API).

        Args:
            model: Model type (used for config lookup, not model selection)
            temperature: Override default temperature
            max_tokens: Override default max_tokens

        Returns:
            ChatOpenAI instance pointing to local vLLM server
        """
        config = cls.MODEL_CONFIG[model].copy()
        config["temperature"] = temperature if temperature is not None else config["temperature"]
        config["max_tokens"] = max_tokens if max_tokens is not None else config["max_tokens"]

        logger.info(
            "Creating local LLM instance (vLLM)",
            model=settings.local_llm_model,
            base_url=settings.local_llm_base_url,
            max_tokens=config["max_tokens"],
            temperature=config["temperature"],
        )

        return ChatOpenAI(
            model=settings.local_llm_model,
            base_url=settings.local_llm_base_url,
            api_key="not-needed",  # vLLM doesn't require API key
            temperature=config["temperature"],
            max_tokens=int(config["max_tokens"]),
            timeout=config["timeout"],
        )

    @classmethod
    def create(
        cls,
        model: Literal["haiku", "sonnet", "opus"] = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatModel:
        """Create a chat model instance (Claude or local vLLM).

        When USE_LOCAL_LLM is enabled, returns a ChatOpenAI instance
        pointing to the local vLLM server. Otherwise, returns a
        ChatAnthropic instance for Claude.

        Args:
            model: Model size ('haiku', 'sonnet', or 'opus')
            temperature: Override default temperature (0.0-1.0)
            max_tokens: Override default max_tokens

        Returns:
            Configured chat model instance (ChatAnthropic or ChatOpenAI)

        Raises:
            ValueError: If model name is invalid

        TODO: Add structured output support for code generation (Phase 2)
        """
        if model not in cls.MODEL_NAMES:
            raise ValueError(
                f"Unknown model: {model}. Must be one of {list(cls.MODEL_NAMES.keys())}"
            )

        # Use local LLM if enabled (for cost-effective testing)
        if settings.use_local_llm:
            return cls._create_local_model(model, temperature, max_tokens)

        config = cls.MODEL_CONFIG[model].copy()
        config["temperature"] = temperature if temperature is not None else config["temperature"]
        config["max_tokens"] = max_tokens if max_tokens is not None else config["max_tokens"]

        model_name = cls.MODEL_NAMES[model]

        logger.info(
            "Creating Claude model instance",
            model_name=model_name,
            model_type=model,
            max_tokens=config["max_tokens"],
            temperature=config["temperature"],
        )

        return ChatAnthropic(
            model=model_name,
            api_key=settings.anthropic_api_key,
            temperature=config["temperature"],
            max_tokens=config["max_tokens"],
            timeout=config["timeout"],
            max_retries=2,
        )

    @classmethod
    def create_for_task(
        cls, task_complexity: Literal["low", "medium", "high"] = "medium"
    ) -> ChatModel:
        """Create a model based on task complexity.

        Uses Haiku for simple tasks (cost-effective), Sonnet for medium tasks
        (balanced), and Opus for complex tasks (highest quality).

        Args:
            task_complexity: Task difficulty level

        Returns:
            ChatAnthropic instance optimized for the task

        TODO: Add task complexity auto-detection (Phase 3)
        """
        model_map: dict[str, Literal["haiku", "sonnet", "opus"]] = {
            "low": "haiku",
            "medium": "sonnet",
            "high": "opus",
        }
        model = model_map.get(task_complexity, "sonnet")
        if model is None:
            model = "sonnet"
        logger.info("Created model for task", complexity=task_complexity, selected_model=model)
        return cls.create(model)


def get_planner_model() -> ChatModel:
    """Get model for planning tasks.

    Planning benefits from a capable model to break down complex tasks
    effectively, so we use Sonnet by default.

    Returns:
        Chat model for planning (Claude or local vLLM)

    TODO: Make model selection configurable per environment (Phase 4)
    """
    return ModelFactory.create("sonnet")


def get_coder_model() -> ChatModel:
    """Get model for code generation.

    Coding requires high-quality output, so we use Sonnet or Opus depending
    on task complexity.

    Returns:
        Chat model for coding (Claude or local vLLM)

    TODO: Add code quality scoring to adjust model selection (Phase 3)
    """
    return ModelFactory.create("sonnet")


def get_tester_model() -> ChatModel:
    """Get model for test generation.

    Testing requires thorough coverage but not necessarily the most powerful
    model, so we use Sonnet.

    Returns:
        Chat model for testing (Claude or local vLLM)

    TODO: Add test coverage analysis (Phase 2)
    """
    return ModelFactory.create("sonnet")


def get_reviewer_model() -> ChatModel:
    """Get model for code review.

    Review is critical for code quality and should use a capable model
    like Sonnet or Opus.

    Returns:
        Chat model for review (Claude or local vLLM)

    TODO: For council review, use multiple models (Phase 3)
    """
    return ModelFactory.create("sonnet")
