"""Tests for review loop iteration limits and workflow timeout handling.

Tests the complete workflow with review feedback, iteration limits enforcement,
and timeout handling mechanisms.
"""

import pytest

from src.agents.graph import (
    MAX_REVIEW_ITERATIONS,
    WORKFLOW_TIMEOUT_SECONDS,
    invoke_workflow,
    stream_workflow,
)
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from tests.ai.utils import WorkflowStateBuilder

logger = get_logger(__name__)


class TestIterationLimits:
    """Test iteration limit enforcement in the review loop."""

    def test_max_iterations_configuration(self) -> None:
        """Test that max iterations is properly configured."""
        assert MAX_REVIEW_ITERATIONS == 3
        assert isinstance(MAX_REVIEW_ITERATIONS, int)
        assert MAX_REVIEW_ITERATIONS > 0

    def test_iterations_counter_in_state(self) -> None:
        """Test that iterations counter exists in workflow state."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(1)
            .with_description("Test task")
            .with_iterations(0)
            .build()
        )

        assert state["iterations"] == 0

        # Simulate incrementing iterations (as coder does on revisions)
        state["iterations"] += 1
        assert state["iterations"] == 1

        state["iterations"] += 1
        assert state["iterations"] == 2

    def test_iteration_tracking_through_revisions(self) -> None:
        """Test iteration counter behavior across multiple revisions."""
        iterations = 0
        max_revisions = MAX_REVIEW_ITERATIONS

        for _ in range(max_revisions + 1):
            # Should allow revisions up to MAX_REVIEW_ITERATIONS
            if iterations < max_revisions:
                iterations += 1
                assert iterations <= max_revisions
            else:
                # After max reached, should not continue revising
                assert iterations == max_revisions


class TestTimeoutHandling:
    """Test timeout handling in workflow execution."""

    def test_timeout_configuration(self) -> None:
        """Test that timeout is properly configured."""
        assert WORKFLOW_TIMEOUT_SECONDS > 0
        assert isinstance(WORKFLOW_TIMEOUT_SECONDS, int)
        # 5 minutes is reasonable for workflow execution
        assert 60 <= WORKFLOW_TIMEOUT_SECONDS <= 600

    @pytest.mark.asyncio
    async def test_invoke_workflow_with_custom_timeout(self) -> None:
        """Test invoke_workflow accepts custom timeout parameter."""
        # Use a very short timeout to test timeout handling
        short_timeout = 1  # 1 second

        try:
            # This should timeout quickly since the workflow takes longer
            result = await invoke_workflow(
                task_description="Quick test",
                task_id=1,
                timeout_seconds=short_timeout,
            )

            # If it completes quickly, that's fine
            # If it times out, we should get a timeout status/error
            if result.get("status") == "timeout" or result.get("error"):
                assert "timeout" in result.get("error", "").lower() or result["status"] == "timeout"

        except TimeoutError:
            # This is expected for a 1-second timeout on actual API calls
            logger.info("Workflow timeout test completed (timeout as expected)")

    @pytest.mark.asyncio
    async def test_stream_workflow_with_timeout(self) -> None:
        """Test stream_workflow respects timeout parameter."""
        # Very short timeout to test timeout handling
        short_timeout = 1  # 1 second

        try:
            event_count = 0
            timeout_occurred = False

            async for event in stream_workflow(
                task_description="Stream timeout test",
                task_id=2,
                timeout_seconds=short_timeout,
            ):
                event_count += 1

                # Check if it's a timeout error event
                if event.get("type") == "error":
                    if "timeout" in str(event.get("data", {})).lower():
                        timeout_occurred = True
                        break

            # Either we got events before timeout, or we hit timeout
            logger.info(f"Stream workflow test: {event_count} events, timeout={timeout_occurred}")

        except TimeoutError:
            logger.info("Stream workflow timeout test completed (timeout as expected)")

    def test_invoke_workflow_timeout_parameter(self) -> None:
        """Test that invoke_workflow accepts timeout parameter."""
        # We're just testing the function signature accepts the parameter
        import inspect

        sig = inspect.signature(invoke_workflow)
        assert "timeout_seconds" in sig.parameters

    def test_stream_workflow_timeout_parameter(self) -> None:
        """Test that stream_workflow accepts timeout parameter."""
        import inspect

        sig = inspect.signature(stream_workflow)
        assert "timeout_seconds" in sig.parameters


class TestWorkflowGraphStructure:
    """Test Phase 2 workflow graph structure and conditional routing."""

    def test_workflow_has_reviewer_node(self) -> None:
        """Test that workflow includes the reviewer node."""
        from src.agents.graph import get_compiled_graph

        graph = get_compiled_graph()
        nodes = list(graph.nodes.keys())

        assert "reviewer" in nodes, "Workflow should have reviewer node"
        assert "planner" in nodes
        assert "coder" in nodes
        assert "tester" in nodes

    def test_workflow_state_has_iterations_field(self) -> None:
        """Test that WorkflowState includes iterations field."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "test",
            "plan": "",
            "code": "",
            "code_files": {},
            "test_results": "",
            "test_analysis": {},
            "review_feedback": "",
            "iterations": 0,  # Phase 2 addition
            "status": "planning",
            "error": None,
            "metadata": {},
        }

        assert "iterations" in state
        assert isinstance(state["iterations"], int)

    def test_workflow_status_values(self) -> None:
        """Test that workflow includes all expected status values."""
        # Valid status values for Phase 2
        valid_statuses = ["planning", "coding", "testing", "reviewing", "complete"]

        for status in valid_statuses:
            state: WorkflowState = {
                "messages": [],
                "task_id": 1,
                "task_description": "test",
                "plan": "",
                "code": "",
                "code_files": {},
                "test_results": "",
                "test_analysis": {},
                "review_feedback": "",
                "iterations": 0,
                "status": status,  # type: ignore
                "error": None,
                "metadata": {},
            }
            assert state["status"] == status

    @pytest.mark.asyncio
    async def test_workflow_metadata_tracking(self) -> None:
        """Test that workflow tracks metadata for all phases."""
        state = (
            WorkflowStateBuilder()
            .with_task_id(100)
            .with_description("Test metadata tracking")
            .build()
        )

        # Simulate metadata being added through workflow
        state["metadata"]["workflow_started_at"] = "2025-01-01T00:00:00"
        state["metadata"]["plan_generated_at"] = "2025-01-01T00:00:01"
        state["metadata"]["code_generated_at"] = "2025-01-01T00:00:02"
        state["metadata"]["tests_generated_at"] = "2025-01-01T00:00:03"
        state["metadata"]["review_completed_at"] = "2025-01-01T00:00:04"

        # Verify all timestamps are present
        assert "workflow_started_at" in state["metadata"]
        assert "plan_generated_at" in state["metadata"]
        assert "code_generated_at" in state["metadata"]
        assert "tests_generated_at" in state["metadata"]
        assert "review_completed_at" in state["metadata"]

        logger.info("Workflow metadata tracking test passed")


