"""Pydantic schemas for usage metrics API.

These schemas define the request/response models for the metrics endpoints,
providing type-safe data validation and serialization for the frontend dashboard.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from src.models.agent_run import AgentType


class AgentMetricsResponse(BaseModel):
    """Metrics summary for a specific agent type."""

    agent_type: str
    total_runs: int = Field(ge=0)
    total_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    avg_tokens_per_run: float = Field(ge=0)
    avg_latency_ms: float = Field(ge=0)


class CostBreakdownResponse(BaseModel):
    """Cost breakdown across different LLM providers."""

    local_cost: float = Field(ge=0, description="Local vLLM cost (always 0)")
    claude_haiku: float = Field(ge=0, description="Claude Haiku equivalent cost")
    claude_sonnet: float = Field(ge=0, description="Claude Sonnet equivalent cost")
    claude_opus: float = Field(ge=0, description="Claude Opus equivalent cost")
    o4_mini: float = Field(ge=0, description="o4-mini cost (Haiku tier)")
    gpt52: float = Field(ge=0, description="GPT-5.2 cost (Sonnet tier)")
    o3: float = Field(ge=0, description="o3 cost (Opus tier)")


class SavingsResponse(BaseModel):
    """Cost savings compared to cloud LLMs."""

    vs_claude_haiku: float = Field(ge=0)
    vs_claude_sonnet: float = Field(ge=0)
    vs_claude_opus: float = Field(ge=0)
    vs_o4_mini: float = Field(ge=0)
    vs_gpt52: float = Field(ge=0)
    vs_o3: float = Field(ge=0)


class TaskMetricsResponse(BaseModel):
    """Aggregated metrics for a single task."""

    task_id: int
    total_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    total_runs: int = Field(ge=0)
    total_latency_ms: int = Field(ge=0)
    by_agent: dict[str, AgentMetricsResponse]
    costs: CostBreakdownResponse
    savings: SavingsResponse


class PeriodMetricsResponse(BaseModel):
    """Aggregated metrics for a time period."""

    period: str = Field(description="Time period (24h, 7d, 30d, all)")
    start_date: datetime
    end_date: datetime
    total_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    total_runs: int = Field(ge=0)
    total_latency_ms: int = Field(ge=0)
    by_agent: dict[str, AgentMetricsResponse]
    models_used: dict[str, int] = Field(description="Token count by model name")
    costs: CostBreakdownResponse
    savings: SavingsResponse


class MetricsSummaryResponse(BaseModel):
    """High-level summary for dashboard display."""

    total_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    total_runs: int = Field(ge=0)
    total_latency_ms: int = Field(ge=0)
    costs: CostBreakdownResponse
    savings: SavingsResponse
    by_agent: dict[str, AgentMetricsResponse]
    models_used: dict[str, int]


class TimeseriesDataPoint(BaseModel):
    """Single data point for time-series charts."""

    timestamp: datetime
    total_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    runs: int = Field(ge=0)


class MetricsTimeseriesResponse(BaseModel):
    """Time-series data for charting."""

    period: str
    interval: str
    data: list[TimeseriesDataPoint]


class MetricsQueryParams(BaseModel):
    """Query parameters for metrics endpoints."""

    period: str = Field(default="30d", pattern="^(24h|7d|30d|all)$")
    interval: str = Field(default="1h", pattern="^(1h|6h|1d)$")


class AgentTypeQueryParams(BaseModel):
    """Query parameters for agent-specific metrics."""

    agent_type: AgentType
    period: str = Field(default="30d", pattern="^(24h|7d|30d|all)$")


class UsageMetricsCreate(BaseModel):
    """Schema for creating usage metrics (internal use)."""

    task_id: int
    agent_type: AgentType
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    model_used: str
    latency_ms: int = Field(ge=0)
    agent_run_id: int | None = None


class UsageMetricsResponse(BaseModel):
    """Response schema for individual usage metrics records."""

    id: int
    task_id: int
    agent_run_id: int | None
    agent_type: AgentType
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model_used: str
    latency_ms: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


class PricingInfoResponse(BaseModel):
    """Current LLM pricing information."""

    claude_haiku: dict[str, float] = Field(description="Haiku pricing per 1M tokens")
    claude_sonnet: dict[str, float] = Field(description="Sonnet pricing per 1M tokens")
    claude_opus: dict[str, float] = Field(description="Opus pricing per 1M tokens")
    o4_mini: dict[str, float] = Field(description="o4-mini pricing per 1M tokens")
    gpt52: dict[str, float] = Field(description="GPT-5.2 pricing per 1M tokens")
    o3: dict[str, float] = Field(description="o3 pricing per 1M tokens")


class MonthlyEstimateRequest(BaseModel):
    """Request for monthly cost estimate."""

    daily_tokens: int = Field(ge=0, description="Average daily token usage")
    input_ratio: float = Field(
        default=0.67, ge=0, le=1, description="Ratio of input tokens (default 2/3)"
    )


class MonthlyEstimateResponse(BaseModel):
    """Monthly cost estimate response."""

    monthly_tokens: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    costs: CostBreakdownResponse
