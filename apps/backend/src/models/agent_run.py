"""Agent run model for tracking agent executions."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.council_review import CouncilReview
    from src.models.task import Task
    from src.models.usage_metrics import UsageMetrics


class AgentType(str, enum.Enum):
    """Enum representing the type of agent."""

    PLANNER = "planner"
    CODER = "coder"
    TESTER = "tester"
    REVIEWER = "reviewer"


class AgentRunStatus(str, enum.Enum):
    """Enum representing the status of an agent run."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


class AgentRun(Base, TimestampMixin):
    """Agent run model representing an execution of an agent for a task.

    Attributes:
        id: Primary key.
        agent_type: Type of the agent.
        status: Current status of the agent run.
        iteration: Iteration number for agents that run multiple times (coder in review loop).
        verdict: Review verdict (APPROVE, REVISE, REJECT) for reviewer runs.
        started_at: Timestamp when the agent run started.
        completed_at: Timestamp when the agent run completed.
        model_used: The model name used during the agent run.
        model_tier: The model tier (haiku, sonnet, opus, local).
        tokens_used: Total number of tokens used during the run.
        input_tokens: Number of input/prompt tokens (Phase 3).
        output_tokens: Number of output/completion tokens (Phase 3).
        cost_usd: Estimated cost in USD (Phase 3).
        first_token_latency_ms: Time to first token in milliseconds (Phase 3).
        total_latency_ms: Total execution time in milliseconds (Phase 3).
        code_quality_score: Quality score 0-100 for coder output (Phase 3).
        lint_warning_count: Number of lint warnings in generated code (Phase 3).
        error_message: Error message if the run failed.
        input_data: Input data provided to the agent.
        output_data: Output data produced by the agent.
        run_metadata: Additional metadata about the run.
        task_id: Foreign key to the associated task.

    Relationships:
        task: The task associated with the agent run.
        usage_metrics: Detailed usage metrics for this run.
        council_reviews: Council reviews triggered by this run (for reviewers).
    """

    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), nullable=False, index=True)
    status: Mapped[AgentRunStatus] = mapped_column(
        Enum(AgentRunStatus), default=AgentRunStatus.PENDING, nullable=False, index=True
    )
    iteration: Mapped[int] = mapped_column(Integer, default=1, nullable=False, index=True)
    verdict: Mapped[str | None] = mapped_column(String(50), nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Execution metadata
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_tier: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Phase 3: Detailed token metrics
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Phase 3: Latency metrics
    first_token_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Phase 3: Code quality metrics (for coder runs)
    code_quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lint_warning_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Agent output and metadata stored as JSON
    input_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    output_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    run_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    # Foreign keys
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="agent_runs")
    usage_metrics: Mapped[list["UsageMetrics"]] = relationship(
        "UsageMetrics", back_populates="agent_run"
    )
    council_reviews: Mapped[list["CouncilReview"]] = relationship(
        "CouncilReview", back_populates="agent_run"
    )

    def __repr__(self) -> str:
        """String representation of the agent run."""
        return f"<AgentRun(id={self.id}, agent_type={self.agent_type}, status={self.status})>"
