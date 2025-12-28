"""Integration tests for council-based review workflow."""

from collections.abc import AsyncGenerator
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.agents.council import CodeReviewCouncil, CouncilConfig, JudgeConfig
from src.agents.council_node import council_reviewer_node
from src.agents.state import CouncilState, JudgeVerdictState, WorkflowState
from src.core.database import Base
from src.models import Task, User

# In-memory SQLite for integration tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create and dispose async engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async_session_factory = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        display_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_task(db_session: AsyncSession, test_user: User) -> Task:
    """Create a test task."""
    task = Task(
        title="Test Task",
        description="Create a greeting function",
        status="reviewing",
        priority="medium",
        user_id=test_user.id,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


class TestCouncilWorkflowIntegration:
    """Integration tests for council review workflow."""

    @pytest.fixture
    def sample_workflow_state(self, test_task: Task) -> WorkflowState:
        """Create sample workflow state for testing."""
        return WorkflowState(
            messages=[],
            task_id=test_task.id,
            task_description="Create a greeting function",
            plan="1. Create function\n2. Add docstring\n3. Return greeting",
            code='''
def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}!"
''',
            code_files={"main.py": "def greet(name: str) -> str:\n    return f'Hello, {name}!'"},
            test_results="All tests passed",
            test_analysis={"test_count": 3, "passed": 3, "failed": 0},
            review_feedback="",
            iterations=0,
            status="reviewing",
            error=None,
            metadata={"started_at": datetime.utcnow().isoformat()},
        )

    @pytest.fixture
    def mock_council_state(self) -> CouncilState:
        """Create mock council state for testing."""
        return CouncilState(
            judge_verdicts={
                "security_judge": JudgeVerdictState(
                    judge_name="security_judge",
                    persona="Security Expert",
                    model_tier="local",
                    verdict="APPROVE",
                    confidence=0.9,
                    issues=[],
                    reasoning="Code is secure",
                    strengths=["Input validation present"],
                    action_items=[],
                    tokens_used=150,
                    latency_ms=500,
                    cost_usd=0.0,
                ),
                "performance_judge": JudgeVerdictState(
                    judge_name="performance_judge",
                    persona="Performance Expert",
                    model_tier="local",
                    verdict="APPROVE",
                    confidence=0.85,
                    issues=[],
                    reasoning="Code is efficient",
                    strengths=["Simple algorithm"],
                    action_items=[],
                    tokens_used=140,
                    latency_ms=450,
                    cost_usd=0.0,
                ),
                "maintainability_judge": JudgeVerdictState(
                    judge_name="maintainability_judge",
                    persona="Maintainability Expert",
                    model_tier="local",
                    verdict="APPROVE",
                    confidence=0.95,
                    issues=[],
                    reasoning="Code is clean and well-documented",
                    strengths=["Good docstring", "Type hints"],
                    action_items=[],
                    tokens_used=160,
                    latency_ms=480,
                    cost_usd=0.0,
                ),
            },
            council_conclusion="## Council Review Conclusion\n\n**Final Verdict:** APPROVE",
            final_verdict="APPROVE",
            confidence_score=0.9,
            consensus_type="unanimous",
            dissenting_opinions=[],
            deliberation_time_ms=1500,
            total_cost_usd=0.0,
            llm_mode="local",
        )

    @pytest.mark.asyncio
    async def test_council_reviewer_node_approve(
        self,
        sample_workflow_state: WorkflowState,
        mock_council_state: CouncilState,
    ) -> None:
        """Test council reviewer node returns APPROVE verdict."""
        # Mock the council
        with patch("src.agents.council_node.CodeReviewCouncil") as MockCouncil:
            mock_instance = MagicMock()
            mock_instance.convene = AsyncMock(return_value=mock_council_state)
            MockCouncil.return_value = mock_instance

            result = await council_reviewer_node(sample_workflow_state)

            assert result["status"] == "complete"
            assert "APPROVE" in result["review_feedback"]
            assert result["metadata"]["verdict"] == "APPROVE"
            assert result["metadata"]["confidence_score"] == 0.9
            assert result["metadata"]["council_review"]["consensus_type"] == "unanimous"

    @pytest.mark.asyncio
    async def test_council_reviewer_node_revise(
        self,
        sample_workflow_state: WorkflowState,
    ) -> None:
        """Test council reviewer node returns REVISE verdict."""
        revise_state = CouncilState(
            judge_verdicts={
                "security_judge": JudgeVerdictState(
                    judge_name="security_judge",
                    persona="Security Expert",
                    model_tier="local",
                    verdict="REVISE",
                    confidence=0.85,
                    issues=[
                        {
                            "severity": "major",
                            "category": "security",
                            "description": "Input not sanitized",
                        }
                    ],
                    reasoning="Input validation needed",
                    strengths=[],
                    action_items=["Add input sanitization"],
                    tokens_used=150,
                    latency_ms=500,
                    cost_usd=0.0,
                ),
                "performance_judge": JudgeVerdictState(
                    judge_name="performance_judge",
                    persona="Performance Expert",
                    model_tier="local",
                    verdict="APPROVE",
                    confidence=0.8,
                    issues=[],
                    reasoning="Performance is acceptable",
                    strengths=["Simple function"],
                    action_items=[],
                    tokens_used=140,
                    latency_ms=450,
                    cost_usd=0.0,
                ),
                "maintainability_judge": JudgeVerdictState(
                    judge_name="maintainability_judge",
                    persona="Maintainability Expert",
                    model_tier="local",
                    verdict="REVISE",
                    confidence=0.75,
                    issues=[
                        {
                            "severity": "minor",
                            "category": "maintainability",
                            "description": "Missing error handling",
                        }
                    ],
                    reasoning="Needs error handling",
                    strengths=["Good naming"],
                    action_items=["Add try/except"],
                    tokens_used=160,
                    latency_ms=480,
                    cost_usd=0.0,
                ),
            },
            council_conclusion="## Council Review Conclusion\n\n**Final Verdict:** REVISE",
            final_verdict="REVISE",
            confidence_score=0.75,
            consensus_type="majority",
            dissenting_opinions=["performance_judge"],
            deliberation_time_ms=1500,
            total_cost_usd=0.0,
            llm_mode="local",
        )

        with patch("src.agents.council_node.CodeReviewCouncil") as MockCouncil:
            mock_instance = MagicMock()
            mock_instance.convene = AsyncMock(return_value=revise_state)
            MockCouncil.return_value = mock_instance

            result = await council_reviewer_node(sample_workflow_state)

            assert result["status"] == "coding"  # Goes back to coding for revision
            assert result["metadata"]["verdict"] == "REVISE"
            assert len(result["metadata"]["council_review"]["dissenting_opinions"]) > 0

    @pytest.mark.asyncio
    async def test_council_tracks_metrics(
        self,
        sample_workflow_state: WorkflowState,
        mock_council_state: CouncilState,
    ) -> None:
        """Test that council metrics are tracked in metadata."""
        with patch("src.agents.council_node.CodeReviewCouncil") as MockCouncil:
            mock_instance = MagicMock()
            mock_instance.convene = AsyncMock(return_value=mock_council_state)
            MockCouncil.return_value = mock_instance

            result = await council_reviewer_node(sample_workflow_state)

            council_review = result["metadata"]["council_review"]

            # Check metrics are present
            assert "deliberation_time_ms" in council_review
            assert "total_cost_usd" in council_review
            assert "judge_count" in council_review
            assert "llm_mode" in council_review

            # Check judge details (stored at metadata level, not under council_review)
            judge_verdicts = result["metadata"]["judge_verdicts"]
            assert len(judge_verdicts) == 3

            for _judge_name, judge in judge_verdicts.items():
                assert "judge_name" in judge
                assert "verdict" in judge
                assert "confidence" in judge
                assert "tokens_used" in judge

    @pytest.mark.asyncio
    async def test_council_handles_error_propagation(
        self,
        sample_workflow_state: WorkflowState,
    ) -> None:
        """Test that council errors propagate correctly.

        Note: The council_reviewer_node does not have internal error handling.
        Errors from the council are expected to propagate up to the workflow
        level for handling.
        """
        with patch("src.agents.council_node.CodeReviewCouncil") as MockCouncil:
            mock_instance = MagicMock()
            mock_instance.convene = AsyncMock(side_effect=Exception("API Error"))
            MockCouncil.return_value = mock_instance

            # Errors propagate up - workflow handles them
            with pytest.raises(Exception, match="API Error"):
                await council_reviewer_node(sample_workflow_state)


class TestCouncilConfigIntegration:
    """Integration tests for council configuration."""

    def test_local_config_creates_valid_council(self) -> None:
        """Test that local config creates a valid council."""
        config = CouncilConfig.default_local()
        council = CodeReviewCouncil(config=config)

        assert len(council.config.judges) == 3
        assert council.config.parallel_execution is True

    def test_cloud_config_creates_valid_council(self) -> None:
        """Test that cloud config creates a valid council."""
        config = CouncilConfig.default_cloud()
        council = CodeReviewCouncil(config=config)

        assert len(council.config.judges) == 3
        # Cloud config should have different model tiers
        tiers = {j.model_tier for j in council.config.judges}
        assert len(tiers) > 1  # Multiple different tiers

    def test_custom_config_with_two_judges(self) -> None:
        """Test custom config with two judges."""
        config = CouncilConfig(
            judges=[
                JudgeConfig(
                    name="judge1",
                    persona="Expert 1",
                    system_prompt="Review code for security",
                    model_tier="sonnet",
                    weight=0.5,
                ),
                JudgeConfig(
                    name="judge2",
                    persona="Expert 2",
                    system_prompt="Review code for performance",
                    model_tier="haiku",
                    weight=0.5,
                ),
            ],
            aggregation_method="majority",
            confidence_threshold=0.6,
        )
        council = CodeReviewCouncil(config=config)

        assert len(council.config.judges) == 2
        assert council.config.confidence_threshold == 0.6


class TestCouncilVerdictAggregationIntegration:
    """Integration tests for verdict aggregation scenarios."""

    @pytest.fixture
    def council(self) -> CodeReviewCouncil:
        """Create council with default local config."""
        return CodeReviewCouncil(config=CouncilConfig.default_local())

    def test_mixed_verdicts_with_low_threshold(self, council: CodeReviewCouncil) -> None:
        """Test majority verdict with weighted confidence threshold.

        With default config (confidence_threshold=0.7):
        - Weights: security=0.35, performance=0.30, maintainability=0.35
        - Max APPROVE score with 2 judges = 0.35 + 0.30 = 0.65 < 0.7
        - So APPROVE is downgraded to REVISE due to insufficient confidence
        """
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=1.0,
                issues=[],
                reasoning="Secure",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=1.0,
                issues=[],
                reasoning="Fast",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="REVISE",
                confidence=0.6,
                issues=[],
                reasoning="Needs cleanup",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        # APPROVE weighted score = 0.35*1.0 + 0.30*1.0 = 0.65 < 0.7 threshold
        # So APPROVE is downgraded to REVISE
        assert final_verdict == "REVISE"
        assert consensus_type == "dissent"
        assert "maintainability_judge" in dissenting

    def test_all_different_verdicts_uses_weighted(self, council: CodeReviewCouncil) -> None:
        """Test weighted voting when all verdicts differ."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="REJECT",
                confidence=0.9,
                issues=[],
                reasoning="Critical flaw",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.7,
                issues=[],
                reasoning="Good enough",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "maintainability_judge": JudgeVerdictState(
                judge_name="maintainability_judge",
                persona="Maintainability Expert",
                model_tier="local",
                verdict="REVISE",
                confidence=0.8,
                issues=[],
                reasoning="Needs work",
                strengths=[],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        final_verdict, confidence, consensus_type, dissenting = council._aggregate_verdicts(
            verdicts
        )

        # REJECT should be downgraded to REVISE (not unanimous)
        assert final_verdict in ["REVISE", "APPROVE"]
        assert len(dissenting) >= 1


class TestCouncilConclusionBuilding:
    """Integration tests for conclusion generation."""

    @pytest.fixture
    def council(self) -> CodeReviewCouncil:
        """Create council with default config."""
        return CodeReviewCouncil(config=CouncilConfig.default_local())

    def test_conclusion_includes_all_judges(self, council: CodeReviewCouncil) -> None:
        """Test that conclusion includes all judge summaries."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.9,
                issues=[],
                reasoning="Code is secure",
                strengths=["Good validation"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
            "performance_judge": JudgeVerdictState(
                judge_name="performance_judge",
                persona="Performance Expert",
                model_tier="local",
                verdict="APPROVE",
                confidence=0.85,
                issues=[],
                reasoning="Code is fast",
                strengths=["Efficient"],
                action_items=[],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        conclusion = council._build_conclusion(verdicts, "APPROVE", 0.87, "unanimous")

        assert "Security Expert" in conclusion
        assert "Performance Expert" in conclusion
        assert "APPROVE" in conclusion
        assert "87%" in conclusion

    def test_conclusion_includes_issues(self, council: CodeReviewCouncil) -> None:
        """Test that conclusion includes issue counts."""
        verdicts: dict[str, JudgeVerdictState] = {
            "security_judge": JudgeVerdictState(
                judge_name="security_judge",
                persona="Security Expert",
                model_tier="local",
                verdict="REVISE",
                confidence=0.7,
                issues=[
                    {
                        "severity": "critical",
                        "category": "security",
                        "description": "SQL injection",
                    },
                    {"severity": "major", "category": "security", "description": "No validation"},
                ],
                reasoning="Security issues found",
                strengths=[],
                action_items=["Fix SQL injection"],
                tokens_used=100,
                latency_ms=500,
                cost_usd=0.0,
            ),
        }

        conclusion = council._build_conclusion(verdicts, "REVISE", 0.7, "unanimous")

        assert "Critical" in conclusion
        assert "Major" in conclusion
        assert "2 total" in conclusion
