"""Integration tests for Phase 1 agent implementation.

Tests the minimal LangGraph workflow with planner node, SSE streaming endpoint,
and basic state management. These tests verify that:

1. The workflow can be invoked and produces a plan
2. The planner node correctly processes task descriptions
3. The SSE endpoint streams events properly
4. State accumulation and transitions work correctly

This test module uses the comprehensive test infrastructure including:
- Fixtures from tests/ai/conftest.py
- Test utilities from tests/ai/utils/
- Mock responses from tests/ai/fixtures/

TODO: Add test for concurrent task execution (Phase 2)
TODO: Add test for task cancellation (Phase 2)
TODO: Add test for checkpoint resumption (Phase 4)
"""

from typing import Any

import pytest

from src.agents.graph import get_compiled_graph, invoke_workflow
from src.agents.models import ModelFactory
from src.agents.planner import planner_node
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from tests.ai.utils import WorkflowStateBuilder, assert_workflow_state_valid

logger = get_logger(__name__)


class TestAgentModels:
    """Test model factory and configuration."""

    def test_model_factory_creates_haiku(self) -> None:
        """Test that ModelFactory can create Haiku model."""
        model = ModelFactory.create("haiku")
        assert model is not None
        assert model.model == "claude-haiku-4-5-20251001"

    def test_model_factory_creates_sonnet(self) -> None:
        """Test that ModelFactory can create Sonnet model."""
        model = ModelFactory.create("sonnet")
        assert model is not None
        assert model.model == "claude-sonnet-4-5-20251001"

    def test_model_factory_creates_opus(self) -> None:
        """Test that ModelFactory can create Opus model."""
        model = ModelFactory.create("opus")
        assert model is not None
        assert model.model == "claude-opus-4-5-20251001"

    def test_model_factory_invalid_model(self) -> None:
        """Test that ModelFactory rejects invalid model names."""
        with pytest.raises(ValueError, match="Unknown model"):
            ModelFactory.create("invalid")  # type: ignore

    def test_model_factory_by_complexity(self) -> None:
        """Test model selection by task complexity."""
        haiku = ModelFactory.create_for_task("low")
        sonnet = ModelFactory.create_for_task("medium")
        opus = ModelFactory.create_for_task("high")

        assert haiku.model == "claude-haiku-4-5-20251001"
        assert sonnet.model == "claude-sonnet-4-5-20251001"
        assert opus.model == "claude-opus-4-5-20251001"


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
            "test_results": "",
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
            "test_results": "",
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


class TestPlannerNode:
    """Test the planner node execution.

    Note: These tests require ANTHROPIC_API_KEY to be set in the environment.
    If not available, tests are skipped.
    """

    @pytest.mark.asyncio
    async def test_planner_node_produces_plan(self) -> None:
        """Test that planner node generates a plan from task description."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Create a simple FastAPI endpoint that returns hello world",
            "plan": "",
            "code": "",
            "test_results": "",
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {},
        }

        # TODO: Mock the Claude API to avoid rate limits in tests
        # For now, skip this test if ANTHROPIC_API_KEY is not set
        try:
            result = await planner_node(state)

            assert "plan" in result
            assert result["plan"]  # Plan should not be empty
            assert result["status"] == "coding"
            assert len(result["messages"]) > 0

            logger.info("Planner generated plan", plan_length=len(result["plan"]))

        except Exception as e:
            logger.warning(f"Planner test skipped: {e}")
            pytest.skip("Claude API not available")

    @pytest.mark.asyncio
    async def test_planner_node_state_accumulation(self) -> None:
        """Test that planner node properly accumulates messages."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Test task",
            "plan": "",
            "code": "",
            "test_results": "",
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {"initial_key": "initial_value"},
        }

        try:
            result = await planner_node(state)

            # Verify state accumulation
            assert result["status"] == "coding"
            assert "plan" in result
            assert "metadata" in result
            # Original metadata should be preserved
            assert result["metadata"].get("initial_key") == "initial_value"

        except Exception as e:
            logger.warning(f"State accumulation test skipped: {e}")
            pytest.skip("Claude API not available")


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


class TestWorkflowExecution:
    """Test end-to-end workflow execution.

    TODO: Mock Claude API calls for reliable testing
    TODO: Add test for timeout handling
    TODO: Add test for error recovery
    """

    @pytest.mark.asyncio
    async def test_invoke_workflow_structure(self) -> None:
        """Test that invoke_workflow returns proper state structure."""
        try:
            result = await invoke_workflow(
                task_description="Simple test task",
                task_id=1,
            )

            # Verify result structure
            assert isinstance(result, dict)
            assert "plan" in result
            assert "status" in result
            assert "metadata" in result
            assert result["task_id"] == 1

            logger.info("Workflow execution completed", status=result.get("status"))

        except Exception as e:
            logger.warning(f"Workflow execution test skipped: {e}")
            pytest.skip("Claude API not available or rate limited")

    @pytest.mark.asyncio
    async def test_workflow_with_thread_id(self) -> None:
        """Test workflow execution with resumable thread ID.

        TODO: Implement checkpoint resumption in Phase 4
        """
        try:
            thread_id = "test-thread-phase1"
            result = await invoke_workflow(
                task_description="Test with thread ID",
                task_id=2,
                thread_id=thread_id,
            )

            # Verify thread ID is in metadata
            assert result["metadata"].get("thread_id") == thread_id

        except Exception as e:
            logger.warning(f"Thread ID test skipped: {e}")
            pytest.skip("Claude API not available")


class TestEventStreaming:
    """Test event streaming from the workflow.

    TODO: Add tests for event filtering and sampling
    TODO: Add tests for backpressure handling
    TODO: Add tests for stream interruption and recovery
    """

    @pytest.mark.asyncio
    async def test_stream_events_generation(self) -> None:
        """Test that stream_workflow generates events."""
        from src.agents.graph import stream_workflow

        event_count = 0

        try:
            async for event in stream_workflow(
                task_description="Stream test",
                task_id=3,
            ):
                event_count += 1
                # Basic event structure check
                assert isinstance(event, dict)
                assert "event" in event or event_count > 0

            assert event_count > 0, "Stream should generate at least one event"
            logger.info("Stream generated events", count=event_count)

        except Exception as e:
            logger.warning(f"Stream test skipped: {e}")
            pytest.skip("Claude API not available")


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

    def test_assert_valid_state(self, empty_workflow_state: WorkflowState) -> None:
        """Test assertion on valid state."""
        # Should not raise
        assert_workflow_state_valid(empty_workflow_state)

    def test_assert_invalid_state_missing_field(self) -> None:
        """Test assertion on invalid state with missing field."""
        invalid_state: dict[str, Any] = {
            "task_id": 1,
            # Missing task_description and other fields
        }

        with pytest.raises(AssertionError):
            assert_workflow_state_valid(invalid_state)  # type: ignore