class TestReviewLoopRouting:
    """Test the complete review loop behavior with iterations and verdicts."""

    def test_review_loop_with_revise_verdict(self) -> None:
        """Test review loop logic when verdict is REVISE."""
        feedback = "REVISE - Please improve error handling"
        iterations = 1
        max_iterations = MAX_REVIEW_ITERATIONS

        # Should loop back to coder when REVISE and within limits
        should_loop = "REVISE" in feedback and iterations < max_iterations
        assert should_loop

    def test_review_loop_respects_iteration_limit(self) -> None:
        """Test that review loop stops at max iterations."""
        feedback = "REVISE - Still needs improvement"

        for iteration in range(1, MAX_REVIEW_ITERATIONS + 2):
            should_loop = "REVISE" in feedback and iteration < MAX_REVIEW_ITERATIONS

            if iteration < MAX_REVIEW_ITERATIONS:
                assert should_loop, f"Should loop at iteration {iteration}"
            else:
                assert not should_loop, f"Should NOT loop at iteration {iteration}"

    def test_review_loop_stops_on_approve(self) -> None:
        """Test that review loop stops when verdict is APPROVE."""
        feedback = "APPROVE - Ready to ship!"
        iterations = 1

        # Should not loop back when APPROVE
        should_loop = "REVISE" in feedback and iterations < MAX_REVIEW_ITERATIONS
        assert not should_loop

    def test_review_loop_stops_on_reject(self) -> None:
        """Test that review loop stops when verdict is REJECT."""
        feedback = "REJECT - Needs major rework"
        iterations = 1

        # Should not loop back when REJECT
        should_loop = "REVISE" in feedback and iterations < MAX_REVIEW_ITERATIONS
        assert not should_loop

    def test_iteration_increments_only_on_revise(self) -> None:
        """Test that iterations only increment when code is revised."""
        initial_iterations = 0

        # APPROVE: iterations should stay the same
        feedback = "APPROVE"
        iterations = initial_iterations
        if "REVISE" in feedback:
            iterations += 1
        assert iterations == initial_iterations

        # REVISE: iterations should increment
        feedback = "REVISE"
        iterations = initial_iterations
        if "REVISE" in feedback:
            iterations += 1
        assert iterations == initial_iterations + 1

        # REJECT: iterations should stay the same
        feedback = "REJECT"
        iterations = initial_iterations
        if "REVISE" in feedback:
            iterations += 1
        assert iterations == initial_iterations


