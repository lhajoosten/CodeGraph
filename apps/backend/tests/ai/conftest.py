"""Configuration and fixtures for AI agent testing.

This module provides comprehensive test fixtures, mocks, and utilities for testing
LangGraph workflows, agent nodes, and AI integrations. It includes:

- Mock Claude API responses with proper streaming support
- WorkflowState fixtures for different test scenarios
- Model factory fixtures with configurable behavior
- Graph compilation and execution fixtures
- Assertion helpers and test utilities

TODO: Add checkpoint testing utilities (Phase 4)
TODO: Add token tracking and cost calculation (Phase 2)
TODO: Add performance profiling fixtures (Phase 3)
"""

from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from langchain_core.messages import AIMessage, HumanMessage

from src.agents.graph import create_workflow, get_compiled_graph
from src.agents.models import ModelFactory
from src.agents.state import WorkflowState

# ============================================================================
# WORKFLOW STATE FIXTURES
# ============================================================================


@pytest.fixture
def empty_workflow_state() -> WorkflowState:
    """Create an empty workflow state for testing.

    This is the initial state before any nodes have executed.

    Returns:
        WorkflowState with all fields initialized to empty/default values
    """
    return {
        "messages": [],
        "task_id": 1,
        "task_description": "",
        "plan": "",
        "code": "",
        "test_results": "",
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {},
    }


@pytest.fixture
def planning_task_state() -> WorkflowState:
    """Create a workflow state for a planning task.

    Returns:
        WorkflowState with task description but no plan yet
    """
    return {
        "messages": [],
        "task_id": 1,
        "task_description": "Create a FastAPI endpoint for user authentication",
        "plan": "",
        "code": "",
        "test_results": "",
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {
            "created_at": "2025-12-27T22:00:00Z",
            "user_id": 1,
        },
    }


@pytest.fixture
def planned_state() -> WorkflowState:
    """Create a workflow state after planning is complete.

    Returns:
        WorkflowState with a plan but no code yet
    """
    return {
        "messages": [
            HumanMessage(content="Create a FastAPI endpoint"),
            AIMessage(content="I will create an authentication endpoint"),
        ],
        "task_id": 1,
        "task_description": "Create a FastAPI endpoint for user authentication",
        "plan": "1. Create user schema\n2. Create authentication service\n3. Create FastAPI endpoint",
        "code": "",
        "test_results": "",
        "review_feedback": "",
        "iterations": 0,
        "status": "coding",
        "error": None,
        "metadata": {
            "created_at": "2025-12-27T22:00:00Z",
            "user_id": 1,
            "plan_generated_at": "2025-12-27T22:01:00Z",
        },
    }


@pytest.fixture
def state_with_code() -> WorkflowState:
    """Create a workflow state after coding is complete.

    Returns:
        WorkflowState with code but no test results yet
    """
    return {
        "messages": [
            HumanMessage(content="Create a FastAPI endpoint"),
            AIMessage(content="Here is the code..."),
        ],
        "task_id": 1,
        "task_description": "Create a FastAPI endpoint for user authentication",
        "plan": "1. Create user schema\n2. Create authentication service",
        "code": """
from fastapi import APIRouter, Depends
from src.models.user import User

router = APIRouter()

@router.post("/auth/login")
async def login(email: str, password: str) -> dict:
    # Authentication logic
    return {"token": "..."}
""",
        "test_results": "",
        "review_feedback": "",
        "iterations": 0,
        "status": "testing",
        "error": None,
        "metadata": {
            "created_at": "2025-12-27T22:00:00Z",
            "user_id": 1,
            "plan_generated_at": "2025-12-27T22:01:00Z",
            "code_generated_at": "2025-12-27T22:02:00Z",
        },
    }


# ============================================================================
# MOCK CLAUDE API FIXTURES
# ============================================================================


@pytest.fixture
def mock_claude_response() -> AIMessage:
    """Create a mock Claude API response.

    Returns:
        AIMessage with typical planning response
    """
    return AIMessage(
        content="""
1. **Analysis Phase** - Analyze requirements and design approach
2. **Implementation Phase** - Write clean, documented code
3. **Testing Phase** - Create comprehensive pytest test cases
4. **Review Phase** - Check for quality, security, and performance
"""
    )


@pytest.fixture
def mock_streaming_chunks() -> list[AIMessage]:
    """Create mock streaming chunks from Claude API.

    Returns:
        List of AIMessage chunks that would stream from Claude
    """
    chunks_content = [
        "1. ",
        "**Analysis",
        " Phase** - ",
        "Analyze requirements",
        "\n",
        "2. **Implementation",
        " Phase** - ",
        "Write code",
    ]
    return [AIMessage(content=chunk) for chunk in chunks_content]


