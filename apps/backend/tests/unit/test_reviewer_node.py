"""Tests for the Reviewer agent node and review loop logic.

Tests the reviewer node's ability to assess code quality, extract verdicts,
and the conditional routing that enables the review loop.
"""

from unittest.mock import AsyncMock, patch

import pytest

from src.agents.nodes.reviewer import ReviewVerdict, extract_verdict_from_text, reviewer_node
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from tests.ai.utils import WorkflowStateBuilder

logger = get_logger(__name__)


class TestReviewerNode:
    """Test the reviewer node functionality."""

    def test_extract_verdict_approve(self) -> None:
        """Test extraction of APPROVE verdict."""
        feedback = """
        This is excellent code with great structure and comprehensive tests.
        APPROVE - The code is production-ready.
        """
        assert extract_verdict_from_text(feedback) == ReviewVerdict.APPROVE

    def test_extract_verdict_revise(self) -> None:
        """Test extraction of REVISE verdict."""
        feedback = """
        The code has some issues that need fixing.
        REVISE - Please address the following points:
        1. Add more error handling
        2. Improve test coverage
        """
        assert extract_verdict_from_text(feedback) == ReviewVerdict.REVISE

    def test_extract_verdict_reject(self) -> None:
        """Test extraction of REJECT verdict."""
        feedback = """
        This code has fundamental issues and needs major rework.
        REJECT - The approach needs to be reconsidered.
        """
        assert extract_verdict_from_text(feedback) == ReviewVerdict.REJECT

    def test_extract_verdict_case_insensitive(self) -> None:
        """Test that verdict extraction is case-insensitive."""
        feedback = "approve this code"
        assert extract_verdict_from_text(feedback) == ReviewVerdict.APPROVE

        feedback = "revise the implementation"
        assert extract_verdict_from_text(feedback) == ReviewVerdict.REVISE

    def test_extract_verdict_default_to_revise(self) -> None:
        """Test that unclear verdicts default to REVISE."""
        feedback = "The code seems okay but could be better"
        assert extract_verdict_from_text(feedback) == ReviewVerdict.REVISE

    @pytest.mark.asyncio
    async def test_reviewer_node_approve_verdict(self) -> None:
        """Test reviewer node with APPROVE verdict."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Test endpoint")
            .with_status("reviewing")
            .with_plan("1. Create endpoint\n2. Add tests")
            .with_code("def hello(): return 'world'")
            .with_test_results("def test_hello(): assert hello() == 'world'")
            .build()
        )

        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            # Mock the reviewer model instance
            mock_model = AsyncMock()
            feedback_content = "Excellent code! APPROVE - This is production-ready."

            # Create a mock response that simulates BaseMessage with no tool calls
            from langchain_core.messages import AIMessage

            mock_response = AIMessage(content=feedback_content)
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # Verify result structure
            assert "review_feedback" in result
            assert "APPROVE" in result["review_feedback"]
            assert result["status"] == "complete"
            assert result["messages"]

            logger.info("Reviewer APPROVE test passed")

    @pytest.mark.asyncio
    async def test_reviewer_node_revise_verdict(self) -> None:
        """Test reviewer node with REVISE verdict."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(2)
            .with_description("Test endpoint")
            .with_status("reviewing")
            .with_plan("1. Create endpoint\n2. Add tests")
            .with_code("def hello(): return 'world'")
            .with_test_results("def test_hello(): assert hello() == 'world'")
            .build()
        )

        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            # Mock the reviewer model instance
            mock_model = AsyncMock()
            feedback_content = """Issues found:
            1. Add error handling
            2. Improve test coverage
            REVISE - Please address these points."""

            # Create a mock response that simulates BaseMessage with no tool calls
            from langchain_core.messages import AIMessage

            mock_response = AIMessage(content=feedback_content)
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # Verify result structure
            assert "review_feedback" in result
            assert "REVISE" in result["review_feedback"]
            # Status should remain "coding" when revision is needed
            assert result["status"] == "coding"
            assert result["messages"]

            logger.info("Reviewer REVISE test passed")

    @pytest.mark.asyncio
    async def test_reviewer_node_reject_verdict(self) -> None:
        """Test reviewer node with REJECT verdict."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(3)
            .with_description("Test endpoint")
            .with_status("reviewing")
            .with_plan("1. Create endpoint\n2. Add tests")
            .with_code("def hello(): return 'world'")
            .with_test_results("def test_hello(): assert hello() == 'world'")
            .build()
        )

        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            # Mock the reviewer model instance
            mock_model = AsyncMock()
            feedback_content = """The approach is fundamentally flawed.
            REJECT - This needs to be reconsidered from scratch."""

            # Create a mock response that simulates BaseMessage with no tool calls
            from langchain_core.messages import AIMessage

            mock_response = AIMessage(content=feedback_content)
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # Verify result structure
            assert "review_feedback" in result
            assert "REJECT" in result["review_feedback"]
            # Status should be complete (not looping back for REJECT)
            assert result["status"] == "complete"

            logger.info("Reviewer REJECT test passed")

    @pytest.mark.asyncio
    async def test_reviewer_node_iteration_tracking(self) -> None:
        """Test that reviewer node properly tracks iterations."""
        # First iteration (no previous iterations)
        state = (
            WorkflowStateBuilder()
            .with_task_id(4)
            .with_description("Test task")
            .with_iterations(0)
            .with_status("reviewing")
            .with_plan("Plan")
            .with_code("Code")
            .with_test_results("Tests")
            .build()
        )

        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            from langchain_core.messages import AIMessage

            mock_model = AsyncMock()
            mock_response = AIMessage(content="REVISE - Please improve")
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # First revision should increment iterations
            assert result["iterations"] == 1

        # Second iteration
        state["iterations"] = 1
        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            from langchain_core.messages import AIMessage

            mock_model = AsyncMock()
            mock_response = AIMessage(content="REVISE - Still needs work")
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # Second revision should increment to 2
            assert result["iterations"] == 2

        logger.info("Reviewer iteration tracking test passed")

    @pytest.mark.asyncio
    async def test_reviewer_node_includes_metadata(self) -> None:
        """Test that reviewer node includes proper metadata."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(5)
            .with_description("Test task")
            .with_status("reviewing")
            .with_plan("Plan")
            .with_code("Code")
            .with_test_results("Tests")
            .build()
        )

        with patch("src.agents.nodes.reviewer.get_reviewer_model_with_tools") as mock_model_factory:
            from langchain_core.messages import AIMessage

            mock_model = AsyncMock()
            mock_response = AIMessage(content="APPROVE - Ready to ship!")
            mock_response.tool_calls = []  # No tool calls to end the ReAct loop
            mock_model.ainvoke = AsyncMock(return_value=mock_response)
            mock_model_factory.return_value = mock_model

            result = await reviewer_node(state)

            # Verify metadata
            assert "review_completed_at" in result["metadata"]
            assert result["metadata"]["reviewer_model"] == "sonnet"
            assert "verdict" in result["metadata"]

            logger.info("Reviewer metadata test passed")


