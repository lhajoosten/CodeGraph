"""Tool registry for managing and discovering agent tools.

This module provides a central registry for all agent tools, allowing:
- Registration of tools by category
- Retrieval of tools for specific agent types
- Dynamic tool binding to LangChain models
"""

from enum import Enum
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.tools import BaseTool

from src.core.logging import get_logger

logger = get_logger(__name__)


class AgentType(str, Enum):
    """Types of agents that can use tools."""

    PLANNER = "planner"
    CODER = "coder"
    TESTER = "tester"
    REVIEWER = "reviewer"
    COUNCIL = "council"


class ToolCategory(str, Enum):
    """Categories of tools."""

    FILESYSTEM = "filesystem"
    GIT = "git"
    DATABASE = "database"
    EXECUTION = "execution"
    SEARCH = "search"


# Agent to tool category mapping
AGENT_TOOL_MAPPING: dict[AgentType, list[ToolCategory]] = {
    AgentType.PLANNER: [
        ToolCategory.FILESYSTEM,
        ToolCategory.SEARCH,
        ToolCategory.DATABASE,  # Read-only database introspection
    ],
    AgentType.CODER: [
        ToolCategory.FILESYSTEM,
        ToolCategory.GIT,
        ToolCategory.SEARCH,
        ToolCategory.DATABASE,  # Full database access
        ToolCategory.EXECUTION,  # Run code, tests, linters
    ],
    AgentType.TESTER: [
        ToolCategory.FILESYSTEM,
        ToolCategory.EXECUTION,
        ToolCategory.SEARCH,
        ToolCategory.DATABASE,  # For testing database queries
    ],
    AgentType.REVIEWER: [
        ToolCategory.FILESYSTEM,
        ToolCategory.GIT,
        ToolCategory.SEARCH,
        ToolCategory.DATABASE,  # Read-only for reviewing
    ],
    AgentType.COUNCIL: [
        ToolCategory.FILESYSTEM,
        ToolCategory.SEARCH,
    ],
}


class ToolRegistry:
    """Central registry for agent tools.

    Singleton pattern ensures all agents share the same tool registry.
    """

    _instance: "ToolRegistry | None" = None
    _initialized: bool = False

    def __new__(cls) -> "ToolRegistry":
        """Create or return singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """Initialize the registry (only once)."""
        if ToolRegistry._initialized:
            return

        self._tools: dict[ToolCategory, list[BaseTool]] = {
            category: [] for category in ToolCategory
        }
        self._all_tools: list[BaseTool] = []

        ToolRegistry._initialized = True
        logger.info("tool_registry_initialized")

    def register(
        self,
        tool: BaseTool,
        category: ToolCategory,
    ) -> None:
        """Register a tool in the registry.

        Args:
            tool: The tool to register
            category: Category for the tool
        """
        if tool not in self._tools[category]:
            self._tools[category].append(tool)
            if tool not in self._all_tools:
                self._all_tools.append(tool)

            logger.debug(
                "tool_registered",
                tool_name=tool.name,
                category=category.value,
            )

    def register_many(
        self,
        tools: list[BaseTool],
        category: ToolCategory,
    ) -> None:
        """Register multiple tools in the registry.

        Args:
            tools: List of tools to register
            category: Category for the tools
        """
        for tool in tools:
            self.register(tool, category)

    def get_tools_by_category(
        self,
        category: ToolCategory,
    ) -> list[BaseTool]:
        """Get all tools in a category.

        Args:
            category: Tool category

        Returns:
            List of tools in the category
        """
        return list(self._tools[category])

    def get_tools_for_agent(
        self,
        agent_type: AgentType | str,
    ) -> list[BaseTool]:
        """Get all tools available for an agent type.

        Args:
            agent_type: Type of agent (enum or string)

        Returns:
            List of tools for the agent
        """
        if isinstance(agent_type, str):
            agent_type = AgentType(agent_type)

        categories = AGENT_TOOL_MAPPING.get(agent_type, [])
        tools: list[BaseTool] = []

        for category in categories:
            for tool in self._tools[category]:
                if tool not in tools:
                    tools.append(tool)

        logger.debug(
            "tools_retrieved_for_agent",
            agent_type=agent_type.value,
            tool_count=len(tools),
            tool_names=[t.name for t in tools],
        )

        return tools

    def get_all_tools(self) -> list[BaseTool]:
        """Get all registered tools.

        Returns:
            List of all tools
        """
        return list(self._all_tools)

    def get_tool_by_name(self, name: str) -> BaseTool | None:
        """Get a tool by its name.

        Args:
            name: Tool name

        Returns:
            Tool if found, None otherwise
        """
        for tool in self._all_tools:
            if tool.name == name:
                return tool
        return None

    def clear(self) -> None:
        """Clear all registered tools (mainly for testing)."""
        self._tools = {category: [] for category in ToolCategory}
        self._all_tools = []
        logger.debug("tool_registry_cleared")


# Global registry instance
_registry: ToolRegistry | None = None


def get_registry() -> ToolRegistry:
    """Get the global tool registry instance.

    Returns:
        The global ToolRegistry singleton
    """
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry


def get_tools_for_agent(agent_type: AgentType | str) -> list[BaseTool]:
    """Get all tools available for an agent type.

    Convenience function that uses the global registry.

    Args:
        agent_type: Type of agent

    Returns:
        List of tools for the agent
    """
    return get_registry().get_tools_for_agent(agent_type)


def bind_tools_to_model(
    model: BaseChatModel,
    agent_type: AgentType | str,
) -> Any:
    """Bind appropriate tools to a model based on agent type.

    Args:
        model: LangChain chat model
        agent_type: Type of agent

    Returns:
        Model with tools bound
    """
    tools = get_tools_for_agent(agent_type)

    if not tools:
        logger.warning(
            "no_tools_bound",
            agent_type=agent_type if isinstance(agent_type, str) else agent_type.value,
        )
        return model

    logger.info(
        "tools_bound_to_model",
        agent_type=agent_type if isinstance(agent_type, str) else agent_type.value,
        tool_count=len(tools),
        tool_names=[t.name for t in tools],
    )

    return model.bind_tools(tools)


def register_tool(
    tool: BaseTool,
    category: ToolCategory,
) -> None:
    """Register a tool in the global registry.

    Convenience function that uses the global registry.

    Args:
        tool: The tool to register
        category: Category for the tool
    """
    get_registry().register(tool, category)


def register_tools(
    tools: list[BaseTool],
    category: ToolCategory,
) -> None:
    """Register multiple tools in the global registry.

    Convenience function that uses the global registry.

    Args:
        tools: List of tools to register
        category: Category for the tools
    """
    get_registry().register_many(tools, category)
