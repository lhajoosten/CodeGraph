"""Base agent class with LangSmith tracing support."""

from abc import ABC, abstractmethod
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class BaseAgent(ABC):
    """Base class for all CodeGraph agents."""

    def __init__(self, model_name: str | None = None):
        """
        Initialize the base agent.

        Args:
            model_name: Optional Claude model name to use
        """
        self.model_name = model_name or settings.anthropic_default_model
        self.logger = logger

    @abstractmethod
    async def execute(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent with the given input.

        Args:
            input_data: Input data for the agent

        Returns:
            Agent execution results

        Raises:
            AgentException: If execution fails
        """
        pass

    def _log_execution(self, event: str, **kwargs: Any) -> None:
        """
        Log agent execution event.

        Args:
            event: Event type
            **kwargs: Additional context
        """
        self.logger.info(
            event,
            agent_type=self.__class__.__name__,
            model=self.model_name,
            **kwargs,
        )
