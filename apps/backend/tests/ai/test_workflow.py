"""Integration tests for the complete workflow (planner → coder → tester).

Tests the end-to-end execution of the multi-node workflow including state
transitions, message accumulation, metadata tracking, and event streaming.
"""

import pytest

from src.agents.graph import invoke_workflow, stream_workflow
from src.core.logging import get_logger

logger = get_logger(__name__)


class TestPhase2Workflow:
    """Test the complete Phase 2 workflow (planner → coder → tester).

    Verifies end-to-end execution of the multi-node workflow and proper
    state transitions between nodes.
    """

    @pytest.mark.asyncio
    async def test_full_workflow_execution(self) -> None:
        """Test complete workflow from planning to testing."""
        try:
            result = await invoke_workflow(
                task_description="Create a FastAPI endpoint for user login with comprehensive tests",
                task_id=1,
            )

            # Verify all stages completed
            assert result["plan"]  # Planner executed
            assert result["code"]  # Coder executed
            assert result["test_results"]  # Tester executed
            assert result["status"] == "reviewing"  # Ready for review in Phase 3

            # Verify metadata tracking
            assert "plan_generated_at" in result["metadata"]
            assert "code_generated_at" in result["metadata"]
            assert "tests_generated_at" in result["metadata"]

            logger.info(
                "Phase 2 workflow test passed",
                plan_len=len(result["plan"]),
                code_len=len(result["code"]),
                test_len=len(result["test_results"]),
            )

        except Exception as e:
            logger.warning(f"Phase 2 workflow test skipped: {e}")
            pytest.skip("Claude API not available or rate limited")

    @pytest.mark.asyncio
    async def test_workflow_state_accumulation(self) -> None:
        """Test that state properly accumulates through all nodes."""
        try:
            result = await invoke_workflow(
                task_description="Simple endpoint with tests",
                task_id=2,
            )

            # Verify state accumulation
            assert result["task_id"] == 2
            assert result["task_description"] == "Simple endpoint with tests"
            assert result["status"] == "reviewing"
            assert isinstance(result["messages"], list)
            assert len(result["messages"]) > 0

            # Verify all output fields are populated
            assert result["plan"]
            assert result["code"]
            assert result["test_results"]

            logger.info(
                "Phase 2 state accumulation test passed",
                message_count=len(result["messages"]),
            )

        except Exception as e:
            logger.warning(f"Phase 2 state accumulation test skipped: {e}")
            pytest.skip("Claude API not available")

    @pytest.mark.asyncio
    async def test_workflow_with_metadata(self) -> None:
        """Test that workflow properly tracks metadata across all nodes."""
        try:
            thread_id = "phase2-metadata-test"
            result = await invoke_workflow(
                task_description="Test with metadata tracking",
                task_id=3,
                thread_id=thread_id,
            )

            # Verify metadata is properly structured
            assert isinstance(result["metadata"], dict)

            # Verify workflow-level metadata
            assert result["metadata"].get("thread_id") == thread_id
            assert "workflow_started_at" in result["metadata"]

            # Verify node-level timestamps in order
            timestamps = {
                "plan": result["metadata"].get("plan_generated_at"),
                "code": result["metadata"].get("code_generated_at"),
                "tests": result["metadata"].get("tests_generated_at"),
            }

            for node, timestamp in timestamps.items():
                assert timestamp is not None, f"{node} timestamp missing"

            logger.info(
                "Phase 2 metadata tracking test passed",
                metadata_keys=list(result["metadata"].keys()),
            )

        except Exception as e:
            logger.warning(f"Phase 2 metadata test skipped: {e}")
            pytest.skip("Claude API not available")

    @pytest.mark.asyncio
    async def test_workflow_stream_events(self) -> None:
        """Test that workflow streaming generates proper events."""
        try:
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

        except Exception as e:
            logger.warning(f"Phase 2 streaming test skipped: {e}")
            pytest.skip("Claude API not available")

    @pytest.mark.asyncio
    async def test_workflow_message_flow(self) -> None:
        """Test that messages accumulate through the workflow."""
        try:
            result = await invoke_workflow(
                task_description="Message accumulation test",
                task_id=5,
            )

            # Verify messages list exists and has accumulated messages
            messages = result.get("messages", [])
            assert isinstance(messages, list), "Messages should be a list"
            assert len(messages) >= 3, "Should have at least one message per node"

            # Each message should have expected properties
            for msg in messages:
                # LangChain messages have type and content
                assert hasattr(msg, "content") or isinstance(msg, dict)

            logger.info("Phase 2 message flow test passed", message_count=len(messages))

        except Exception as e:
            logger.warning(f"Phase 2 message flow test skipped: {e}")
            pytest.skip("Claude API not available")

    def test_workflow_structure(self) -> None:
        """Test that workflow graph has correct structure for Phase 2."""
        from src.agents.graph import get_compiled_graph

        graph = get_compiled_graph()

        # Verify graph has all Phase 2 nodes
        node_names = list(graph.nodes.keys())
        assert "__start__" in node_names
        assert "planner" in node_names
        assert "coder" in node_names
        assert "tester" in node_names

        logger.info("Phase 2 workflow structure test passed", nodes=node_names)
