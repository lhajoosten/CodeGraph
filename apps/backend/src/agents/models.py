"""Model factory for initializing Claude language models via LangChain.

This module provides a centralized factory for creating ChatAnthropic instances
with consistent configuration across all agent nodes. Supports Haiku, Sonnet,
and Opus models with model-specific token limits and temperature settings.

TODO: Add model fallback logic if primary model fails (Phase 2)
TODO: Add token usage tracking and cost estimation (Phase 2)
TODO: Add rate limiting per model (Phase 4)
"""

from typing import Literal

from langchain_anthropic import ChatAnthropic

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class ModelFactory:
    """Factory for creating and configuring Claude language models."""

    # Model configuration with defaults
    MODEL_CONFIG: dict[str, dict[str, int | float]] = {
        "haiku": {
            "max_tokens": 2048,
            "temperature": 0.0,
            "timeout": 20.0,
        },
        "sonnet": {
            "max_tokens": 4096,
            "temperature": 0.0,
            "timeout": 30.0,
        },
        "opus": {
            "max_tokens": 4096,
            "temperature": 0.0,
            "timeout": 60.0,
        },
    }

    # Model name mappings
    MODEL_NAMES = {
        "haiku": "claude-haiku-4-20250514",
        "sonnet": "claude-sonnet-4-20250514",
        "opus": "claude-opus-4-20250514",
    }

    @classmethod
    def create(
        cls,
        model: Literal["haiku", "sonnet", "opus"] = "sonnet",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatAnthropic:
        """Create a ChatAnthropic model instance.

        Args:
            model: Model size ('haiku', 'sonnet', or 'opus')
            temperature: Override default temperature (0.0-1.0)
            max_tokens: Override default max_tokens

        Returns:
            Configured ChatAnthropic instance

        Raises:
            ValueError: If model name is invalid

        TODO: Add structured output support for code generation (Phase 2)
        """
        if model not in cls.MODEL_NAMES:
            raise ValueError(
                f"Unknown model: {model}. Must be one of {list(cls.MODEL_NAMES.keys())}"
            )

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
    ) -> ChatAnthropic:
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


def get_planner_model() -> ChatAnthropic:
    """Get Claude model for planning tasks.

    Planning benefits from a capable model to break down complex tasks
    effectively, so we use Sonnet by default.

    Returns:
        ChatAnthropic model for planning

    TODO: Make model selection configurable per environment (Phase 4)
    """
    return ModelFactory.create("sonnet")


def get_coder_model() -> ChatAnthropic:
    """Get Claude model for code generation.

    Coding requires high-quality output, so we use Sonnet or Opus depending
    on task complexity.

    Returns:
        ChatAnthropic model for coding

    TODO: Add code quality scoring to adjust model selection (Phase 3)
    """
    return ModelFactory.create("sonnet")


def get_tester_model() -> ChatAnthropic:
    """Get Claude model for test generation.

    Testing requires thorough coverage but not necessarily the most powerful
    model, so we use Sonnet.

    Returns:
        ChatAnthropic model for testing

    TODO: Add test coverage analysis (Phase 2)
    """
    return ModelFactory.create("sonnet")


def get_reviewer_model() -> ChatAnthropic:
    """Get Claude model for code review.

    Review is critical for code quality and should use a capable model
    like Sonnet or Opus.

    Returns:
        ChatAnthropic model for review

    TODO: For council review, use multiple models (Phase 3)
    """
    return ModelFactory.create("sonnet")
