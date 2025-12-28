"""Service for tracking and querying usage metrics.

This module provides functionality for recording token usage during agent executions
and querying aggregated metrics for analytics dashboards.

Usage:
    service = MetricsService(db_session)

    # Record metrics after an LLM call
    await service.record_usage(
        task_id=1,
        agent_type=AgentType.PLANNER,
        input_tokens=1500,
        output_tokens=500,
        model_used="Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        latency_ms=2500,
    )

    # Get metrics summary for a task
    summary = await service.get_task_metrics(task_id=1)
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.agent_run import AgentType
from src.models.usage_metrics import UsageMetrics

logger = get_logger(__name__)


@dataclass
class AgentMetricsSummary:
    """Summary of metrics for a specific agent type."""

    agent_type: str
    total_runs: int
    total_tokens: int
    input_tokens: int
    output_tokens: int
    avg_tokens_per_run: float
    avg_latency_ms: float


@dataclass
class TaskMetricsSummary:
    """Summary of metrics for a task."""

    task_id: int
    total_tokens: int
    input_tokens: int
    output_tokens: int
    total_runs: int
    total_latency_ms: int
    by_agent: dict[str, AgentMetricsSummary]


@dataclass
class PeriodMetricsSummary:
    """Summary of metrics for a time period."""

    period: str
    start_date: datetime
    end_date: datetime
    total_tokens: int
    input_tokens: int
    output_tokens: int
    total_runs: int
    total_latency_ms: int
    by_agent: dict[str, AgentMetricsSummary]
    models_used: dict[str, int]


class MetricsService:
    """Service for managing usage metrics."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with a database session.

        Args:
            db: Async database session
        """
        self.db = db

    async def record_usage(
        self,
        task_id: int,
        agent_type: AgentType,
        input_tokens: int,
        output_tokens: int,
        model_used: str,
        latency_ms: int,
        agent_run_id: int | None = None,
    ) -> UsageMetrics:
        """Record usage metrics for an LLM call.

        Args:
            task_id: ID of the task being processed
            agent_type: Type of agent that made the call
            input_tokens: Number of input/prompt tokens
            output_tokens: Number of output/completion tokens
            model_used: Name of the model used
            latency_ms: Time taken for the LLM call in milliseconds
            agent_run_id: Optional ID of the associated AgentRun

        Returns:
            Created UsageMetrics record
        """
        total_tokens = input_tokens + output_tokens

        metrics = UsageMetrics(
            task_id=task_id,
            agent_run_id=agent_run_id,
            agent_type=agent_type,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            model_used=model_used,
            latency_ms=latency_ms,
            recorded_at=datetime.now(UTC),
        )
        self.db.add(metrics)
        await self.db.flush()

        logger.info(
            "Recorded usage metrics",
            metrics_id=metrics.id,
            task_id=task_id,
            agent_type=agent_type.value,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
        )

        return metrics

    async def get_task_metrics(self, task_id: int) -> TaskMetricsSummary:
        """Get aggregated metrics for a task.

        Args:
            task_id: ID of the task

        Returns:
            TaskMetricsSummary with totals and per-agent breakdown
        """
        query = select(UsageMetrics).where(UsageMetrics.task_id == task_id)
        result = await self.db.execute(query)
        metrics = list(result.scalars().all())

        if not metrics:
            return TaskMetricsSummary(
                task_id=task_id,
                total_tokens=0,
                input_tokens=0,
                output_tokens=0,
                total_runs=0,
                total_latency_ms=0,
                by_agent={},
            )

        # Aggregate by agent type
        by_agent: dict[str, dict[str, Any]] = {}
        total_tokens = 0
        input_tokens = 0
        output_tokens = 0
        total_latency = 0

        for m in metrics:
            agent_key = m.agent_type.value
            if agent_key not in by_agent:
                by_agent[agent_key] = {
                    "runs": 0,
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_latency": 0,
                }

            by_agent[agent_key]["runs"] += 1
            by_agent[agent_key]["total_tokens"] += m.total_tokens
            by_agent[agent_key]["input_tokens"] += m.input_tokens
            by_agent[agent_key]["output_tokens"] += m.output_tokens
            by_agent[agent_key]["total_latency"] += m.latency_ms

            total_tokens += m.total_tokens
            input_tokens += m.input_tokens
            output_tokens += m.output_tokens
            total_latency += m.latency_ms

        # Convert to AgentMetricsSummary
        agent_summaries = {}
        for agent_type, data in by_agent.items():
            runs = data["runs"]
            agent_summaries[agent_type] = AgentMetricsSummary(
                agent_type=agent_type,
                total_runs=runs,
                total_tokens=data["total_tokens"],
                input_tokens=data["input_tokens"],
                output_tokens=data["output_tokens"],
                avg_tokens_per_run=data["total_tokens"] / runs if runs > 0 else 0,
                avg_latency_ms=data["total_latency"] / runs if runs > 0 else 0,
            )

        return TaskMetricsSummary(
            task_id=task_id,
            total_tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_runs=len(metrics),
            total_latency_ms=total_latency,
            by_agent=agent_summaries,
        )

    async def get_metrics_for_period(
        self,
        period: str = "30d",
        user_id: int | None = None,
    ) -> PeriodMetricsSummary:
        """Get aggregated metrics for a time period.

        Args:
            period: Time period string ("24h", "7d", "30d", "all")
            user_id: Optional user ID to filter by

        Returns:
            PeriodMetricsSummary with totals and breakdowns
        """
        # Calculate date range
        now = datetime.now(UTC)
        if period == "24h":
            start_date = now - timedelta(hours=24)
        elif period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "all":
            start_date = datetime.min.replace(tzinfo=UTC)
        else:
            start_date = now - timedelta(days=30)

        # Build query
        query = select(UsageMetrics).where(UsageMetrics.recorded_at >= start_date)

        # If filtering by user, we need to join with tasks
        if user_id is not None:
            from src.models.task import Task

            query = (
                select(UsageMetrics)
                .join(Task, UsageMetrics.task_id == Task.id)
                .where(UsageMetrics.recorded_at >= start_date)
                .where(Task.user_id == user_id)
            )

        result = await self.db.execute(query)
        metrics = list(result.scalars().all())

        if not metrics:
            return PeriodMetricsSummary(
                period=period,
                start_date=start_date,
                end_date=now,
                total_tokens=0,
                input_tokens=0,
                output_tokens=0,
                total_runs=0,
                total_latency_ms=0,
                by_agent={},
                models_used={},
            )

        # Aggregate metrics
        by_agent: dict[str, dict[str, Any]] = {}
        models_used: dict[str, int] = {}
        total_tokens = 0
        input_tokens = 0
        output_tokens = 0
        total_latency = 0

        for m in metrics:
            agent_key = m.agent_type.value
            if agent_key not in by_agent:
                by_agent[agent_key] = {
                    "runs": 0,
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_latency": 0,
                }

            by_agent[agent_key]["runs"] += 1
            by_agent[agent_key]["total_tokens"] += m.total_tokens
            by_agent[agent_key]["input_tokens"] += m.input_tokens
            by_agent[agent_key]["output_tokens"] += m.output_tokens
            by_agent[agent_key]["total_latency"] += m.latency_ms

            total_tokens += m.total_tokens
            input_tokens += m.input_tokens
            output_tokens += m.output_tokens
            total_latency += m.latency_ms

            # Track model usage
            if m.model_used not in models_used:
                models_used[m.model_used] = 0
            models_used[m.model_used] += m.total_tokens

        # Convert to AgentMetricsSummary
        agent_summaries = {}
        for agent_type, data in by_agent.items():
            runs = data["runs"]
            agent_summaries[agent_type] = AgentMetricsSummary(
                agent_type=agent_type,
                total_runs=runs,
                total_tokens=data["total_tokens"],
                input_tokens=data["input_tokens"],
                output_tokens=data["output_tokens"],
                avg_tokens_per_run=data["total_tokens"] / runs if runs > 0 else 0,
                avg_latency_ms=data["total_latency"] / runs if runs > 0 else 0,
            )

        return PeriodMetricsSummary(
            period=period,
            start_date=start_date,
            end_date=now,
            total_tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_runs=len(metrics),
            total_latency_ms=total_latency,
            by_agent=agent_summaries,
            models_used=models_used,
        )

    async def get_agent_metrics(
        self,
        agent_type: AgentType,
        period: str = "30d",
    ) -> AgentMetricsSummary:
        """Get metrics for a specific agent type.

        Args:
            agent_type: Type of agent to get metrics for
            period: Time period string ("24h", "7d", "30d", "all")

        Returns:
            AgentMetricsSummary for the specified agent
        """
        now = datetime.now(UTC)
        if period == "24h":
            start_date = now - timedelta(hours=24)
        elif period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "all":
            start_date = datetime.min.replace(tzinfo=UTC)
        else:
            start_date = now - timedelta(days=30)

        query = (
            select(UsageMetrics)
            .where(UsageMetrics.agent_type == agent_type)
            .where(UsageMetrics.recorded_at >= start_date)
        )

        result = await self.db.execute(query)
        metrics = list(result.scalars().all())

        if not metrics:
            return AgentMetricsSummary(
                agent_type=agent_type.value,
                total_runs=0,
                total_tokens=0,
                input_tokens=0,
                output_tokens=0,
                avg_tokens_per_run=0,
                avg_latency_ms=0,
            )

        total_tokens = sum(m.total_tokens for m in metrics)
        input_tokens = sum(m.input_tokens for m in metrics)
        output_tokens = sum(m.output_tokens for m in metrics)
        total_latency = sum(m.latency_ms for m in metrics)
        runs = len(metrics)

        return AgentMetricsSummary(
            agent_type=agent_type.value,
            total_runs=runs,
            total_tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            avg_tokens_per_run=total_tokens / runs if runs > 0 else 0,
            avg_latency_ms=total_latency / runs if runs > 0 else 0,
        )

    async def get_metrics_timeseries(
        self,
        period: str = "7d",
        interval: str = "1h",
    ) -> list[dict[str, Any]]:
        """Get time-series metrics data for charting.

        Args:
            period: Time period ("24h", "7d", "30d")
            interval: Bucket interval ("1h", "6h", "1d")

        Returns:
            List of data points with timestamp and aggregated metrics
        """
        now = datetime.now(UTC)
        if period == "24h":
            start_date = now - timedelta(hours=24)
        elif period == "7d":
            start_date = now - timedelta(days=7)
        else:
            start_date = now - timedelta(days=30)

        # Get all metrics in the period
        query = select(UsageMetrics).where(UsageMetrics.recorded_at >= start_date)
        result = await self.db.execute(query)
        metrics = list(result.scalars().all())

        if not metrics:
            return []

        # Determine bucket size
        if interval == "1h":
            bucket_seconds = 3600
        elif interval == "6h":
            bucket_seconds = 21600
        else:  # 1d
            bucket_seconds = 86400

        # Group by time buckets
        buckets: dict[int, dict[str, Any]] = {}
        for m in metrics:
            timestamp = m.recorded_at.timestamp()
            bucket_key = int(timestamp // bucket_seconds) * bucket_seconds

            if bucket_key not in buckets:
                buckets[bucket_key] = {
                    "timestamp": datetime.fromtimestamp(bucket_key, tz=UTC),
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "runs": 0,
                }

            buckets[bucket_key]["total_tokens"] += m.total_tokens
            buckets[bucket_key]["input_tokens"] += m.input_tokens
            buckets[bucket_key]["output_tokens"] += m.output_tokens
            buckets[bucket_key]["runs"] += 1

        # Sort by timestamp and return
        sorted_buckets = sorted(buckets.values(), key=lambda x: x["timestamp"])
        return sorted_buckets

    async def get_total_tokens(self) -> int:
        """Get total tokens used across all metrics.

        Returns:
            Total token count
        """
        query = select(func.sum(UsageMetrics.total_tokens))
        result = await self.db.execute(query)
        total = result.scalar()
        return total or 0

    async def get_metrics_count(self) -> int:
        """Get total number of metrics records.

        Returns:
            Count of metrics records
        """
        query = select(func.count(UsageMetrics.id))
        result = await self.db.execute(query)
        return result.scalar() or 0
