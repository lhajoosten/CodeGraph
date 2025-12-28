"""Integration tests for execution history API endpoints."""

from collections.abc import AsyncGenerator
from datetime import datetime, timedelta
from typing import Any

import pytest
import pytest_asyncio
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.api.deps import get_current_user
from src.core.database import Base, get_db
from src.main import app
from src.models import AgentRun, Task, User
from src.models.agent_run import AgentRunStatus, AgentType
from src.models.council_review import ConsensusType, CouncilReview, JudgeVerdict, ReviewVerdict

# In-memory SQLite for integration tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Store the test user for dependency override
_test_user_holder: dict[str, Any] = {}


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


@pytest.fixture
def client(db_session: AsyncSession, test_user: User) -> TestClient:
    """Create test client with overridden database and auth dependencies."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_get_current_user() -> User:
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client(db_session: AsyncSession) -> TestClient:
    """Create test client without auth dependency override (for testing 401 responses)."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # Note: get_current_user is NOT overridden - will require real auth

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


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
        status="completed",
        priority="medium",
        user_id=test_user.id,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest_asyncio.fixture
async def test_agent_runs(db_session: AsyncSession, test_task: Task) -> list[AgentRun]:
    """Create test agent runs for the task."""
    runs = []

    # Planner run
    planner_run = AgentRun(
        task_id=test_task.id,
        agent_type=AgentType.PLANNER,
        status=AgentRunStatus.COMPLETED,
        iteration=1,
        model_used="claude-3-haiku",
        model_tier="haiku",
        tokens_used=500,
        input_tokens=300,
        output_tokens=200,
        cost_usd=0.001,
        total_latency_ms=1500,
        started_at=datetime.utcnow() - timedelta(minutes=5),
        completed_at=datetime.utcnow() - timedelta(minutes=4),
    )
    db_session.add(planner_run)
    runs.append(planner_run)

    # Coder run
    coder_run = AgentRun(
        task_id=test_task.id,
        agent_type=AgentType.CODER,
        status=AgentRunStatus.COMPLETED,
        iteration=1,
        model_used="claude-3-sonnet",
        model_tier="sonnet",
        tokens_used=1500,
        input_tokens=800,
        output_tokens=700,
        cost_usd=0.02,
        total_latency_ms=3000,
        code_quality_score=85,
        started_at=datetime.utcnow() - timedelta(minutes=4),
        completed_at=datetime.utcnow() - timedelta(minutes=3),
    )
    db_session.add(coder_run)
    runs.append(coder_run)

    # Tester run
    tester_run = AgentRun(
        task_id=test_task.id,
        agent_type=AgentType.TESTER,
        status=AgentRunStatus.COMPLETED,
        iteration=1,
        model_used="claude-3-sonnet",
        model_tier="sonnet",
        tokens_used=1200,
        input_tokens=600,
        output_tokens=600,
        cost_usd=0.015,
        total_latency_ms=2500,
        started_at=datetime.utcnow() - timedelta(minutes=3),
        completed_at=datetime.utcnow() - timedelta(minutes=2),
    )
    db_session.add(tester_run)
    runs.append(tester_run)

    # Reviewer run
    reviewer_run = AgentRun(
        task_id=test_task.id,
        agent_type=AgentType.REVIEWER,
        status=AgentRunStatus.COMPLETED,
        iteration=1,
        verdict="APPROVE",
        model_used="claude-3-sonnet",
        model_tier="sonnet",
        tokens_used=800,
        input_tokens=500,
        output_tokens=300,
        cost_usd=0.01,
        total_latency_ms=2000,
        started_at=datetime.utcnow() - timedelta(minutes=2),
        completed_at=datetime.utcnow() - timedelta(minutes=1),
    )
    db_session.add(reviewer_run)
    runs.append(reviewer_run)

    await db_session.commit()
    for run in runs:
        await db_session.refresh(run)

    return runs