@pytest.fixture
def mock_chat_anthropic(mock_claude_response: AIMessage) -> MagicMock:
    """Create a mock ChatAnthropic instance.

    Args:
        mock_claude_response: The response to return

    Returns:
        MagicMock of ChatAnthropic with ainvoke method
    """
    mock = MagicMock()
    mock.model = "claude-sonnet-4-20250514"
    mock.ainvoke = AsyncMock(return_value=mock_claude_response)
    mock.astream = AsyncMock()
    return mock


@pytest.fixture
def mock_streaming_chat_anthropic(mock_streaming_chunks: list[AIMessage]) -> MagicMock:
    """Create a mock ChatAnthropic that streams responses.

    Args:
        mock_streaming_chunks: Chunks to stream

    Returns:
        MagicMock of ChatAnthropic with astream method
    """

    async def async_generator() -> AsyncGenerator[AIMessage, None]:
        for chunk in mock_streaming_chunks:
            yield chunk

    mock = MagicMock()
    mock.model = "claude-sonnet-4-20250514"
    mock.astream = AsyncMock(return_value=async_generator())
    mock.ainvoke = AsyncMock()
    return mock


# ============================================================================
# MODEL FACTORY FIXTURES
# ============================================================================


@pytest.fixture
def model_factory() -> type[ModelFactory]:
    """Provide access to the ModelFactory class.

    Returns:
        The ModelFactory class for creating models
    """
    return ModelFactory


# ============================================================================
# GRAPH COMPILATION FIXTURES
# ============================================================================


@pytest.fixture
def compiled_workflow() -> Any:
    """Create a compiled workflow graph.

    Returns:
        Compiled StateGraph ready for execution
    """
    return get_compiled_graph()


@pytest.fixture
def workflow_graph() -> Any:
    """Create a raw (uncompiled) workflow graph.

    Returns:
        StateGraph instance

    TODO: Add methods to inspect graph structure (Phase 2)
    """
    return create_workflow()


# ============================================================================
# MOCKING UTILITIES
# ============================================================================


@pytest_asyncio.fixture
async def mock_planner_node() -> AsyncMock:
    """Create a mock planner node.

    Returns:
        AsyncMock that simulates planner_node execution

    TODO: Make behavior configurable (Phase 2)
    """

    async def mock_execution(state: WorkflowState, config: Any = None) -> dict[str, Any]:
        return {
            "plan": "Mocked plan for " + state["task_description"],
            "status": "coding",
            "messages": [AIMessage(content="Mocked plan")],
            "metadata": {
                **state.get("metadata", {}),
                "plan_generated_at": "2025-12-27T22:00:00Z",
            },
        }

    return AsyncMock(side_effect=mock_execution)


@pytest_asyncio.fixture
async def patched_model_factory(mock_chat_anthropic: MagicMock) -> Any:
    """Patch ModelFactory to return mock models.

    Args:
        mock_chat_anthropic: Mock model to return

    Yields:
        Patched ModelFactory

    TODO: Support multiple models with different configurations (Phase 2)
    """
    with patch("src.agents.models.ModelFactory.create", return_value=mock_chat_anthropic):
        with patch(
            "src.agents.models.ModelFactory.create_for_task", return_value=mock_chat_anthropic
        ):
            with patch("src.agents.models.get_planner_model", return_value=mock_chat_anthropic):
                with patch("src.agents.models.get_coder_model", return_value=mock_chat_anthropic):
                    yield


# ============================================================================
# TEST CONFIGURATION
# ============================================================================


@pytest.fixture
def mock_settings() -> dict[str, Any]:
    """Create mock settings for testing.

    Returns:
        Dictionary with test settings

    TODO: Make settings configurable per test (Phase 2)
    """
    return {
        "anthropic_api_key": "test-key",
        "anthropic_default_model": "claude-sonnet-4-20250514",
        "max_agent_iterations": 5,
        "agent_timeout_seconds": 30,
    }


# ============================================================================
# PYTEST HOOKS
# ============================================================================


def pytest_configure(config: Any) -> None:
    """Configure pytest for AI testing.

    Args:
        config: Pytest configuration object
    """
    config.addinivalue_line("markers", "ai: mark test as AI-related")
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "requires_api: mark test as requiring real API")


def pytest_collection_modifyitems(config: Any, items: list[Any]) -> None:
    """Modify test collection for AI tests.

    Args:
        config: Pytest configuration
        items: List of collected test items

    TODO: Add automatic test categorization (Phase 2)
    """
    for item in items:
        if "test_" in str(item.fspath):
            item.add_marker(pytest.mark.ai)
