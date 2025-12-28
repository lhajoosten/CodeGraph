"""Tests for the Tester agent node.

Tests the test generation functionality of the tester node, including:
- Generating pytest test cases from code
- Maintaining workflow state through execution
- Proper metadata tracking and transitions
"""

import pytest

from src.agents.tester import tester_node
from src.core.logging import get_logger
from tests.ai.conftest import get_llm_skip_reason, is_llm_available
from tests.ai.utils import WorkflowStateBuilder

logger = get_logger(__name__)


@pytest.mark.skipif(not is_llm_available(), reason=get_llm_skip_reason())
class TestTesterNode:
    """Test the tester node execution.

    Verifies that the tester node correctly generates pytest test cases
    from code and maintains workflow state.
    """

    @pytest.mark.asyncio
    @pytest.mark.timeout(300)  # 5 minutes
    async def test_tester_generates_tests_from_code(self) -> None:
        """Test that tester generates tests from code."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Create FastAPI endpoint")
            .with_plan("1. Create schema\n2. Create service")
            .with_code("def login(email: str, password: str): return True")
            .with_status("testing")
            .build()
        )

        result = await tester_node(state)

        assert "test_results" in result
        assert result["test_results"]
        assert result["status"] == "reviewing"
        assert "tests_generated_at" in result["metadata"]
        logger.info("Tester node test passed", test_length=len(result["test_results"]))

    @pytest.mark.asyncio
    @pytest.mark.timeout(300)  # 5 minutes
    async def test_tester_preserves_state(self) -> None:
        """Test that tester preserves workflow state properly."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(42)
            .with_description("Complex task")
            .with_plan("Multi-step plan")
            .with_code("def complex(): return None")
            .with_iterations(2)
            .add_metadata("user_id", 99)
            .add_metadata("source", "api")
            .with_status("testing")
            .build()
        )

        result = await tester_node(state)

        # Verify state preservation
        assert result["iterations"] == 2  # Should be preserved
        assert result["metadata"].get("user_id") == 99
        assert result["metadata"].get("source") == "api"
        assert "tests_generated_at" in result["metadata"]
        logger.info("Tester state preservation test passed")

    @pytest.mark.asyncio
    @pytest.mark.timeout(300)  # 5 minutes
    async def test_tester_extends_metadata(self) -> None:
        """Test that tester extends metadata without losing original data."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(3)
            .with_description("Metadata extension test")
            .with_plan("Test plan")
            .with_code("def test(): pass")
            .with_status("testing")
            .add_metadata("plan_generated_at", "2025-12-27T22:00:00Z")
            .add_metadata("code_generated_at", "2025-12-27T22:01:00Z")
            .build()
        )

        result = await tester_node(state)

        # Original timestamps should be preserved
        assert result["metadata"].get("plan_generated_at") == "2025-12-27T22:00:00Z"
        assert result["metadata"].get("code_generated_at") == "2025-12-27T22:01:00Z"
        # New timestamp should be added
        assert "tests_generated_at" in result["metadata"]
        logger.info("Tester metadata extension test passed")

    @pytest.mark.asyncio
    @pytest.mark.timeout(300)  # 5 minutes
    async def test_tester_handles_complex_code(self) -> None:
        """Test that tester handles complex code with multiple functions."""
        complex_code = '''
def authenticate(username: str, password: str) -> dict:
    """Authenticate user credentials."""
    if not username or not password:
        raise ValueError("Username and password required")
    return {"token": "abc123", "expires_in": 3600}

async def fetch_user_data(user_id: int) -> dict:
    """Fetch user data from database."""
    if user_id <= 0:
        raise ValueError("Invalid user ID")
    return {"id": user_id, "name": "Test User"}
'''
        state = (
            WorkflowStateBuilder()
            .with_task_id(4)
            .with_description("Complex code testing")
            .with_plan("Test authentication and data fetching")
            .with_code(complex_code)
            .with_status("testing")
            .build()
        )

        result = await tester_node(state)

        assert result["test_results"]
        assert result["status"] == "reviewing"
        # Should contain tests for both functions
        assert "def test_" in result["test_results"] or "class Test" in result["test_results"]
        logger.info("Tester complex code test passed")

    @pytest.mark.asyncio
    @pytest.mark.timeout(300)  # 5 minutes
    async def test_tester_status_transition(self) -> None:
        """Test that tester correctly transitions status to reviewing."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Status transition test")
            .with_plan("Simple plan")
            .with_code("def example(): return True")
            .with_status("testing")
            .build()
        )

        result = await tester_node(state)

        # Status should transition from testing to reviewing
        assert result["status"] == "reviewing"
        logger.info("Tester status transition test passed")
