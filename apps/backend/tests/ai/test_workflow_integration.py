"""Integration tests for the complete agent workflow with real LLM calls.

These tests require either:
- Local vLLM server running (default, USE_LOCAL_LLM=true)
- ANTHROPIC_API_KEY environment variable (when USE_LOCAL_LLM=false)

Optionally set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY for tracing.

Run with:
    poetry run pytest tests/ai/test_workflow_integration.py -v -s

Note: These tests make real LLM calls and consume compute/tokens.
"""

import os

import pytest

from src.agents.graph import get_compiled_graph, invoke_workflow
from src.agents.tracing import configure_tracing, is_tracing_enabled
from src.core.logging import get_logger
from tests.ai.conftest import get_llm_skip_reason, is_llm_available

logger = get_logger(__name__)


# Configure tracing before tests
configure_tracing()


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestWorkflowIntegrationReal:
    """Integration tests with real LLM calls.

    These tests verify the complete workflow end-to-end with actual LLM calls.
    They are skipped if no LLM backend is available (vLLM or Claude API).
    """

    def test_tracing_configuration(self) -> None:
        """Verify tracing configuration status."""
        if is_tracing_enabled():
            logger.info("LangSmith tracing is ENABLED")
            logger.info(f"Project: {os.environ.get('LANGCHAIN_PROJECT', 'unknown')}")
        else:
            logger.info("LangSmith tracing is DISABLED")
            logger.info("To enable, set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY")

    def test_graph_structure(self) -> None:
        """Verify the workflow graph has all expected nodes."""
        graph = get_compiled_graph()
        nodes = list(graph.nodes.keys())

        assert "__start__" in nodes, "Graph should have __start__ node"
        assert "planner" in nodes, "Graph should have planner node"
        assert "coder" in nodes, "Graph should have coder node"
        assert "tester" in nodes, "Graph should have tester node"
        assert "reviewer" in nodes, "Graph should have reviewer node"

        logger.info(f"Graph nodes: {nodes}")

    @pytest.mark.asyncio
    async def test_simple_workflow_execution(self) -> None:
        """Execute a simple workflow to verify end-to-end functionality.

        This test uses a minimal task to conserve API tokens while
        verifying the complete workflow pipeline works.
        """
        task_description = (
            "Create a simple Python function that adds two numbers and returns the result"
        )
        task_id = 999

        logger.info(f"Starting workflow test with task: {task_description[:50]}...")

        result = await invoke_workflow(
            task_description=task_description,
            task_id=task_id,
            timeout_seconds=120,  # 2 minute timeout for simple task
        )

        # Verify workflow completed
        assert result is not None, "Workflow should return a result"
        assert result.get("task_id") == task_id, "Result should contain task_id"

        # Check workflow status
        status = result.get("status")
        error = result.get("error")

        if status == "timeout":
            pytest.skip(f"Workflow timed out: {error}")

        if error:
            logger.error(f"Workflow error: {error}")
            pytest.fail(f"Workflow failed with error: {error}")

        # Verify all stages produced output
        assert result.get("plan"), "Planner should produce a plan"
        assert result.get("code"), "Coder should produce code"
        assert result.get("test_results"), "Tester should produce tests"
        assert result.get("review_feedback"), "Reviewer should produce feedback"

        # Log results summary
        logger.info(f"Workflow completed with status: {status}")
        logger.info(f"Plan length: {len(result.get('plan', ''))}")
        logger.info(f"Code length: {len(result.get('code', ''))}")
        logger.info(f"Tests length: {len(result.get('test_results', ''))}")
        logger.info(f"Review length: {len(result.get('review_feedback', ''))}")
        logger.info(f"Iterations: {result.get('iterations', 0)}")

        # Log verdict
        feedback = result.get("review_feedback", "")
        if "APPROVE" in feedback.upper():
            logger.info("Verdict: APPROVE ✅")
        elif "REVISE" in feedback.upper():
            logger.info("Verdict: REVISE 🔄")
        elif "REJECT" in feedback.upper():
            logger.info("Verdict: REJECT ❌")

        # Verify metadata tracking
        metadata = result.get("metadata", {})
        assert "workflow_started_at" in metadata, "Should track workflow start time"

        logger.info("Workflow integration test PASSED ✅")


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestWorkflowReviewLoop:
    """Tests for the review loop behavior with real API calls."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_workflow_with_intentionally_flawed_task(self) -> None:
        """Test workflow with a task likely to trigger revision.

        This test is marked as slow because it may go through
        multiple revision iterations.
        """
        # A vague task that might trigger revision feedback
        task_description = "make something"
        task_id = 998

        logger.info("Testing workflow with vague task to trigger review loop...")

        result = await invoke_workflow(
            task_description=task_description,
            task_id=task_id,
            timeout_seconds=180,  # 3 minute timeout for potential iterations
        )

        if result.get("status") == "timeout":
            pytest.skip("Workflow timed out")

        iterations = result.get("iterations", 0)
        logger.info(f"Workflow completed after {iterations} iteration(s)")

        # Even vague tasks should produce some output
        assert result.get("plan"), "Should produce some plan"
        assert result.get("code"), "Should produce some code"

        logger.info("Review loop test completed")


class TestWorkflowMocked:
    """Tests that verify workflow structure without real API calls."""

    def test_workflow_initial_state(self) -> None:
        """Verify initial workflow state structure."""
        from src.agents.state import WorkflowState

        # Create initial state
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
            "metadata": {},
        }

        # Verify all required fields
        assert state["task_id"] == 1
        assert state["status"] == "planning"
        assert state["iterations"] == 0
        assert state["error"] is None

    def test_workflow_configuration(self) -> None:
        """Verify workflow configuration constants."""
        from src.agents.graph import MAX_REVIEW_ITERATIONS, WORKFLOW_TIMEOUT_SECONDS

        assert MAX_REVIEW_ITERATIONS == 3, "Max iterations should be 3"
        assert WORKFLOW_TIMEOUT_SECONDS == 300, "Timeout should be 5 minutes"

    def test_model_configuration(self) -> None:
        """Verify model configuration is correct."""
        from src.agents.models import ModelConfig

        # Verify all model tiers are configured
        assert "haiku" in ModelConfig.TIERS
        assert "sonnet" in ModelConfig.TIERS
        assert "opus" in ModelConfig.TIERS

        # Verify Claude fallback models are configured
        assert "haiku" in ModelConfig.CLAUDE_MODELS
        assert "sonnet" in ModelConfig.CLAUDE_MODELS
        assert "opus" in ModelConfig.CLAUDE_MODELS

        # Verify Claude model names contain expected pattern
        for tier, model_name in ModelConfig.CLAUDE_MODELS.items():
            assert "claude" in model_name, f"{tier} should be a Claude model"
