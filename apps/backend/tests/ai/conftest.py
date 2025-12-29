"""Configuration and fixtures for AI agent testing.

Provides:
- LLM availability checking (local vLLM or Claude API)
- Graph inspection utilities
- Pytest hooks for test categorization
"""

import socket
from typing import Any
from urllib.parse import urlparse

import pytest

from src.agents import create_workflow
from src.core.config import settings

# ============================================================================
# LLM AVAILABILITY HELPERS
# ============================================================================


def is_vllm_available() -> bool:
    """Check if local vLLM server is running."""
    try:
        parsed = urlparse(settings.local_llm_base_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 8080
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def is_claude_available() -> bool:
    """Check if Claude API is configured."""
    return (
        bool(settings.anthropic_api_key)
        and settings.anthropic_api_key != "your-anthropic-api-key-here"
    )


def is_llm_available() -> bool:
    """Check if any LLM backend is available."""
    if settings.use_local_llm:
        return is_vllm_available()
    return is_claude_available()


def get_llm_skip_reason() -> str:
    """Get the reason for skipping LLM tests."""
    if settings.use_local_llm:
        return f"Local vLLM not available at {settings.local_llm_base_url}"
    return "ANTHROPIC_API_KEY not configured"


# Pytest marker for tests requiring LLM
requires_llm = pytest.mark.skipif(
    not is_llm_available(),
    reason=get_llm_skip_reason(),
)


# ============================================================================
# GRAPH INSPECTION
# ============================================================================


@pytest.fixture
def workflow_graph() -> Any:
    """Create a raw (uncompiled) workflow graph."""
    return create_workflow()


class GraphInspector:
    """Helper class for inspecting workflow graph structure."""

    def __init__(self, graph: Any) -> None:
        """Initialize the inspector."""
        self._graph = graph

    def get_nodes(self) -> list[str]:
        """Get list of all node names."""
        if hasattr(self._graph, "nodes"):
            return list(self._graph.nodes.keys())
        return []

    def get_edges(self) -> list[tuple[str, str]]:
        """Get list of all edges as (source, target) tuples."""
        edges: list[tuple[str, str]] = []
        if hasattr(self._graph, "edges"):
            for source, targets in self._graph.edges.items():
                if isinstance(targets, list):
                    for target in targets:
                        edges.append((source, target))
                elif isinstance(targets, str):
                    edges.append((source, targets))
        return edges

    def has_node(self, name: str) -> bool:
        """Check if graph has a specific node."""
        return name in self.get_nodes()

    def has_edge(self, source: str, target: str) -> bool:
        """Check if graph has a specific edge."""
        return (source, target) in self.get_edges()

    def get_node_successors(self, node: str) -> list[str]:
        """Get nodes that can follow the given node."""
        successors = []
        for source, target in self.get_edges():
            if source == node:
                successors.append(target)
        return successors

    def validate_structure(self) -> list[str]:
        """Validate graph structure and return any issues found."""
        issues = []
        required_nodes = ["planner", "coder", "tester", "reviewer"]
        for node in required_nodes:
            if not self.has_node(node):
                issues.append(f"Missing required node: {node}")
        return issues


@pytest.fixture
def graph_inspector(workflow_graph: Any) -> GraphInspector:
    """Create a graph inspector for testing graph structure."""
    return GraphInspector(workflow_graph)


# ============================================================================
# PYTEST HOOKS
# ============================================================================


def pytest_configure(config: Any) -> None:
    """Configure pytest for AI testing."""
    # Base markers
    config.addinivalue_line("markers", "ai: mark test as AI-related")
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "requires_api: mark test as requiring real API")

    # Test type markers
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "workflow: mark test as workflow test")
    config.addinivalue_line("markers", "node: mark test as node-specific test")

    # Feature markers
    config.addinivalue_line("markers", "streaming: mark test as streaming response test")
    config.addinivalue_line("markers", "error_handling: mark test as error handling test")
    config.addinivalue_line("markers", "timeout_test: mark test as timeout test")


def pytest_collection_modifyitems(config: Any, items: list[Any]) -> None:
    """Modify test collection for AI tests with automatic categorization."""
    for item in items:
        test_path = str(item.fspath)
        test_name = item.name.lower()

        # Base AI marker for all tests in ai directory
        if "tests/ai" in test_path:
            item.add_marker(pytest.mark.ai)

        # Categorize by test file
        if "test_workflow" in test_path:
            item.add_marker(pytest.mark.workflow)
            item.add_marker(pytest.mark.slow)
            item.add_marker(pytest.mark.integration)

        if "test_agents" in test_path:
            item.add_marker(pytest.mark.integration)

        # Node-specific tests
        node_files = ["test_planner", "test_coder", "test_tester", "test_reviewer"]
        if any(node in test_path for node in node_files):
            item.add_marker(pytest.mark.node)

        # Categorize by test name patterns
        if "integration" in test_name:
            item.add_marker(pytest.mark.integration)

        if "unit" in test_name:
            item.add_marker(pytest.mark.unit)

        if "stream" in test_name:
            item.add_marker(pytest.mark.streaming)

        if "error" in test_name or "fail" in test_name:
            item.add_marker(pytest.mark.error_handling)

        if "timeout" in test_name:
            item.add_marker(pytest.mark.slow)
            item.add_marker(pytest.mark.timeout_test)

        # Mark tests with long timeouts as slow
        for marker in item.iter_markers("timeout"):
            if marker.args and marker.args[0] > 60:
                item.add_marker(pytest.mark.slow)

        # Mark tests that skip without LLM as requires_api
        for marker in item.iter_markers("skipif"):
            if "llm" in str(marker.args).lower():
                item.add_marker(pytest.mark.requires_api)