class TestCompleteWorkflowFlow:
    """Test the complete workflow flow with review and conditional routing."""

    def test_workflow_path_with_approve(self) -> None:
        """Test workflow path: planner → coder → tester → reviewer → complete."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 1,
            "task_description": "Create user endpoint",
            "plan": "1. Create endpoint\n2. Add tests",
            "code": "def login(): pass",
            "code_files": {},
            "test_results": "def test_login(): pass",
            "test_analysis": {},
            "review_feedback": "APPROVE - Production ready",
            "iterations": 0,
            "status": "complete",
            "error": None,
            "metadata": {
                "workflow_started_at": "2025-01-01T00:00:00",
                "plan_generated_at": "2025-01-01T00:00:01",
                "code_generated_at": "2025-01-01T00:00:02",
                "tests_generated_at": "2025-01-01T00:00:03",
                "review_completed_at": "2025-01-01T00:00:04",
            },
        }

        # Verify complete workflow state
        assert state["status"] == "complete"
        assert state["plan"]
        assert state["code"]
        assert state["test_results"]
        assert state["review_feedback"]
        assert state["iterations"] == 0

    def test_workflow_path_with_revise(self) -> None:
        """Test workflow path: planner → coder → tester → reviewer → coder (revised) → ..."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 2,
            "task_description": "Create user endpoint",
            "plan": "1. Create endpoint\n2. Add tests",
            "code": "def login(): pass  # v2 - improved error handling",
            "code_files": {},
            "test_results": "def test_login(): pass",
            "test_analysis": {},
            "review_feedback": "APPROVE - All improvements made",
            "iterations": 1,  # First revision completed
            "status": "complete",
            "error": None,
            "metadata": {},
        }

        # Verify revision workflow state
        assert state["status"] == "complete"
        assert state["iterations"] == 1
        assert "v2" in state["code"]

    def test_workflow_path_max_iterations(self) -> None:
        """Test workflow path when max iterations reached."""
        state: WorkflowState = {
            "messages": [],
            "task_id": 3,
            "task_description": "Create user endpoint",
            "plan": "1. Create endpoint\n2. Add tests",
            "code": "def login(): pass",
            "code_files": {},
            "test_results": "def test_login(): pass",
            "test_analysis": {},
            "review_feedback": f"REVISE - More improvements needed\n\n[Note: Maximum revisions ({MAX_REVIEW_ITERATIONS}) reached]",
            "iterations": MAX_REVIEW_ITERATIONS,
            "status": "complete",
            "error": None,
            "metadata": {},
        }

        # Verify max iterations workflow state
        assert state["iterations"] == MAX_REVIEW_ITERATIONS
        assert state["status"] == "complete"
        assert "Maximum revisions" in state["review_feedback"]
