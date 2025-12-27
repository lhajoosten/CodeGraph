"""Repository model for GitHub repositories."""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.task import Task
    from src.models.user import User


class Repository(Base, TimestampMixin):
    """Repository model representing a GitHub repository linked to the platform.
    Attributes:
        id (int): Primary key.
        name (str): Name of the repository.
        github_url (str): URL of the GitHub repository.
        default_branch (str): Default branch of the repository.
        description (str | None): Description of the repository.
        user_id (int): Foreign key to the user who owns the repository.

    Relationships:
        user (User): The user who owns the repository.
        tasks (list[Task]): List of tasks associated with the repository.
    """

    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    github_url: Mapped[str] = mapped_column(String(500), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="repositories")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="repository")

    def __repr__(self) -> str:
        """String representation of the repository."""
        return f"<Repository(id={self.id}, name={self.name})>"
