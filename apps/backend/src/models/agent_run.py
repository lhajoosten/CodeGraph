"""Agent run model for tracking agent executions."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.task import Task


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
    """Agent run model representing an execution of an agent for a task."""

    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), nullable=False, index=True)
    status: Mapped[AgentRunStatus] = mapped_column(
        Enum(AgentRunStatus), default=AgentRunStatus.PENDING, nullable=False, index=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Execution metadata
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Agent output and metadata stored as JSON
    input_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    output_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    run_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Foreign keys
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="agent_runs")

    def __repr__(self) -> str:
        """String representation of the agent run."""
        return f"<AgentRun(id={self.id}, agent_type={self.agent_type}, status={self.status})>"
