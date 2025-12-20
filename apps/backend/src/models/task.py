"""Task model for coding tasks."""

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.agent_run import AgentRun
    from src.models.repository import Repository
    from src.models.user import User


class TaskStatus(str, enum.Enum):
    """Enum representing the status of a task."""

    PENDING = "pending"
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    """Enum representing the priority of a task."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base, TimestampMixin):
    """Task model representing a coding task to be executed by agents."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )

    # Foreign keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    repository_id: Mapped[int | None] = mapped_column(
        ForeignKey("repositories.id"), nullable=True, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    repository: Mapped["Repository | None"] = relationship("Repository", back_populates="tasks")
    agent_runs: Mapped[list["AgentRun"]] = relationship(
        "AgentRun", back_populates="task", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of the task."""
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"
