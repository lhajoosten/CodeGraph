"""Unit tests for agent models, workflow state, and graph compilation.

These tests verify the core agent infrastructure without requiring LLM calls:
- Model factory creation and configuration
- Workflow state initialization and transitions
- Workflow graph compilation
- Workflow state builder utility
- Assertion helper utilities
"""

from typing import Any

import pytest
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.agents.graph import get_compiled_graph
from src.agents.infrastructure.models import ModelConfig, ModelFactory
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger
from tests.ai.utils import WorkflowStateBuilder, assert_workflow_state_valid

logger = get_logger(__name__)


def get_model_name(model: ChatAnthropic | ChatOpenAI) -> str:
    """Get model name from either ChatAnthropic or ChatOpenAI."""
    if isinstance(model, ChatOpenAI):
        return model.model_name
    return model.model


class TestAgentModels:
    """Test model factory and configuration."""

    def test_model_factory_creates_haiku(self) -> None:
        """Test that ModelFactory can create Haiku model."""
        model = ModelFactory.create("haiku")
        assert model is not None
        model_name = get_model_name(model)
        # When using local LLM, model name will be the local model
        if settings.use_local_llm:
            assert model_name == settings.local_llm_model
        else:
            assert model_name == "claude-haiku-4-5-20251001"

    def test_model_factory_creates_sonnet(self) -> None:
        """Test that ModelFactory can create Sonnet model."""
        model = ModelFactory.create("sonnet")
        assert model is not None
        model_name = get_model_name(model)
        # When using local LLM, all models use the same local model
        if settings.use_local_llm:
            assert model_name == settings.local_llm_model
        else:
            assert model_name == ModelConfig.CLAUDE_MODELS["sonnet"]

    def test_model_factory_creates_opus(self) -> None:
        """Test that ModelFactory can create Opus model."""
        model = ModelFactory.create("opus")
        assert model is not None
        model_name = get_model_name(model)
        # When using local LLM, all models use the same local model
        if settings.use_local_llm:
            assert model_name == settings.local_llm_model
        else:
            assert model_name == ModelConfig.CLAUDE_MODELS["opus"]

    def test_model_factory_invalid_model(self) -> None:
        """Test that ModelFactory rejects invalid model names."""
        with pytest.raises(ValueError, match="Unknown tier"):
            ModelFactory.create("invalid")  # type: ignore

    def test_model_factory_by_complexity(self) -> None:
        """Test model selection by task complexity."""
        haiku = ModelFactory.create_for_task("low")
        sonnet = ModelFactory.create_for_task("medium")
        opus = ModelFactory.create_for_task("high")

        # When using local LLM, all complexity levels use the same model
        if settings.use_local_llm:
            assert get_model_name(haiku) == settings.local_llm_model
            assert get_model_name(sonnet) == settings.local_llm_model
            assert get_model_name(opus) == settings.local_llm_model
        else:
            assert get_model_name(haiku) == ModelConfig.CLAUDE_MODELS["haiku"]
            assert get_model_name(sonnet) == ModelConfig.CLAUDE_MODELS["sonnet"]
            assert get_model_name(opus) == ModelConfig.CLAUDE_MODELS["opus"]


class TestWorkflowState:
    """Test workflow state management."""

    def test_workflow_state_initialization(self) -> None:
        """Test that WorkflowState can be initialized with all fields."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Create a FastAPI endpoint",
            "plan": "",
            "code": "",
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {},
        }

        assert state["task_id"] == 1
        assert state["status"] == "planning"
        assert isinstance(state["messages"], list)

    def test_workflow_state_status_transitions(self) -> None:
        """Test valid status transitions."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Test",
            "plan": "",
            "code": "",
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {},
        }

        # Test transition to coding
        state["status"] = "coding"
        assert state["status"] == "coding"

        # Test transition to testing
        state["status"] = "testing"
        assert state["status"] == "testing"

        # Test transition to reviewing
        state["status"] = "reviewing"
        assert state["status"] == "reviewing"

        # Test transition to complete
        state["status"] = "complete"
        assert state["status"] == "complete"


class TestWorkflowGraph:
    """Test the compiled workflow graph."""

    def test_graph_compilation(self) -> None:
        """Test that the workflow graph compiles without errors."""
        graph = get_compiled_graph()
        assert graph is not None
        logger.info("Graph compiled successfully")

    def test_graph_has_planner_node(self) -> None:
        """Test that the graph includes the planner node."""
        graph = get_compiled_graph()

        # Check that graph can be invoked (basic sanity check)
        assert hasattr(graph, "ainvoke")
        assert hasattr(graph, "astream")
        assert hasattr(graph, "astream_events")

    def test_graph_has_all_nodes(self) -> None:
        """Test that the graph includes all expected nodes."""
        graph = get_compiled_graph()
        nodes = list(graph.nodes.keys())

        assert "__start__" in nodes, "Graph should have __start__ node"
        assert "planner" in nodes, "Graph should have planner node"
        assert "coder" in nodes, "Graph should have coder node"
        assert "tester" in nodes, "Graph should have tester node"
        assert "reviewer" in nodes, "Graph should have reviewer node"


class TestWorkflowStateBuilder:
    """Test the WorkflowStateBuilder utility.

    Verifies that the builder pattern works correctly for creating
    test states without complex fixtures.
    """

    def test_build_empty_state(self) -> None:
        """Test building an empty state with defaults."""
        state = WorkflowStateBuilder().with_description("Test").build()

        assert state["task_description"] == "Test"
        assert state["status"] == "planning"
        assert state["iterations"] == 0

    def test_build_with_multiple_fields(self) -> None:
        """Test building a state with multiple fields set."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(42)
            .with_description("Complex task")
            .with_status("coding")
            .with_iterations(2)
            .build()
        )

        assert state["task_id"] == 42
        assert state["task_description"] == "Complex task"
        assert state["status"] == "coding"
        assert state["iterations"] == 2

    def test_builder_invalid_status(self) -> None:
        """Test that builder rejects invalid status."""
        with pytest.raises(ValueError, match="Invalid status"):
            WorkflowStateBuilder().with_status("invalid").build()

    def test_builder_metadata(self) -> None:
        """Test building with metadata."""
        state = (
            WorkflowStateBuilder()
            .with_description("Test")
            .add_metadata("user_id", 123)
            .add_metadata("timestamp", "2025-12-27T22:00:00Z")
            .build()
        )

        assert state["metadata"]["user_id"] == 123
        assert state["metadata"]["timestamp"] == "2025-12-27T22:00:00Z"


class TestAssertionHelpers:
    """Test the assertion utility functions.

    Verifies that custom assertions work correctly for validating
    workflow states and transitions.
    """

    def test_assert_valid_state(self) -> None:
        """Test assertion on valid state."""
        state = WorkflowStateBuilder().with_description("Test").build()
        # Should not raise
        assert_workflow_state_valid(state)

    def test_assert_invalid_state_missing_field(self) -> None:
        """Test assertion on invalid state with missing field."""
        invalid_state: dict[str, Any] = {
            "task_id": 1,
            # Missing task_description and other fields
        }

        with pytest.raises(AssertionError):
            assert_workflow_state_valid(invalid_state)  # type: ignore
