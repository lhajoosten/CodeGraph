"""Tests for the tool registry."""

from langchain_core.tools import tool

from src.tools.registry import (
    AGENT_TOOL_MAPPING,
    AgentType,
    ToolCategory,
    ToolRegistry,
    get_registry,
)


@tool
def mock_read_tool() -> str:
    """Mock read tool for testing."""
    return "read"


@tool
def mock_write_tool() -> str:
    """Mock write tool for testing."""
    return "write"


@tool
def mock_search_tool() -> str:
    """Mock search tool for testing."""
    return "search"


class TestToolRegistry:
    """Tests for ToolRegistry class."""

    def test_singleton_returns_same_instance(self) -> None:
        """get_registry returns the same instance."""
        registry1 = get_registry()
        registry2 = get_registry()
        assert registry1 is registry2

    def test_register_single_tool(self) -> None:
        """Register a single tool."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)

        tools = registry.get_tools_by_category(ToolCategory.FILESYSTEM)
        assert len(tools) == 1
        assert tools[0].name == "mock_read_tool"

    def test_register_many_tools(self) -> None:
        """Register multiple tools at once."""
        registry = ToolRegistry()
        registry.register_many(
            [mock_read_tool, mock_write_tool],
            ToolCategory.FILESYSTEM,
        )

        tools = registry.get_tools_by_category(ToolCategory.FILESYSTEM)
        assert len(tools) == 2
        tool_names = [t.name for t in tools]
        assert "mock_read_tool" in tool_names
        assert "mock_write_tool" in tool_names

    def test_get_tools_for_agent_type(self) -> None:
        """Get tools for specific agent type."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)
        registry.register(mock_search_tool, ToolCategory.SEARCH)

        # Planner should have FILESYSTEM and SEARCH tools
        planner_tools = registry.get_tools_for_agent(AgentType.PLANNER)
        tool_names = [t.name for t in planner_tools]
        assert "mock_read_tool" in tool_names
        assert "mock_search_tool" in tool_names

    def test_get_tools_for_agent_string(self) -> None:
        """Get tools using string agent type."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)

        tools = registry.get_tools_for_agent("planner")
        assert len(tools) > 0

    def test_get_all_tools(self) -> None:
        """Get all registered tools."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)
        registry.register(mock_search_tool, ToolCategory.SEARCH)

        all_tools = registry.get_all_tools()
        # Should have at least 2 tools
        tool_names = [t.name for t in all_tools]
        assert "mock_read_tool" in tool_names
        assert "mock_search_tool" in tool_names

    def test_get_tool_by_name(self) -> None:
        """Get tool by its name."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)

        tool = registry.get_tool_by_name("mock_read_tool")
        assert tool is not None
        assert tool.name == "mock_read_tool"

        # Non-existent tool returns None
        assert registry.get_tool_by_name("nonexistent") is None

    def test_clear_removes_all_tools(self) -> None:
        """Clear removes all registered tools."""
        registry = ToolRegistry()
        registry.register(mock_read_tool, ToolCategory.FILESYSTEM)
        registry.register(mock_search_tool, ToolCategory.SEARCH)

        registry.clear()
        assert len(registry.get_all_tools()) == 0


class TestAgentToolMapping:
    """Tests for agent tool mapping configuration."""

    def test_all_agent_types_have_mapping(self) -> None:
        """All agent types have a tool mapping defined."""
        for agent_type in AgentType:
            assert agent_type in AGENT_TOOL_MAPPING

    def test_planner_has_read_tools(self) -> None:
        """Planner should have filesystem and search categories."""
        planner_categories = AGENT_TOOL_MAPPING[AgentType.PLANNER]
        assert ToolCategory.FILESYSTEM in planner_categories
        assert ToolCategory.SEARCH in planner_categories

    def test_coder_has_all_tools(self) -> None:
        """Coder should have all tool categories."""
        coder_categories = AGENT_TOOL_MAPPING[AgentType.CODER]
        assert ToolCategory.FILESYSTEM in coder_categories
        assert ToolCategory.GIT in coder_categories
        assert ToolCategory.SEARCH in coder_categories

    def test_reviewer_has_git(self) -> None:
        """Reviewer should have git for diffs."""
        reviewer_categories = AGENT_TOOL_MAPPING[AgentType.REVIEWER]
        assert ToolCategory.GIT in reviewer_categories
