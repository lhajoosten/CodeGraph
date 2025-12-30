"""Role model for RBAC permission system."""

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.permission import Permission
    from src.models.user import User


class RoleType(str, enum.Enum):
    """Enum representing the type of role in the system.

    Roles are ordered by privilege level:
    - ADMIN: Full system access
    - DEVELOPER: Can create, modify, and execute workflows
    - VIEWER: Read-only access to shared resources
    """

    ADMIN = "admin"
    DEVELOPER = "developer"
    VIEWER = "viewer"


class Role(Base, TimestampMixin):
    """Role model representing user roles in the system.

    Each role has a set of permissions that define what actions
    users with that role can perform.

    Attributes:
        id: Primary key.
        name: Unique role name (matches RoleType enum).
        description: Human-readable description of the role.

    Relationships:
        users: List of users assigned to this role.
        permissions: List of permissions granted to this role.
    """

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[RoleType] = mapped_column(
        Enum(
            RoleType,
            name="roletype",
            create_constraint=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[list["Permission"]] = relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
    )

    def __repr__(self) -> str:
        """String representation of the role."""
        return f"<Role(id={self.id}, name={self.name.value})>"
