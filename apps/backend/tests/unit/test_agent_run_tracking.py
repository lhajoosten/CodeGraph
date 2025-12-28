"""Tests for AgentRun tracking functionality.

Tests the AgentRunService and AgentRunTracker for persisting
agent node executions during workflow processing.
"""

from src.agents.infrastructure.tracking import NODE_TO_AGENT_TYPE, AgentRunTracker
from src.models.agent_run import AgentRunStatus, AgentType
from src.services.agent_run_service import AgentRunService


class TestAgentRunService:
    """Test the AgentRunService CRUD operations."""

    def test_node_to_agent_type_mapping(self) -> None:
        """Test that all agent nodes are mapped correctly."""
        assert NODE_TO_AGENT_TYPE["planner"] == AgentType.PLANNER
        assert NODE_TO_AGENT_TYPE["coder"] == AgentType.CODER
        assert NODE_TO_AGENT_TYPE["tester"] == AgentType.TESTER
        assert NODE_TO_AGENT_TYPE["reviewer"] == AgentType.REVIEWER

    def test_agent_run_status_enum(self) -> None:
        """Test that all expected statuses are defined."""
        assert AgentRunStatus.PENDING.value == "pending"
        assert AgentRunStatus.RUNNING.value == "running"
        assert AgentRunStatus.COMPLETED.value == "completed"
        assert AgentRunStatus.FAILED.value == "failed"
        assert AgentRunStatus.TIMEOUT.value == "timeout"
        assert AgentRunStatus.CANCELLED.value == "cancelled"

    def test_agent_type_enum(self) -> None:
        """Test that all agent types are defined."""
        assert AgentType.PLANNER.value == "planner"
        assert AgentType.CODER.value == "coder"
        assert AgentType.TESTER.value == "tester"
        assert AgentType.REVIEWER.value == "reviewer"


class TestAgentRunTracker:
    """Test the AgentRunTracker callback handler."""

    def test_tracker_initialization(self) -> None:
        """Test that tracker can be initialized with required parameters."""
        # We can't test with a real db session here, but we can test the structure
        from unittest.mock import MagicMock

        mock_db = MagicMock()
        tracker = AgentRunTracker(
            db=mock_db,
            task_id=123,
            iteration=1,
            model_used="test-model",
        )

        assert tracker.task_id == 123
        assert tracker.iteration == 1
        assert tracker.model_used == "test-model"
        assert tracker.active_runs == {}

    def test_output_summary_extraction_planner(self) -> None:
        """Test output summary extraction for planner node."""
        from unittest.mock import MagicMock

        mock_db = MagicMock()
        tracker = AgentRunTracker(db=mock_db, task_id=1)

        outputs = {
            "plan": "Step 1: Do this\nStep 2: Do that\nStep 3: Finish",
            "status": "coding",
        }

        summary = tracker._extract_output_summary("planner", outputs)

        assert summary["node"] == "planner"
        assert summary["plan_length"] == len(outputs["plan"])
        assert "Step 1" in summary["plan_preview"]
        assert summary["status"] == "coding"

    def test_output_summary_extraction_coder(self) -> None:
        """Test output summary extraction for coder node."""
        from unittest.mock import MagicMock

        mock_db = MagicMock()
        tracker = AgentRunTracker(db=mock_db, task_id=1)

        outputs = {
            "code": "def hello():\n    return 'world'",
            "status": "testing",
        }

        summary = tracker._extract_output_summary("coder", outputs)

        assert summary["node"] == "coder"
        assert summary["code_length"] == len(outputs["code"])
        assert "def hello" in summary["code_preview"]

    def test_output_summary_extraction_tester(self) -> None:
        """Test output summary extraction for tester node."""
        from unittest.mock import MagicMock

        mock_db = MagicMock()
        tracker = AgentRunTracker(db=mock_db, task_id=1)

        outputs = {
            "test_results": "def test_hello():\n    assert hello() == 'world'",
            "status": "reviewing",
        }

        summary = tracker._extract_output_summary("tester", outputs)

        assert summary["node"] == "tester"
        assert summary["tests_length"] == len(outputs["test_results"])
        assert "test_hello" in summary["tests_preview"]

    def test_output_summary_extraction_reviewer(self) -> None:
        """Test output summary extraction for reviewer node."""
        from unittest.mock import MagicMock

        mock_db = MagicMock()
        tracker = AgentRunTracker(db=mock_db, task_id=1)

        outputs = {
            "review_feedback": "APPROVE - The code looks great!",
            "iterations": 1,
            "status": "complete",
        }

        summary = tracker._extract_output_summary("reviewer", outputs)

        assert summary["node"] == "reviewer"
        assert summary["feedback_length"] == len(outputs["review_feedback"])
        assert "APPROVE" in summary["feedback_preview"]
        assert summary["iterations"] == 1


class TestAgentRunServiceMethods:
    """Test AgentRunService method signatures and error handling."""

    def test_service_has_required_methods(self) -> None:
        """Test that service has all required methods."""
        assert hasattr(AgentRunService, "create_run")
        assert hasattr(AgentRunService, "start_run")
        assert hasattr(AgentRunService, "complete_run")
        assert hasattr(AgentRunService, "fail_run")
        assert hasattr(AgentRunService, "timeout_run")
        assert hasattr(AgentRunService, "get_run")
        assert hasattr(AgentRunService, "get_runs_for_task")
        assert hasattr(AgentRunService, "get_latest_run")
        assert hasattr(AgentRunService, "get_task_execution_summary")


class TestWorkflowTrackingIntegration:
    """Test integration of tracking with workflow functions."""

    def test_invoke_workflow_accepts_db_parameter(self) -> None:
        """Test that invoke_workflow accepts optional db parameter."""
        import inspect

        from src.agents.graph import invoke_workflow

        sig = inspect.signature(invoke_workflow)
        assert "db" in sig.parameters
        # Should have a default of None
        assert sig.parameters["db"].default is None

    def test_stream_workflow_accepts_db_parameter(self) -> None:
        """Test that stream_workflow accepts optional db parameter."""
        import inspect

        from src.agents.graph import stream_workflow

        sig = inspect.signature(stream_workflow)
        assert "db" in sig.parameters
        # Should have a default of None
        assert sig.parameters["db"].default is None
