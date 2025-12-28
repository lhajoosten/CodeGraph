"""Service for querying execution history and metrics.

This module provides comprehensive queries for task execution history,
timeline visualization, and council review data. It builds on the
AgentRunService for more complex history and analytics queries.

Features:
- Complete execution timeline with all events
- User execution history with filtering and pagination
- Council review history and metrics
- Aggregate statistics and performance data

Usage:
    service = ExecutionHistoryService(db_session)
    history = await service.get_task_history(task_id)
    timeline = await service.get_execution_timeline(task_id)
    council_reviews = await service.get_council_review_history(task_id)
"""

from datetime import datetime
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.logging import get_logger
from src.models.agent_run import AgentRun, AgentRunStatus, AgentType
from src.models.council_review import (
    ConsensusType,
    CouncilReview,
    ReviewVerdict,
)
from src.models.task import Task

logger = get_logger(__name__)


class ExecutionHistoryService:
    """Service for querying execution history and metrics."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with a database session.

        Args:
            db: Async database session
        """
        self.db = db

    async def get_task_history(
        self,
        task_id: int,
        include_council: bool = True,
    ) -> dict[str, Any]:
        """Get complete execution history for a task.

        Returns a comprehensive view of all agent runs, including timing,
        tokens, costs, and optionally council review data.

        Args:
            task_id: ID of the task
            include_council: Whether to include council review details

        Returns:
            Complete task execution history
        """
        # Get task with agent runs
        task_query = select(Task).where(Task.id == task_id).options(selectinload(Task.agent_runs))
        task_result = await self.db.execute(task_query)
        task = task_result.scalar_one_or_none()

        if not task:
            return {"task_id": task_id, "error": "Task not found"}

        # Get agent runs ordered by creation time
        runs_query = (
            select(AgentRun).where(AgentRun.task_id == task_id).order_by(AgentRun.created_at)
        )
        runs_result = await self.db.execute(runs_query)
        runs = list(runs_result.scalars().all())

        # Build run history
        run_history = []
        total_tokens = 0
        total_cost = 0.0
        total_duration_ms = 0

        for run in runs:
            duration_ms = None
            if run.started_at and run.completed_at:
                duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
                total_duration_ms += duration_ms

            tokens = run.tokens_used or 0
            total_tokens += tokens

            cost = run.cost_usd or 0.0
            total_cost += cost

            run_data = {
                "id": run.id,
                "agent_type": run.agent_type.value,
                "status": run.status.value,
                "iteration": run.iteration,
                "model_used": run.model_used,
                "model_tier": run.model_tier,
                "tokens_used": tokens,
                "input_tokens": run.input_tokens,
                "output_tokens": run.output_tokens,
                "cost_usd": cost,
                "duration_ms": duration_ms,
                "first_token_latency_ms": run.first_token_latency_ms,
                "total_latency_ms": run.total_latency_ms,
                "code_quality_score": run.code_quality_score,
                "lint_warning_count": run.lint_warning_count,
                "verdict": run.verdict,
                "error_message": run.error_message,
                "started_at": run.started_at.isoformat() if run.started_at else None,
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            }
            run_history.append(run_data)

        # Get council reviews if requested
        council_reviews = []
        if include_council:
            council_query = (
                select(CouncilReview)
                .where(CouncilReview.task_id == task_id)
                .options(selectinload(CouncilReview.judge_verdicts))
                .order_by(CouncilReview.reviewed_at)
            )
            council_result = await self.db.execute(council_query)
            councils = list(council_result.scalars().all())

            for council in councils:
                council_data = {
                    "id": council.id,
                    "final_verdict": council.final_verdict.value,
                    "consensus_type": council.consensus_type.value,
                    "confidence_score": council.confidence_score,
                    "deliberation_time_ms": council.deliberation_time_ms,
                    "total_cost_usd": council.total_cost_usd,
                    "llm_mode": council.llm_mode.value,
                    "total_issues": council.total_issues,
                    "critical_issues": council.critical_issues,
                    "major_issues": council.major_issues,
                    "reviewed_at": council.reviewed_at.isoformat(),
                    "judge_verdicts": [
                        {
                            "judge_name": jv.judge_name,
                            "persona": jv.persona,
                            "verdict": jv.verdict.value,
                            "confidence": jv.confidence,
                            "issue_count": len(jv.issues_found or []),
                            "tokens_used": jv.total_tokens,
                            "latency_ms": jv.latency_ms,
                            "cost_usd": jv.cost_usd,
                        }
                        for jv in council.judge_verdicts
                    ],
                }
                council_reviews.append(council_data)

        # Determine final status
        final_status = "pending"
        if runs:
            latest = runs[-1]
            if latest.status == AgentRunStatus.COMPLETED:
                if latest.agent_type == AgentType.REVIEWER:
                    final_status = "complete"
                else:
                    final_status = "in_progress"
            elif latest.status == AgentRunStatus.RUNNING:
                final_status = "running"
            elif latest.status == AgentRunStatus.FAILED:
                final_status = "failed"
            elif latest.status == AgentRunStatus.TIMEOUT:
                final_status = "timeout"

        return {
            "task_id": task_id,
            "title": task.title,
            "status": final_status,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "summary": {
                "total_runs": len(runs),
                "total_tokens": total_tokens,
                "total_cost_usd": total_cost,
                "total_duration_ms": total_duration_ms,
                "iterations": max((r.iteration for r in runs), default=1),
            },
            "runs": run_history,
            "council_reviews": council_reviews if include_council else None,
        }

    async def get_user_execution_history(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        status_filter: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict[str, Any]:
        """Get paginated execution history for a user.

        Args:
            user_id: ID of the user
            page: Page number (1-indexed)
            page_size: Number of items per page
            status_filter: Optional filter by task status
            date_from: Optional start date filter
            date_to: Optional end date filter

        Returns:
            Paginated task execution history
        """
        # Base query for user's tasks
        query = select(Task).where(Task.user_id == user_id)

        # Apply filters
        if status_filter:
            query = query.where(Task.status == status_filter)
        if date_from:
            query = query.where(Task.created_at >= date_from)
        if date_to:
            query = query.where(Task.created_at <= date_to)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results
        query = query.order_by(desc(Task.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.options(selectinload(Task.agent_runs))

        result = await self.db.execute(query)
        tasks = list(result.scalars().all())

        items = []
        for task in tasks:
            # Calculate task metrics
            total_tokens = sum(r.tokens_used or 0 for r in task.agent_runs)
            total_cost = sum(r.cost_usd or 0.0 for r in task.agent_runs)
            latest_run = max(task.agent_runs, key=lambda r: r.created_at, default=None)

            items.append(
                {
                    "id": task.id,
                    "title": task.title,
                    "status": task.status.value,
                    "created_at": task.created_at.isoformat(),
                    "updated_at": task.updated_at.isoformat(),
                    "agent_runs_count": len(task.agent_runs),
                    "total_tokens": total_tokens,
                    "total_cost_usd": total_cost,
                    "latest_agent": latest_run.agent_type.value if latest_run else None,
                    "latest_verdict": latest_run.verdict if latest_run else None,
                }
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }

    async def get_execution_timeline(
        self,
        task_id: int,
    ) -> list[dict[str, Any]]:
        """Get detailed execution timeline for visualization.

        Returns a chronological list of all events during task execution,
        suitable for timeline visualization in the frontend.

        Args:
            task_id: ID of the task

        Returns:
            List of timeline events
        """
        events: list[dict[str, Any]] = []

        # Get agent runs
        runs_query = (
            select(AgentRun).where(AgentRun.task_id == task_id).order_by(AgentRun.created_at)
        )
        runs_result = await self.db.execute(runs_query)
        runs = list(runs_result.scalars().all())

        for run in runs:
            # Start event
            if run.started_at:
                events.append(
                    {
                        "timestamp": run.started_at.isoformat(),
                        "event_type": "agent_start",
                        "agent_type": run.agent_type.value,
                        "iteration": run.iteration,
                        "data": {
                            "run_id": run.id,
                            "model_used": run.model_used,
                            "model_tier": run.model_tier,
                        },
                    }
                )

            # Completion/failure event
            if run.completed_at:
                event_type = "agent_complete"
                if run.status == AgentRunStatus.FAILED:
                    event_type = "agent_failed"
                elif run.status == AgentRunStatus.TIMEOUT:
                    event_type = "agent_timeout"

                events.append(
                    {
                        "timestamp": run.completed_at.isoformat(),
                        "event_type": event_type,
                        "agent_type": run.agent_type.value,
                        "iteration": run.iteration,
                        "data": {
                            "run_id": run.id,
                            "status": run.status.value,
                            "tokens_used": run.tokens_used,
                            "verdict": run.verdict,
                            "error_message": run.error_message,
                            "duration_ms": run.total_latency_ms,
                        },
                    }
                )

        # Get council reviews
        council_query = (
            select(CouncilReview)
            .where(CouncilReview.task_id == task_id)
            .options(selectinload(CouncilReview.judge_verdicts))
            .order_by(CouncilReview.reviewed_at)
        )
        council_result = await self.db.execute(council_query)
        councils = list(council_result.scalars().all())

        for council in councils:
            # Add judge verdict events
            for jv in council.judge_verdicts:
                if jv.judged_at:
                    events.append(
                        {
                            "timestamp": jv.judged_at.isoformat(),
                            "event_type": "judge_verdict",
                            "agent_type": "reviewer",
                            "iteration": 1,
                            "data": {
                                "council_review_id": council.id,
                                "judge_name": jv.judge_name,
                                "persona": jv.persona,
                                "verdict": jv.verdict.value,
                                "confidence": jv.confidence,
                                "issue_count": len(jv.issues_found or []),
                            },
                        }
                    )

            # Council decision event
            events.append(
                {
                    "timestamp": council.reviewed_at.isoformat(),
                    "event_type": "council_decision",
                    "agent_type": "reviewer",
                    "iteration": 1,
                    "data": {
                        "council_review_id": council.id,
                        "final_verdict": council.final_verdict.value,
                        "consensus_type": council.consensus_type.value,
                        "confidence_score": council.confidence_score,
                        "total_issues": council.total_issues,
                        "deliberation_time_ms": council.deliberation_time_ms,
                    },
                }
            )

        # Sort all events by timestamp
        events.sort(key=lambda e: e["timestamp"])

        return events

    async def get_council_review_history(
        self,
        task_id: int | None = None,
        user_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """Get council review history with filtering.

        Args:
            task_id: Optional filter by task ID
            user_id: Optional filter by user ID (via task ownership)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Paginated council review history
        """
        # Base query
        query = select(CouncilReview)

        if task_id:
            query = query.where(CouncilReview.task_id == task_id)

        if user_id:
            query = query.join(Task).where(Task.user_id == user_id)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results with judge verdicts
        query = query.order_by(desc(CouncilReview.reviewed_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.options(selectinload(CouncilReview.judge_verdicts))

        result = await self.db.execute(query)
        reviews = list(result.scalars().all())

        items = []
        for review in reviews:
            items.append(
                {
                    "id": review.id,
                    "task_id": review.task_id,
                    "final_verdict": review.final_verdict.value,
                    "consensus_type": review.consensus_type.value,
                    "confidence_score": review.confidence_score,
                    "judge_count": len(review.judge_verdicts),
                    "total_issues": review.total_issues,
                    "critical_issues": review.critical_issues,
                    "deliberation_time_ms": review.deliberation_time_ms,
                    "total_cost_usd": review.total_cost_usd,
                    "llm_mode": review.llm_mode.value,
                    "reviewed_at": review.reviewed_at.isoformat(),
                }
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }

    async def get_council_metrics(
        self,
        user_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict[str, Any]:
        """Get aggregate metrics for council reviews.

        Args:
            user_id: Optional filter by user ID
            date_from: Optional start date filter
            date_to: Optional end date filter

        Returns:
            Aggregate council review metrics
        """
        # Base query
        query = select(CouncilReview)

        if user_id:
            query = query.join(Task).where(Task.user_id == user_id)
        if date_from:
            query = query.where(CouncilReview.reviewed_at >= date_from)
        if date_to:
            query = query.where(CouncilReview.reviewed_at <= date_to)

        query = query.options(selectinload(CouncilReview.judge_verdicts))

        result = await self.db.execute(query)
        reviews = list(result.scalars().all())

        if not reviews:
            return {
                "total_reviews": 0,
                "approved_count": 0,
                "revised_count": 0,
                "rejected_count": 0,
                "average_confidence": 0.0,
                "average_deliberation_ms": 0,
                "total_cost_usd": 0.0,
                "consensus_breakdown": {},
                "judge_performance": {},
            }

        # Calculate metrics
        approved = sum(1 for r in reviews if r.final_verdict == ReviewVerdict.APPROVE)
        revised = sum(1 for r in reviews if r.final_verdict == ReviewVerdict.REVISE)
        rejected = sum(1 for r in reviews if r.final_verdict == ReviewVerdict.REJECT)

        avg_confidence = sum(r.confidence_score for r in reviews) / len(reviews)
        avg_deliberation = sum(r.deliberation_time_ms for r in reviews) // len(reviews)
        total_cost = sum(r.total_cost_usd for r in reviews)

        # Consensus breakdown
        consensus_breakdown = {
            "unanimous": sum(1 for r in reviews if r.consensus_type == ConsensusType.UNANIMOUS),
            "majority": sum(1 for r in reviews if r.consensus_type == ConsensusType.MAJORITY),
            "tie_broken": sum(1 for r in reviews if r.consensus_type == ConsensusType.TIE_BROKEN),
            "dissent": sum(1 for r in reviews if r.consensus_type == ConsensusType.DISSENT),
        }

        # Judge performance
        judge_stats: dict[str, dict[str, Any]] = {}
        for review in reviews:
            for jv in review.judge_verdicts:
                if jv.judge_name not in judge_stats:
                    judge_stats[jv.judge_name] = {
                        "persona": jv.persona,
                        "total_reviews": 0,
                        "approve_count": 0,
                        "revise_count": 0,
                        "reject_count": 0,
                        "avg_confidence": 0.0,
                        "avg_latency_ms": 0,
                        "total_issues_found": 0,
                        "total_tokens": 0,
                        "total_cost_usd": 0.0,
                    }

                stats = judge_stats[jv.judge_name]
                stats["total_reviews"] += 1
                if jv.verdict == ReviewVerdict.APPROVE:
                    stats["approve_count"] += 1
                elif jv.verdict == ReviewVerdict.REVISE:
                    stats["revise_count"] += 1
                elif jv.verdict == ReviewVerdict.REJECT:
                    stats["reject_count"] += 1
                stats["avg_confidence"] += jv.confidence
                stats["avg_latency_ms"] += jv.latency_ms
                stats["total_issues_found"] += len(jv.issues_found or [])
                stats["total_tokens"] += jv.total_tokens
                stats["total_cost_usd"] += jv.cost_usd

        # Normalize averages
        for stats in judge_stats.values():
            if stats["total_reviews"] > 0:
                stats["avg_confidence"] /= stats["total_reviews"]
                stats["avg_latency_ms"] //= stats["total_reviews"]

        return {
            "total_reviews": len(reviews),
            "approved_count": approved,
            "revised_count": revised,
            "rejected_count": rejected,
            "average_confidence": avg_confidence,
            "average_deliberation_ms": avg_deliberation,
            "total_cost_usd": total_cost,
            "consensus_breakdown": consensus_breakdown,
            "judge_performance": judge_stats,
        }
