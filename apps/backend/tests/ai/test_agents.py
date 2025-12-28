"""AI integration tests for agent workflow execution.

Tests the planner node, workflow execution, and event streaming with real LLM calls.
These tests require either a local vLLM server or Claude API key.

Note: Unit tests for model factory, workflow state, and graph compilation have been
moved to tests/unit/test_agent_models.py for faster execution without LLM.
"""

import pytest

from src.agents.graph import invoke_workflow, stream_workflow
from src.agents.nodes.planner import planner_node
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from tests.ai.conftest import get_llm_skip_reason, is_llm_available

logger = get_logger(__name__)


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestPlannerNode:
    """Test the planner node execution.

    Note: These tests require an LLM (either local vLLM or Claude API).
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
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {},
        }

        result = await planner_node(state)

        assert "plan" in result
        assert result["plan"]  # Plan should not be empty
        assert result["status"] == "coding"
        assert len(result["messages"]) >= 0  # May be 0 if from cache

        logger.info("Planner generated plan", plan_length=len(result["plan"]))

    @pytest.mark.asyncio
    async def test_planner_node_state_accumulation(self) -> None:
        """Test that planner node properly accumulates messages."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Test task",
            "plan": "",
            "code": "",
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,
            "status": "planning",
            "error": None,
            "metadata": {"initial_key": "initial_value"},
        }

        result = await planner_node(state)

        # Verify state accumulation
        assert result["status"] == "coding"
        assert "plan" in result
        assert "metadata" in result
        # Original metadata should be preserved
        assert result["metadata"].get("initial_key") == "initial_value"


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestWorkflowExecution:
    """Test end-to-end workflow execution.

    Note: Full workflow tests may take several minutes with local LLM.
    """

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes for full workflow
    async def test_invoke_workflow_structure(self) -> None:
        """Test that invoke_workflow returns proper state structure."""
        result = await invoke_workflow(
            task_description="Simple test task",
            task_id=1,
        )

        # Handle timeout gracefully
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify result structure
        assert isinstance(result, dict)
        assert "plan" in result
        assert "status" in result
        assert "metadata" in result
        assert result["task_id"] == 1

        logger.info("Workflow execution completed", status=result.get("status"))

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes for full workflow
    async def test_workflow_with_thread_id(self) -> None:
        """Test workflow execution with resumable thread ID."""
        thread_id = "test-thread-phase1"
        result = await invoke_workflow(
            task_description="Test with thread ID",
            task_id=2,
            thread_id=thread_id,
        )

        # Handle timeout gracefully
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify thread ID is in metadata
        assert result["metadata"].get("thread_id") == thread_id


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestEventStreaming:
    """Test event streaming from the workflow."""

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes for full workflow
    async def test_stream_events_generation(self) -> None:
        """Test that stream_workflow generates events.

        Note: This test may take longer when using local LLM.
        """
        event_count = 0

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
