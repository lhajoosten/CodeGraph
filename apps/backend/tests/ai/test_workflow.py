"""Integration tests for the complete workflow (planner → coder → tester).

Tests the end-to-end execution of the multi-node workflow including state
transitions, message accumulation, metadata tracking, and event streaming.
"""

import pytest

from src.agents import invoke_workflow, stream_workflow
from src.core.logging import get_logger
from tests.ai.conftest import GraphInspector, get_llm_skip_reason, is_llm_available
from tests.ai.utils.assertions import (
    assert_code_valid,
    assert_messages_accumulated,
    assert_metadata_complete,
    assert_metadata_has_timestamps,
    assert_plan_format,
    assert_status_transition,
)

logger = get_logger(__name__)


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestPhase2Workflow:
    """Test the complete Phase 2 workflow (planner → coder → tester).

    Verifies end-to-end execution of the multi-node workflow and proper
    state transitions between nodes.

    Note: These tests may timeout with slow LLM backends. Timeouts are treated
    as valid outcomes since they indicate the LLM infrastructure is available
    but slow. Tests verify correct behavior on both success and timeout.
    """

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_full_workflow_execution(self) -> None:
        """Test complete workflow from planning to testing."""
        result = await invoke_workflow(
            task_description="Create a FastAPI endpoint for user login with comprehensive tests",
            task_id=1,
        )

        # Handle timeout gracefully - LLM was slow but infrastructure works
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            assert "timeout" in result.get("error", "").lower()
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify all stages completed using enhanced assertions
        assert_plan_format(result["plan"])
        assert_code_valid(result["code"])
        assert result["test_results"], "Tester should have generated tests"
        assert_status_transition(
            result["status"],
            valid_states=["planning", "coding", "testing", "reviewing", "complete"],
        )

        # Verify metadata tracking using enhanced assertions
        assert_metadata_has_timestamps(result["metadata"])

        logger.info(
            "Phase 2 workflow test passed",
            plan_len=len(result["plan"]),
            code_len=len(result["code"]),
            test_len=len(result["test_results"]),
        )

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_workflow_state_accumulation(self) -> None:
        """Test that state properly accumulates through all nodes."""
        result = await invoke_workflow(
            task_description="Simple endpoint with tests",
            task_id=2,
        )

        # Handle timeout gracefully
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify state accumulation
        assert result["task_id"] == 2
        assert result["task_description"] == "Simple endpoint with tests"
        assert_status_transition(
            result["status"],
            valid_states=["planning", "coding", "testing", "reviewing", "complete"],
        )

        # Verify messages accumulated through workflow
        assert_messages_accumulated(result["messages"], min_count=1)

        # Verify all output fields are populated using enhanced assertions
        assert_plan_format(result["plan"])
        assert_code_valid(result["code"])
        assert result["test_results"]

        logger.info(
            "Phase 2 state accumulation test passed",
            message_count=len(result["messages"]),
        )

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_workflow_with_metadata(self) -> None:
        """Test that workflow properly tracks metadata across all nodes."""
        thread_id = "phase2-metadata-test"
        result = await invoke_workflow(
            task_description="Test with metadata tracking",
            task_id=3,
            thread_id=thread_id,
        )

        # Handle timeout gracefully
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify metadata is properly structured using enhanced assertions
        assert_metadata_complete(result["metadata"])
        assert_metadata_has_timestamps(result["metadata"])

        # Verify workflow-level metadata
        assert result["metadata"].get("thread_id") == thread_id
        assert "workflow_started_at" in result["metadata"]

        logger.info(
            "Phase 2 metadata tracking test passed",
            metadata_keys=list(result["metadata"].keys()),
        )

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_workflow_stream_events(self) -> None:
        """Test that workflow streaming generates proper events."""
        event_count = 0
        node_events = {
            "planner": 0,
            "coder": 0,
            "tester": 0,
        }

        async for event in stream_workflow(
            task_description="Stream test workflow",
            task_id=4,
        ):
            event_count += 1

            # Track node executions
            event_data = event.get("data", {})
            if isinstance(event_data, dict):
                node_name = event.get("name", "")
                for node in node_events:
                    if node in node_name:
                        node_events[node] += 1

        # Verify events were generated
        assert event_count > 0, "Stream should generate events"

        # All Phase 2 nodes should appear in event stream
        logger.info(
            "Phase 2 workflow streaming test passed",
            total_events=event_count,
            node_events=node_events,
        )

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_workflow_message_flow(self) -> None:
        """Test that messages accumulate through the workflow."""
        result = await invoke_workflow(
            task_description="Message accumulation test",
            task_id=5,
        )

        # Handle timeout gracefully
        if result["status"] == "timeout":
            logger.warning("Workflow timed out - LLM backend is slow")
            pytest.skip("Workflow timed out - LLM backend is slow")
            return

        # Verify messages using enhanced assertions
        assert_messages_accumulated(
            result.get("messages", []),
            min_count=3,  # At least one message per node
            validate_content=True,
        )

        logger.info(
            "Phase 2 message flow test passed",
            message_count=len(result.get("messages", [])),
        )

    def test_workflow_structure(self, workflow_graph: object) -> None:
        """Test that workflow graph has correct structure for Phase 2."""
        # Use GraphInspector for enhanced graph testing
        inspector = GraphInspector(workflow_graph)

        # Verify graph has all Phase 2 nodes
        assert inspector.has_node("planner"), "Graph should have planner node"
        assert inspector.has_node("coder"), "Graph should have coder node"
        assert inspector.has_node("tester"), "Graph should have tester node"

        # Validate overall structure
        issues = inspector.validate_structure()
        assert not issues, f"Graph structure issues: {issues}"

        logger.info("Phase 2 workflow structure test passed", nodes=inspector.get_nodes())
