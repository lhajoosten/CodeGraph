"""Permission model for ABAC permission system."""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.role import Role


class Permission(Base, TimestampMixin):
    """Permission model representing granular access controls.

    Permissions use a resource:action pattern (e.g., task:read, task:create).
    Each permission is associated with one or more roles.

    Attributes:
        id: Primary key.
        resource: Resource type (task, repository, user, agent, etc.).
        action: Action type (create, read, update, delete, execute, etc.).
        description: Human-readable description of what this permission allows.

    Relationships:
        roles: List of roles that have this permission.
    """

    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("resource", "action", name="uq_permission_resource_action"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resource: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    roles: Mapped[list["Role"]] = relationship(
        "Role",
        secondary="role_permissions",
        back_populates="permissions",
    )

    @property
    def code(self) -> str:
        """Get permission code in resource:action format.

        Returns:
            Permission code string (e.g., 'task:create').
        """
        return f"{self.resource}:{self.action}"

    def __repr__(self) -> str:
        """String representation of the permission."""
        return f"<Permission(id={self.id}, code={self.code})>"


class RolePermission(Base):
    """Association table for Role-Permission many-to-many relationship.

    This table links roles to their permissions without timestamps
    since it's a pure association table.
    """

    __tablename__ = "role_permissions"

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
