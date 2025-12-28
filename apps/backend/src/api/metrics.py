"""API routes for usage metrics and cost analytics.

This module provides FastAPI endpoints for accessing token usage metrics,
cost calculations, and analytics data for the frontend dashboard.

Endpoints:
- GET /metrics/summary: High-level metrics summary
- GET /metrics/tasks/{task_id}: Task-specific metrics
- GET /metrics/history: Time-series metrics data
- GET /metrics/agent/{agent_type}: Agent-specific metrics
- GET /metrics/pricing: Current LLM pricing info
- POST /metrics/estimate: Monthly cost estimate

All endpoints require authentication.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.database import get_db
from src.core.logging import get_logger
from src.models.agent_run import AgentType
from src.models.user import User
from src.schemas.metrics import (
    AgentMetricsResponse,
    CostBreakdownResponse,
    MetricsSummaryResponse,
    MetricsTimeseriesResponse,
    MonthlyEstimateRequest,
    MonthlyEstimateResponse,
    PeriodMetricsResponse,
    PricingInfoResponse,
    SavingsResponse,
    TaskMetricsResponse,
    TimeseriesDataPoint,
)
from src.services.cost_calculator import CostCalculator
from src.services.metrics_service import MetricsService

logger = get_logger(__name__)

router = APIRouter()


@router.get("/summary", response_model=MetricsSummaryResponse)
async def get_metrics_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query(default="30d", pattern="^(24h|7d|30d|all)$"),
) -> MetricsSummaryResponse:
    """Get high-level metrics summary for dashboard display.

    Returns aggregated token usage, cost calculations, and per-agent breakdown
    for the specified time period.

    Args:
        period: Time period (24h, 7d, 30d, or all)

    Returns:
        MetricsSummaryResponse with tokens, costs, and breakdowns
    """
    logger.info(
        "Fetching metrics summary",
        user_id=current_user.id,
        period=period,
    )

    service = MetricsService(db)
    metrics = await service.get_metrics_for_period(period=period, user_id=current_user.id)

    # Calculate costs
    cost_data = CostCalculator.calculate_from_metrics(metrics)

    # Convert agent summaries to response format
    by_agent = {
        agent_type: AgentMetricsResponse(
            agent_type=summary.agent_type,
            total_runs=summary.total_runs,
            total_tokens=summary.total_tokens,
            input_tokens=summary.input_tokens,
            output_tokens=summary.output_tokens,
            avg_tokens_per_run=summary.avg_tokens_per_run,
            avg_latency_ms=summary.avg_latency_ms,
        )
        for agent_type, summary in metrics.by_agent.items()
    }

    return MetricsSummaryResponse(
        total_tokens=metrics.total_tokens,
        input_tokens=metrics.input_tokens,
        output_tokens=metrics.output_tokens,
        total_runs=metrics.total_runs,
        total_latency_ms=metrics.total_latency_ms,
        costs=CostBreakdownResponse(**cost_data["costs"]),
        savings=SavingsResponse(**cost_data["savings"]),
        by_agent=by_agent,
        models_used=metrics.models_used,
    )


@router.get("/tasks/{task_id}", response_model=TaskMetricsResponse)
async def get_task_metrics(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TaskMetricsResponse:
    """Get metrics for a specific task.

    Returns detailed token usage and cost breakdown for a single task,
    including per-agent metrics.

    Args:
        task_id: ID of the task

    Returns:
        TaskMetricsResponse with task-specific metrics
    """
    logger.info(
        "Fetching task metrics",
        user_id=current_user.id,
        task_id=task_id,
    )

    service = MetricsService(db)
    metrics = await service.get_task_metrics(task_id)

    # Calculate costs
    cost_data = CostCalculator.calculate_from_metrics(metrics)

    # Convert agent summaries to response format
    by_agent = {
        agent_type: AgentMetricsResponse(
            agent_type=summary.agent_type,
            total_runs=summary.total_runs,
            total_tokens=summary.total_tokens,
            input_tokens=summary.input_tokens,
            output_tokens=summary.output_tokens,
            avg_tokens_per_run=summary.avg_tokens_per_run,
            avg_latency_ms=summary.avg_latency_ms,
        )
        for agent_type, summary in metrics.by_agent.items()
    }

    return TaskMetricsResponse(
        task_id=metrics.task_id,
        total_tokens=metrics.total_tokens,
        input_tokens=metrics.input_tokens,
        output_tokens=metrics.output_tokens,
        total_runs=metrics.total_runs,
        total_latency_ms=metrics.total_latency_ms,
        by_agent=by_agent,
        costs=CostBreakdownResponse(**cost_data["costs"]),
        savings=SavingsResponse(**cost_data["savings"]),
    )


@router.get("/history", response_model=MetricsTimeseriesResponse)
async def get_metrics_history(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query(default="7d", pattern="^(24h|7d|30d)$"),
    interval: str = Query(default="1h", pattern="^(1h|6h|1d)$"),
) -> MetricsTimeseriesResponse:
    """Get time-series metrics data for charting.

    Returns bucketed metrics data suitable for time-series charts,
    with configurable period and interval.

    Args:
        period: Time period (24h, 7d, 30d)
        interval: Bucket interval (1h, 6h, 1d)

    Returns:
        MetricsTimeseriesResponse with data points
    """
    logger.info(
        "Fetching metrics history",
        user_id=current_user.id,
        period=period,
        interval=interval,
    )

    service = MetricsService(db)
    timeseries = await service.get_metrics_timeseries(period=period, interval=interval)

    data_points = [
        TimeseriesDataPoint(
            timestamp=point["timestamp"],
            total_tokens=point["total_tokens"],
            input_tokens=point["input_tokens"],
            output_tokens=point["output_tokens"],
            runs=point["runs"],
        )
        for point in timeseries
    ]

    return MetricsTimeseriesResponse(
        period=period,
        interval=interval,
        data=data_points,
    )


@router.get("/agent/{agent_type}", response_model=AgentMetricsResponse)
async def get_agent_metrics(
    agent_type: AgentType,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query(default="30d", pattern="^(24h|7d|30d|all)$"),
) -> AgentMetricsResponse:
    """Get metrics for a specific agent type.

    Returns detailed metrics for a single agent type (planner, coder,
    tester, or reviewer).

    Args:
        agent_type: Type of agent (PLANNER, CODER, TESTER, REVIEWER)
        period: Time period (24h, 7d, 30d, or all)

    Returns:
        AgentMetricsResponse with agent-specific metrics
    """
    logger.info(
        "Fetching agent metrics",
        user_id=current_user.id,
        agent_type=agent_type.value,
        period=period,
    )

    service = MetricsService(db)
    metrics = await service.get_agent_metrics(agent_type=agent_type, period=period)

    return AgentMetricsResponse(
        agent_type=metrics.agent_type,
        total_runs=metrics.total_runs,
        total_tokens=metrics.total_tokens,
        input_tokens=metrics.input_tokens,
        output_tokens=metrics.output_tokens,
        avg_tokens_per_run=metrics.avg_tokens_per_run,
        avg_latency_ms=metrics.avg_latency_ms,
    )


@router.get("/pricing", response_model=PricingInfoResponse)
async def get_pricing_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> PricingInfoResponse:
    """Get current LLM pricing information.

    Returns the pricing per 1M tokens for each supported model,
    useful for displaying cost context to users.

    Returns:
        PricingInfoResponse with model pricing
    """
    logger.info("Fetching pricing info", user_id=current_user.id)

    pricing = CostCalculator.get_pricing_info()

    return PricingInfoResponse(
        claude_haiku=pricing["claude_haiku"],
        claude_sonnet=pricing["claude_sonnet"],
        claude_opus=pricing["claude_opus"],
        o4_mini=pricing["o4_mini"],
        gpt52=pricing["gpt52"],
        o3=pricing["o3"],
    )


@router.post("/estimate", response_model=MonthlyEstimateResponse)
async def estimate_monthly_cost(
    request: MonthlyEstimateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> MonthlyEstimateResponse:
    """Estimate monthly costs based on daily token usage.

    Calculates what the monthly cost would be if using cloud LLMs
    instead of local vLLM, based on projected daily usage.

    Args:
        request: Daily token estimate and input ratio

    Returns:
        MonthlyEstimateResponse with cost projections
    """
    logger.info(
        "Calculating monthly estimate",
        user_id=current_user.id,
        daily_tokens=request.daily_tokens,
    )

    estimate = CostCalculator.estimate_monthly_cost(
        daily_tokens=request.daily_tokens,
        input_ratio=request.input_ratio,
    )

    return MonthlyEstimateResponse(
        monthly_tokens=estimate["monthly_tokens"],
        input_tokens=estimate["input_tokens"],
        output_tokens=estimate["output_tokens"],
        costs=CostBreakdownResponse(**estimate["costs"]),
    )


@router.get("/global", response_model=PeriodMetricsResponse)
async def get_global_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query(default="30d", pattern="^(24h|7d|30d|all)$"),
) -> PeriodMetricsResponse:
    """Get global metrics across all tasks and users.

    Returns aggregated metrics for the entire system (admin view).
    Note: Currently returns user-scoped metrics for security.

    Args:
        period: Time period (24h, 7d, 30d, or all)

    Returns:
        PeriodMetricsResponse with global metrics
    """
    logger.info(
        "Fetching global metrics",
        user_id=current_user.id,
        period=period,
    )

    service = MetricsService(db)
    # For now, scope to user for security; admin endpoint can be added later
    metrics = await service.get_metrics_for_period(period=period, user_id=current_user.id)

    # Calculate costs
    cost_data = CostCalculator.calculate_from_metrics(metrics)

    # Convert agent summaries to response format
    by_agent = {
        agent_type: AgentMetricsResponse(
            agent_type=summary.agent_type,
            total_runs=summary.total_runs,
            total_tokens=summary.total_tokens,
            input_tokens=summary.input_tokens,
            output_tokens=summary.output_tokens,
            avg_tokens_per_run=summary.avg_tokens_per_run,
            avg_latency_ms=summary.avg_latency_ms,
        )
        for agent_type, summary in metrics.by_agent.items()
    }

    return PeriodMetricsResponse(
        period=metrics.period,
        start_date=metrics.start_date,
        end_date=metrics.end_date,
        total_tokens=metrics.total_tokens,
        input_tokens=metrics.input_tokens,
        output_tokens=metrics.output_tokens,
        total_runs=metrics.total_runs,
        total_latency_ms=metrics.total_latency_ms,
        by_agent=by_agent,
        models_used=metrics.models_used,
        costs=CostBreakdownResponse(**cost_data["costs"]),
        savings=SavingsResponse(**cost_data["savings"]),
    )