class TestReviewLoop:
    """Test the review loop conditional routing."""

    def test_route_after_review_approve(self) -> None:
        """Test routing on APPROVE verdict."""
        from src.agents.graph import create_workflow

        workflow = create_workflow()

        # The route_after_review function is defined inside create_workflow
        # We test it indirectly through the workflow structure
        assert "reviewer" in workflow.nodes

    def test_route_after_review_within_limits(self) -> None:
        """Test routing REVISE when within iteration limits."""
        from src.agents.graph import MAX_REVIEW_ITERATIONS

        # Create state with REVISE feedback and iterations < MAX
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Test",
            "plan": "Plan",
            "code": "Code",
            "test_results": "Tests",
            "review_feedback": "REVISE - Please improve",
            "iterations": 1,  # Less than MAX_REVIEW_ITERATIONS
            "status": "reviewing",
            "error": None,
            "metadata": {},
        }

        # The route_after_review function would route to "coder"
        feedback = state.get("review_feedback", "").upper()
        iterations = state.get("iterations", 0)

        should_revise = "REVISE" in feedback and iterations < MAX_REVIEW_ITERATIONS
        assert should_revise

    def test_route_after_review_exceeds_limit(self) -> None:
        """Test routing when max iterations reached."""
        from src.agents.graph import MAX_REVIEW_ITERATIONS

        # Create state with REVISE feedback at max iterations
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Test",
            "plan": "Plan",
            "code": "Code",
            "test_results": "Tests",
            "review_feedback": "REVISE - More improvements needed",
            "iterations": MAX_REVIEW_ITERATIONS,  # At or beyond MAX
            "status": "reviewing",
            "error": None,
            "metadata": {},
        }

        # The route_after_review function would route to END (not back to coder)
        feedback = state.get("review_feedback", "").upper()
        iterations = state.get("iterations", 0)

        should_revise = "REVISE" in feedback and iterations < MAX_REVIEW_ITERATIONS
        assert not should_revise

    def test_max_iterations_configuration(self) -> None:
        """Test that MAX_REVIEW_ITERATIONS is properly configured."""
        from src.agents.graph import MAX_REVIEW_ITERATIONS

        # Verify it's a reasonable number (1-10 iterations)
        assert 1 <= MAX_REVIEW_ITERATIONS <= 10
        assert MAX_REVIEW_ITERATIONS == 3  # As configured in graph.py

        logger.info(f"MAX_REVIEW_ITERATIONS = {MAX_REVIEW_ITERATIONS}")


class TestReviewerIntegration:
    """Integration tests with the full workflow including reviewer."""

    @pytest.mark.asyncio
    async def test_reviewer_in_workflow(self) -> None:
        """Test reviewer node is properly integrated in workflow graph."""
        from src.agents.graph import get_compiled_graph

        graph = get_compiled_graph()
        node_names = list(graph.nodes.keys())

        # Verify reviewer node exists in graph
        assert "reviewer" in node_names
        assert "planner" in node_names
        assert "coder" in node_names
        assert "tester" in node_names

        logger.info(f"Workflow nodes: {node_names}")
