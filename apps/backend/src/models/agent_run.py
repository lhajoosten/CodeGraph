"""Agent run model for tracking agent executions."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
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
        id (int): Primary key.
        agent_type (AgentType): Type of the agent.
        status (AgentRunStatus): Current status of the agent run.
        iteration (int): Iteration number for agents that run multiple times (coder in review loop).
        verdict (str | None): Review verdict (APPROVE, REVISE, REJECT) for reviewer runs.
        started_at (datetime | None): Timestamp when the agent run started.
        completed_at (datetime | None): Timestamp when the agent run completed.
        model_used (str | None): The model used during the agent run.
        tokens_used (int | None): Number of tokens used during the run.
        error_message (str | None): Error message if the run failed.
        input_data (dict[str, Any] | None): Input data provided to the agent.
        output_data (dict[str, Any] | None): Output data produced by the agent.
        run_metadata (dict[str, Any] | None): Additional metadata about the run.
        task_id (int): Foreign key to the associated task.

    Relationships:
        task (Task): The task associated with the agent run.

    TODO: Add performance metrics collection (Phase 3)
    TODO: Add cost tracking for different models (Phase 3)
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
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

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

    def __repr__(self) -> str:
        """String representation of the agent run."""
        return f"<AgentRun(id={self.id}, agent_type={self.agent_type}, status={self.status})>"
