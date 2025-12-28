"""Tests for the Coder agent node.

Tests the code generation functionality of the coder node, including:
- Generating code from execution plans
- Handling review feedback and revisions
- Proper state transitions and metadata tracking

Note: These tests require an LLM (local vLLM or Claude API). Tests handle
timeout/error conditions gracefully by skipping when the LLM is slow.
"""

import pytest

from src.agents.coder import coder_node
from src.core.logging import get_logger
from tests.ai.conftest import get_llm_skip_reason, is_llm_available
from tests.ai.utils import WorkflowStateBuilder

logger = get_logger(__name__)


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestCoderNode:
    """Test the coder node execution.

    Verifies that the coder node correctly generates code from plans
    and handles review feedback for revisions.

    Note: These tests may timeout with slow LLM backends.
    """

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes (increased for slow LLM)
    async def test_coder_generates_code_from_plan(self) -> None:
        """Test that coder generates code from plan."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Create FastAPI endpoint")
            .with_plan("1. Create schema\n2. Create service\n3. Create endpoint")
            .with_status("coding")
            .build()
        )

        try:
            result = await coder_node(state)
        except Exception as e:
            if "timeout" in str(e).lower():
                pytest.skip("Coder node timed out - LLM backend is slow")
            raise

        assert "code" in result
        assert result["code"], "Coder should generate code"
        assert result["status"] == "testing"
        assert len(result["messages"]) > 0
        assert "code_generated_at" in result["metadata"]
        logger.info("Coder node test passed", code_length=len(result["code"]))

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_coder_incorporates_review_feedback(self) -> None:
        """Test that coder handles revision requests with feedback."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Test task")
            .with_plan("Simple plan")
            .with_code("def old_function(): pass")
            .with_review_feedback("Add error handling and documentation")
            .with_status("coding")
            .with_iterations(1)
            .build()
        )

        try:
            result = await coder_node(state)
        except Exception as e:
            if "timeout" in str(e).lower():
                pytest.skip("Coder node timed out - LLM backend is slow")
            raise

        assert result["iterations"] == 2  # Should be incremented
        assert result["metadata"].get("is_revision") is True
        assert result["status"] == "testing"
        logger.info("Coder revision test passed")

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_coder_preserves_metadata(self) -> None:
        """Test that coder preserves and extends metadata."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(5)
            .with_description("Metadata test")
            .with_plan("Test plan")
            .with_status("coding")
            .add_metadata("user_id", 42)
            .add_metadata("source", "api")
            .build()
        )

        try:
            result = await coder_node(state)
        except Exception as e:
            if "timeout" in str(e).lower():
                pytest.skip("Coder node timed out - LLM backend is slow")
            raise

        # Original metadata should be preserved
        assert result["metadata"].get("user_id") == 42
        assert result["metadata"].get("source") == "api"
        # New metadata should be added
        assert "code_generated_at" in result["metadata"]
        assert result["metadata"].get("coder_model") == "sonnet"
        logger.info("Coder metadata test passed")

    @pytest.mark.asyncio
    @pytest.mark.timeout(600)  # 10 minutes
    async def test_coder_handles_empty_review_feedback(self) -> None:
        """Test that coder handles empty review feedback gracefully."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("No feedback task")
            .with_plan("Simple plan")
            .with_review_feedback("")  # Empty feedback
            .with_status("coding")
            .build()
        )

        try:
            result = await coder_node(state)
        except Exception as e:
            if "timeout" in str(e).lower():
                pytest.skip("Coder node timed out - LLM backend is slow")
            raise

        # Should not treat empty feedback as revision
        assert result["metadata"].get("is_revision") is False
        assert result["status"] == "testing"
        logger.info("Coder empty feedback test passed")