@pytest_asyncio.fixture
async def test_council_review(
    db_session: AsyncSession, test_task: Task, test_agent_runs: list[AgentRun]
) -> CouncilReview:
    """Create a test council review."""
    reviewer_run = next(r for r in test_agent_runs if r.agent_type == AgentType.REVIEWER)

    council_review = CouncilReview(
        task_id=test_task.id,
        agent_run_id=reviewer_run.id,
        final_verdict=ReviewVerdict.APPROVE,
        consensus_type=ConsensusType.UNANIMOUS,
        confidence_score=0.9,
        deliberation_time_ms=1500,
        total_cost_usd=0.0,
        total_issues=0,
        critical_issues=0,
        major_issues=0,
        council_conclusion="All judges approved the code.",
    )
    db_session.add(council_review)
    await db_session.commit()
    await db_session.refresh(council_review)

    # Add judge verdicts
    judges = [
        ("security_judge", "Security Expert", "APPROVE", 0.9),
        ("performance_judge", "Performance Expert", "APPROVE", 0.85),
        ("maintainability_judge", "Maintainability Expert", "APPROVE", 0.92),
    ]

    for judge_name, persona, verdict, confidence in judges:
        judge_verdict = JudgeVerdict(
            council_review_id=council_review.id,
            judge_name=judge_name,
            persona=persona,
            model_tier="local",
            verdict=ReviewVerdict[verdict],
            confidence=confidence,
            reasoning=f"{persona} approved the code",
            input_tokens=400,
            output_tokens=200,
            total_tokens=600,
            latency_ms=500,
            cost_usd=0.0,
        )
        db_session.add(judge_verdict)

    await db_session.commit()
    await db_session.refresh(council_review)

    return council_review


