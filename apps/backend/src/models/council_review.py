"""Council review models for multi-judge code review tracking.

This module provides database models for tracking council-based code reviews
where multiple judges (personas or models) evaluate code independently
and their verdicts are aggregated into a final decision.

Features:
- CouncilReview: Aggregate review data with consensus tracking
- JudgeVerdict: Individual judge evaluation with detailed metrics

Usage:
    # Recording a council review
    council_review = CouncilReview(
        task_id=task.id,
        agent_run_id=agent_run.id,
        final_verdict="APPROVE",
        consensus_type="majority",
        confidence_score=0.85,
        deliberation_time_ms=3500,
        llm_mode="local",
    )

    # Recording judge verdicts
    judge_verdict = JudgeVerdict(
        council_review_id=council_review.id,
        judge_name="security_judge",
        persona="security",
        verdict="APPROVE",
        confidence=0.9,
        input_tokens=1500,
        output_tokens=500,
        latency_ms=1200,
    )
"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.agent_run import AgentRun
    from src.models.task import Task


class ReviewVerdict(str, enum.Enum):
    """Enum representing possible review verdicts."""

    APPROVE = "APPROVE"
    REVISE = "REVISE"
    REJECT = "REJECT"


class ConsensusType(str, enum.Enum):
    """Enum representing how consensus was reached."""

    UNANIMOUS = "unanimous"  # All judges agree
    MAJORITY = "majority"  # >50% agree on verdict
    TIE_BROKEN = "tie_broken"  # Tie broken by confidence weighting
    DISSENT = "dissent"  # Significant disagreement, verdict forced


class LLMMode(str, enum.Enum):
    """Enum representing the LLM mode used for council review."""

    LOCAL = "local"  # vLLM with persona prompts
    CLOUD = "cloud"  # Claude API with multi-model judges


class CouncilReview(Base, TimestampMixin):
    """Council review model for aggregate multi-judge review data.

    This model captures the aggregate result of a council-based code review
    where multiple judges evaluate code independently and their verdicts
    are aggregated into a final decision.

    Attributes:
        id: Primary key.
        task_id: Foreign key to the associated task.
        agent_run_id: Foreign key to the reviewer AgentRun.
        final_verdict: The aggregated final verdict (APPROVE/REVISE/REJECT).
        consensus_type: How consensus was reached (unanimous/majority/tie_broken).
        confidence_score: Aggregate confidence score (0.0-1.0).
        deliberation_time_ms: Total time for all judges to complete.
        total_cost_usd: Total estimated cost of all judge calls.
        llm_mode: Whether local vLLM or cloud Claude API was used.
        council_config: JSON config used for the council (judge personas, etc).
        council_conclusion: Human-readable summary of the council decision.
        dissenting_opinions: JSON list of dissenting judge summaries.

    Relationships:
        task: The task that was reviewed.
        agent_run: The reviewer AgentRun that triggered this council review.
        judge_verdicts: Individual verdicts from each judge.
    """

    __tablename__ = "council_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Verdict and consensus
    final_verdict: Mapped[ReviewVerdict] = mapped_column(
        Enum(ReviewVerdict), nullable=False, index=True
    )
    consensus_type: Mapped[ConsensusType] = mapped_column(
        Enum(ConsensusType), nullable=False, index=True
    )
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Performance metrics
    deliberation_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Configuration and mode
    llm_mode: Mapped[LLMMode] = mapped_column(
        Enum(LLMMode), nullable=False, default=LLMMode.LOCAL, index=True
    )
    council_config: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    # Review content
    council_conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)
    dissenting_opinions: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)

    # Aggregate issue counts (for quick queries)
    total_issues: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    critical_issues: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    major_issues: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Timestamp when the review was completed
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="council_reviews")
    agent_run: Mapped["AgentRun | None"] = relationship(
        "AgentRun", back_populates="council_reviews"
    )
    judge_verdicts: Mapped[list["JudgeVerdict"]] = relationship(
        "JudgeVerdict", back_populates="council_review", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of the council review."""
        return (
            f"<CouncilReview(id={self.id}, verdict={self.final_verdict.value}, "
            f"consensus={self.consensus_type.value}, confidence={self.confidence_score:.2f})>"
        )


class JudgeVerdict(Base, TimestampMixin):
    """Individual judge verdict from a council review.

    This model captures the evaluation from a single judge (persona or model)
    within a council review. Each judge provides an independent assessment
    with their own verdict, confidence, and identified issues.

    Attributes:
        id: Primary key.
        council_review_id: Foreign key to the parent CouncilReview.
        judge_name: Identifier for the judge (e.g., "security_judge").
        persona: The persona/focus area (e.g., "security", "performance").
        model_tier: Model tier used (haiku/sonnet/opus for cloud, "local" for vLLM).
        verdict: The judge's verdict (APPROVE/REVISE/REJECT).
        confidence: Confidence in the verdict (0.0-1.0).
        reasoning: Detailed reasoning for the verdict.
        issues_found: JSON list of issues identified by this judge.
        strengths_found: JSON list of strengths identified.
        input_tokens: Number of input tokens consumed.
        output_tokens: Number of output tokens generated.
        total_tokens: Sum of input and output tokens.
        latency_ms: Time taken for the judge's evaluation.
        cost_usd: Estimated cost for this judge's evaluation.

    Relationships:
        council_review: The parent council review.
    """

    __tablename__ = "judge_verdicts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key
    council_review_id: Mapped[int] = mapped_column(
        ForeignKey("council_reviews.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Judge identification
    judge_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    persona: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model_tier: Mapped[str] = mapped_column(String(50), nullable=False, default="local")

    # Verdict
    verdict: Mapped[ReviewVerdict] = mapped_column(Enum(ReviewVerdict), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Review content
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    issues_found: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    strengths_found: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Token metrics
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Performance and cost
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Timestamp when this judge completed
    judged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    # Relationships
    council_review: Mapped["CouncilReview"] = relationship(
        "CouncilReview", back_populates="judge_verdicts"
    )

    def __repr__(self) -> str:
        """String representation of the judge verdict."""
        return (
            f"<JudgeVerdict(id={self.id}, judge={self.judge_name}, "
            f"verdict={self.verdict.value}, confidence={self.confidence:.2f})>"
        )
