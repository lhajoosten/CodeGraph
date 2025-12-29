"""Business logic for authentication and authorization.

This module provides the AuthService class for verifying user permissions,
checking resource ownership, and managing role-based access control.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.logging import get_logger
from src.core.permissions import Permission, get_role_permissions, has_permission
from src.models.base import Base
from src.models.repository import Repository
from src.models.role import RoleType
from src.models.task import Task
from src.models.user import User
from src.models.webhook import Webhook

logger = get_logger(__name__)

# Resource type to model mapping for ownership checks
# Type is Any to allow dynamic attribute access (model.id, getattr for user_id field)
RESOURCE_MODELS: dict[str, type[Base]] = {
    "task": Task,
    "repository": Repository,
    "webhook": Webhook,
}

# Resource type to user_id field mapping
RESOURCE_USER_FIELDS: dict[str, str] = {
    "task": "user_id",
    "repository": "user_id",
    "webhook": "user_id",
}


class AuthService:
    """Service class for authentication and authorization business logic.

    Provides methods for:
    - Verifying user permissions
    - Checking resource ownership
    - Getting user permissions
    - Role-based access control
    """

    @staticmethod
    async def get_user_with_role(db: AsyncSession, user_id: int) -> User | None:
        """Get user with role eagerly loaded.

        Args:
            db: Database session.
            user_id: User ID.

        Returns:
            User with role loaded, or None if not found.
        """
        result = await db.execute(
            select(User).options(selectinload(User.role)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def get_user_role(user: User) -> RoleType | None:
        """Get the role type for a user.

        Args:
            user: User to get role for.

        Returns:
            RoleType if user has a role, None otherwise.
        """
        if user.role is None:
            return None
        return user.role.name

    @staticmethod
    def is_superuser(user: User) -> bool:
        """Check if user is a superuser.

        Superusers bypass all permission checks.

        Args:
            user: User to check.

        Returns:
            True if user is superuser.
        """
        return user.is_superuser

    @staticmethod
    async def verify_user_permissions(
        db: AsyncSession,
        user: User,
        permission: Permission | str,
        resource_id: int | None = None,
        resource_type: str | None = None,
    ) -> bool:
        """Verify if a user has permission to perform an action.

        Checks in order:
        1. Superuser bypass - superusers have all permissions
        2. Role-based permission check
        3. Resource ownership check (if resource_id provided)

        Args:
            db: Database session.
            user: User to check permissions for.
            permission: Permission to check (string or Permission enum).
            resource_id: Optional resource ID for ownership check.
            resource_type: Optional resource type for ownership check.

        Returns:
            True if user has permission, False otherwise.
        """
        permission_str = permission.value if isinstance(permission, Permission) else permission

        logger.debug(
            "permission_check_start",
            user_id=user.id,
            permission=permission_str,
            resource_id=resource_id,
            resource_type=resource_type,
        )

        # 1. Superuser bypass
        if user.is_superuser:
            logger.debug(
                "permission_granted_superuser",
                user_id=user.id,
                permission=permission_str,
            )
            return True

        # 2. Check role-based permission
        role = AuthService.get_user_role(user)
        if role is None:
            logger.warning(
                "permission_denied_no_role",
                user_id=user.id,
                permission=permission_str,
            )
            return False

        # Convert string to Permission enum if needed
        perm_enum: Permission | None = None
        if isinstance(permission, str):
            try:
                perm_enum = Permission(permission)
            except ValueError:
                logger.warning(
                    "permission_denied_invalid",
                    user_id=user.id,
                    permission=permission_str,
                )
                return False
        else:
            perm_enum = permission

        has_role_permission = has_permission(role, perm_enum)

        if has_role_permission:
            logger.debug(
                "permission_granted_role",
                user_id=user.id,
                permission=permission_str,
                role=role.value,
            )
            return True

        # 3. Check resource ownership (allows access to own resources)
        if resource_id and resource_type:
            is_owner = await AuthService.check_resource_ownership(
                db, user.id, resource_id, resource_type
            )
            if is_owner:
                logger.debug(
                    "permission_granted_ownership",
                    user_id=user.id,
                    permission=permission_str,
                    resource_type=resource_type,
                    resource_id=resource_id,
                )
                return True

        logger.info(
            "permission_denied",
            user_id=user.id,
            permission=permission_str,
            role=role.value if role else None,
            resource_type=resource_type,
            resource_id=resource_id,
        )
        return False

    @staticmethod
    async def check_resource_ownership(
        db: AsyncSession,
        user_id: int,
        resource_id: int,
        resource_type: str,
    ) -> bool:
        """Check if a user owns a specific resource.

        Args:
            db: Database session.
            user_id: User ID.
            resource_id: Resource ID.
            resource_type: Type of resource.

        Returns:
            True if user owns the resource, False otherwise.
        """
        model = RESOURCE_MODELS.get(resource_type)
        user_field = RESOURCE_USER_FIELDS.get(resource_type)

        if not model or not user_field:
            logger.warning(
                "ownership_check_unknown_resource",
                user_id=user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
            return False

        # Query for the resource with matching id and user_id
        # Using type: ignore because model is dynamically typed
        query = select(model).where(
            model.id == resource_id,  # type: ignore[attr-defined]
            getattr(model, user_field) == user_id,
        )
        result: Any = await db.execute(query)
        resource = result.scalar_one_or_none()

        return resource is not None

    @staticmethod
    def get_user_permissions(user: User) -> set[str]:
        """Get all permission codes for a user.

        For superusers, returns all permissions.
        For regular users, returns permissions based on their role.

        Args:
            user: User to get permissions for.

        Returns:
            Set of permission code strings (e.g., 'task:create').
        """
        if user.is_superuser:
            return {p.value for p in Permission}

        role = AuthService.get_user_role(user)
        if role is None:
            return set()

        permissions = get_role_permissions(role)
        return {p.value for p in permissions}

    @staticmethod
    async def check_resource_access(
        db: AsyncSession,
        user: User,
        resource_type: str,
        resource_id: int,
        action: str,
    ) -> bool:
        """Check if user can perform action on a specific resource.

        Combines permission check with ownership check.
        This is a convenience method that constructs the permission
        code from resource type and action.

        Args:
            db: Database session.
            user: User performing the action.
            resource_type: Type of resource (task, repository, etc.).
            resource_id: Resource ID.
            action: Action to perform (create, read, update, delete, etc.).

        Returns:
            True if user can perform the action.
        """
        permission_code = f"{resource_type}:{action}"

        return await AuthService.verify_user_permissions(
            db=db,
            user=user,
            permission=permission_code,
            resource_id=resource_id,
            resource_type=resource_type,
        )
