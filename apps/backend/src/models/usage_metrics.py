"""Usage metrics model for tracking token consumption and costs.

This module provides the UsageMetrics model for comprehensive token tracking
across all agent executions. Designed for both backend analytics and
frontend dashboard display.

Usage:
    # Recording metrics
    metrics = UsageMetrics(
        task_id=task.id,
        agent_type=AgentType.PLANNER,
        input_tokens=1500,
        output_tokens=500,
        model_used="Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        latency_ms=2500,
    )

    # Querying aggregates
    total_tokens = await db.execute(
        select(func.sum(UsageMetrics.total_tokens))
        .where(UsageMetrics.task_id == task_id)
    )
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.agent_run import AgentType
from src.models.base import Base

if TYPE_CHECKING:
    from src.models.agent_run import AgentRun
    from src.models.task import Task


class UsageMetrics(Base):
    """Usage metrics model for tracking token consumption per agent execution.

    This model captures granular token usage data for analytics, cost
    calculations, and frontend dashboard display. It's separate from AgentRun
    to maintain clear separation between workflow tracking and analytics.

    Attributes:
        id: Primary key.
        task_id: Foreign key to the associated task.
        agent_run_id: Optional FK to AgentRun for correlation.
        agent_type: Type of agent (planner, coder, tester, reviewer).
        input_tokens: Number of input/prompt tokens consumed.
        output_tokens: Number of output/completion tokens generated.
        total_tokens: Sum of input and output tokens.
        model_used: Name of the model used (e.g., "Qwen/Qwen2.5-Coder-14B").
        latency_ms: Time taken for the LLM call in milliseconds.
        recorded_at: Timestamp when the metrics were recorded.

    Relationships:
        task: The task associated with these metrics.
        agent_run: The agent run that generated these metrics (optional).
    """

    __tablename__ = "usage_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Agent identification
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), nullable=False, index=True)

    # Token metrics
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Model and performance
    model_used: Mapped[str] = mapped_column(String(200), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Timestamp
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="usage_metrics")
    agent_run: Mapped["AgentRun | None"] = relationship("AgentRun", back_populates="usage_metrics")

    def __repr__(self) -> str:
        """String representation of the usage metrics."""
        return (
            f"<UsageMetrics(id={self.id}, agent={self.agent_type.value}, "
            f"tokens={self.total_tokens}, model={self.model_used[:30]}...)>"
        )