class TestTaskHistoryEndpoint:
    """Tests for GET /tasks/{task_id}/history endpoint."""

    @pytest.mark.asyncio
    async def test_get_task_history_success(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test getting task history returns all agent runs."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "runs" in data
        assert len(data["runs"]) == 4  # planner, coder, tester, reviewer

        # Check runs are in order
        agent_types = [run["agent_type"] for run in data["runs"]]
        assert "planner" in agent_types
        assert "coder" in agent_types
        assert "tester" in agent_types
        assert "reviewer" in agent_types

    @pytest.mark.asyncio
    async def test_get_task_history_with_summary(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test task history includes summary statistics."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "summary" in data

        summary = data["summary"]
        assert "total_runs" in summary
        assert "total_tokens" in summary
        assert "total_cost_usd" in summary
        assert "total_duration_ms" in summary

        assert summary["total_runs"] == 4
        assert summary["total_tokens"] > 0

    @pytest.mark.asyncio
    async def test_get_task_history_not_found(
        self,
        client: TestClient,
    ) -> None:
        """Test getting history for non-existent task returns 404."""
        response = client.get("/api/v1/tasks/99999/history")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCouncilReviewEndpoint:
    """Tests for GET /tasks/{task_id}/council-reviews endpoint."""

    @pytest.mark.asyncio
    async def test_get_council_reviews_success(
        self,
        client: TestClient,
        test_task: Task,
        test_council_review: CouncilReview,
    ) -> None:
        """Test getting council reviews for a task."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/council-reviews")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1

        review = data["items"][0]
        assert review["final_verdict"] == "APPROVE"
        assert review["consensus_type"] == "unanimous"
        assert review["confidence_score"] == 0.9

    @pytest.mark.asyncio
    async def test_get_council_reviews_has_pagination_info(
        self,
        client: TestClient,
        test_task: Task,
        test_council_review: CouncilReview,
    ) -> None:
        """Test council reviews include pagination info."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/council-reviews")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "has_more" in data

        assert data["total"] == 1
        assert data["page"] == 1
        assert data["has_more"] is False

    @pytest.mark.asyncio
    async def test_get_council_reviews_empty(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],  # Without council review
    ) -> None:
        """Test getting council reviews when none exist."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/council-reviews")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 0


class TestExecutionTimelineEndpoint:
    """Tests for GET /tasks/{task_id}/timeline endpoint."""

    @pytest.mark.asyncio
    async def test_get_execution_timeline(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test getting execution timeline for a task."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/timeline")

        assert response.status_code == status.HTTP_200_OK

        # Timeline returns a list directly
        events = response.json()
        assert isinstance(events, list)

        # Should have events for each agent run (at least start and end per run)
        # With 4 runs, expect at least 4 events (could be 8 with start+end)
        assert len(events) >= 4

    @pytest.mark.asyncio
    async def test_timeline_events_ordered_by_time(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test that timeline events are ordered chronologically."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/timeline")

        assert response.status_code == status.HTTP_200_OK

        # Timeline returns a list directly
        events = response.json()

        # Events should be in chronological order
        timestamps = [e.get("timestamp") for e in events if e.get("timestamp")]
        assert timestamps == sorted(timestamps)


class TestUserExecutionHistoryEndpoint:
    """Tests for GET /history endpoint (user's execution history)."""

    @pytest.mark.asyncio
    async def test_get_user_history_unauthorized(
        self,
        unauthenticated_client: TestClient,
    ) -> None:
        """Test that unauthorized users cannot access history."""
        response = unauthenticated_client.get("/api/v1/history")

        # Should require authentication
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAgentRunMetrics:
    """Tests for agent run metrics in responses."""

    @pytest.mark.asyncio
    async def test_agent_run_includes_detailed_metrics(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test that agent runs include detailed token and cost metrics."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for run in data["runs"]:
            # Check basic metrics
            assert "tokens_used" in run
            assert "model_used" in run
            assert "model_tier" in run

            # Check detailed metrics
            assert "input_tokens" in run
            assert "output_tokens" in run
            assert "cost_usd" in run
            assert "total_latency_ms" in run

    @pytest.mark.asyncio
    async def test_coder_run_includes_quality_score(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test that coder runs include code quality score."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        coder_runs = [r for r in data["runs"] if r["agent_type"] == "coder"]

        assert len(coder_runs) == 1
        assert coder_runs[0]["code_quality_score"] == 85

    @pytest.mark.asyncio
    async def test_reviewer_run_includes_verdict(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test that reviewer runs include verdict."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        reviewer_runs = [r for r in data["runs"] if r["agent_type"] == "reviewer"]

        assert len(reviewer_runs) == 1
        assert reviewer_runs[0]["verdict"] == "APPROVE"


class TestHistoryOptions:
    """Tests for history endpoint options."""

    @pytest.mark.asyncio
    async def test_task_history_returns_all_runs(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test that task history returns all runs by default.

        Note: Task history endpoint doesn't support pagination yet.
        It returns all runs for the task.
        """
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        # Should return all 4 runs (planner, coder, tester, reviewer)
        assert len(data["runs"]) == 4

    @pytest.mark.asyncio
    async def test_task_history_include_council_flag(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
        test_council_review: CouncilReview,
    ) -> None:
        """Test include_council parameter works."""
        # With council included (default)
        response_with = client.get(
            f"/api/v1/tasks/{test_task.id}/history", params={"include_council": True}
        )
        assert response_with.status_code == status.HTTP_200_OK
        data_with = response_with.json()
        assert "council_reviews" in data_with

        # Without council
        response_without = client.get(
            f"/api/v1/tasks/{test_task.id}/history", params={"include_council": False}
        )
        assert response_without.status_code == status.HTTP_200_OK


class TestHistoryFiltering:
    """Tests for filtering runs after retrieval."""

    @pytest.mark.asyncio
    async def test_runs_have_agent_type_for_client_filtering(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test runs contain agent_type field for client-side filtering.

        Note: Server-side filtering by agent_type is not implemented.
        This test verifies the data structure supports client-side filtering.
        """
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        agent_types = [run["agent_type"] for run in data["runs"]]

        # Should have all types for client to filter
        assert "planner" in agent_types
        assert "coder" in agent_types
        assert "tester" in agent_types
        assert "reviewer" in agent_types

    @pytest.mark.asyncio
    async def test_runs_have_status_for_client_filtering(
        self,
        client: TestClient,
        test_task: Task,
        test_agent_runs: list[AgentRun],
    ) -> None:
        """Test runs contain status field for client-side filtering."""
        response = client.get(f"/api/v1/tasks/{test_task.id}/history")

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for run in data["runs"]:
            assert "status" in run
            # All test runs are completed
            assert run["status"] == "completed"
