"""Pydantic schemas for council review operations.

This module provides request/response schemas for council-based code reviews
where multiple judges evaluate code and aggregate their verdicts.

Phase 3 Features:
- JudgeVerdictResponse: Individual judge evaluation data
- CouncilReviewResponse: Aggregate council review data
- CouncilConfigRequest: Configuration for council setup
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ReviewIssueResponse(BaseModel):
    """Schema for a code review issue identified by a judge."""

    category: Literal["security", "performance", "maintainability", "correctness", "style"]
    severity: Literal["critical", "major", "minor", "info"]
    description: str
    line_numbers: list[int] | None = None
    suggestion: str | None = None


class JudgeVerdictResponse(BaseModel):
    """Schema for individual judge verdict responses."""

    id: int
    council_review_id: int
    judge_name: str
    persona: str
    model_tier: str
    verdict: Literal["APPROVE", "REVISE", "REJECT"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str | None = None
    issues_found: list[dict[str, Any]] | None = None
    strengths_found: list[str] | None = None
    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: int
    cost_usd: float
    judged_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JudgeVerdictSummary(BaseModel):
    """Summary of a judge verdict for list views."""

    judge_name: str
    persona: str
    verdict: Literal["APPROVE", "REVISE", "REJECT"]
    confidence: float
    issue_count: int
    tokens_used: int
    latency_ms: int
    cost_usd: float


class CouncilReviewResponse(BaseModel):
    """Schema for council review responses."""

    id: int
    task_id: int
    agent_run_id: int | None
    final_verdict: Literal["APPROVE", "REVISE", "REJECT"]
    consensus_type: Literal["unanimous", "majority", "tie_broken", "dissent"]
    confidence_score: float = Field(ge=0.0, le=1.0)
    deliberation_time_ms: int
    total_cost_usd: float
    llm_mode: Literal["local", "cloud"]
    council_config: dict[str, Any] | None = None
    council_conclusion: str | None = None
    dissenting_opinions: list[dict[str, Any]] | None = None
    total_issues: int
    critical_issues: int
    major_issues: int
    reviewed_at: datetime
    created_at: datetime
    updated_at: datetime

    # Nested judge verdicts
    judge_verdicts: list[JudgeVerdictResponse] | None = None

    model_config = {"from_attributes": True}


class CouncilReviewSummary(BaseModel):
    """Summary of a council review for list views."""

    id: int
    task_id: int
    final_verdict: Literal["APPROVE", "REVISE", "REJECT"]
    consensus_type: Literal["unanimous", "majority", "tie_broken", "dissent"]
    confidence_score: float
    judge_count: int
    total_issues: int
    critical_issues: int
    deliberation_time_ms: int
    total_cost_usd: float
    llm_mode: Literal["local", "cloud"]
    reviewed_at: datetime


class CouncilReviewListResponse(BaseModel):
    """Paginated list of council reviews."""

    items: list[CouncilReviewSummary]
    total: int
    page: int
    page_size: int
    has_more: bool


class JudgeConfigRequest(BaseModel):
    """Configuration for a single judge in the council."""

    persona: str = Field(
        description="The persona/focus area (security, performance, maintainability)"
    )
    model_tier: Literal["haiku", "sonnet", "opus", "local"] | None = Field(
        default=None, description="Model tier to use for this judge (cloud mode only)"
    )
    weight: float = Field(default=1.0, ge=0.0, le=2.0, description="Voting weight for this judge")


class CouncilConfigRequest(BaseModel):
    """Request schema for configuring a council review."""

    judges: list[JudgeConfigRequest] | None = Field(
        default=None,
        description="Custom judge configurations. If not provided, uses default judges.",
    )
    require_unanimous_reject: bool = Field(
        default=True, description="Whether REJECT requires unanimous agreement"
    )
    min_confidence_for_approve: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence score required for APPROVE verdict",
    )


class CouncilMetricsResponse(BaseModel):
    """Aggregate metrics for council reviews."""

    total_reviews: int
    approved_count: int
    revised_count: int
    rejected_count: int
    average_confidence: float
    average_deliberation_ms: int
    total_cost_usd: float
    consensus_breakdown: dict[str, int]  # unanimous, majority, tie_broken, dissent
    judge_performance: dict[str, dict[str, Any]]  # Per-judge metrics


class CouncilComparisonResponse(BaseModel):
    """Comparison of single reviewer vs council review."""

    task_id: int
    single_reviewer_verdict: str | None
    council_verdict: str
    consensus_type: str
    agreement: bool
    council_confidence: float
    additional_issues_found: int
    cost_difference_usd: float
    time_difference_ms: int
