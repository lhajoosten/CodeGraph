"""API dependencies for authentication and database access.

This module provides FastAPI dependencies for:
- Authentication (token extraction, user retrieval)
- Authorization (permission checking, role validation)
- Resource ownership verification
"""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.error_codes import AuthErrorCode
from src.core.exceptions import AuthenticationException, AuthorizationException, CodeGraphException
from src.core.permissions import Permission
from src.core.security import decode_token
from src.models.role import RoleType
from src.models.user import User
from src.services.auth_service import AuthService

# HTTP Bearer token security scheme (legacy support, will be removed)
security = HTTPBearer(auto_error=False)


async def get_token_from_cookie(
    access_token: Annotated[str | None, Cookie()] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> str:
    """
    Extract JWT token from cookie or fallback to Bearer header.

    Prioritizes cookie-based authentication but supports legacy Bearer tokens.

    Args:
        access_token: Access token from HTTP-only cookie
        credentials: HTTP authorization credentials (legacy support)

    Returns:
        str: JWT token

    Raises:
        HTTPException: If no valid token is found
    """
    # Priority 1: Cookie-based authentication (new method)
    if access_token:
        return access_token

    # Priority 2: Bearer token (legacy support, will be removed)
    if credentials:
        return credentials.credentials

    # No authentication found
    raise AuthenticationException(
        message="Not authenticated",
        error_code=AuthErrorCode.NOT_AUTHENTICATED,
    )


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_cookie)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get the current authenticated user from the JWT token.

    Requires a full access token. Rejects partial tokens (2FA verification step).

    Args:
        token: JWT token from cookie or header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid, partial, or user not found
    """
    payload = decode_token(token)

    if payload is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Reject partial tokens (2FA verification step only)
    if payload.get("type") == "partial":
        raise AuthorizationException(
            message="2FA verification required (2fa_verification_required). Please verify your 2FA code.",
            error_code=AuthErrorCode.TWO_FACTOR_REQUIRED,
            details={"reason": "2fa_verification_required"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise AuthenticationException(
            message="User not found",
            error_code=AuthErrorCode.USER_NOT_FOUND,
        )

    if not user.is_active:
        raise AuthenticationException(
            message="User account is inactive",
            error_code=AuthErrorCode.ACCOUNT_INACTIVE,
        )

    return user


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    access_token: Annotated[str | None, Cookie()] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> User | None:
    """
    Get the current user if authenticated, otherwise return None.

    Useful for endpoints that have optional authentication.

    Args:
        access_token: Access token from HTTP-only cookie
        credentials: HTTP authorization credentials (legacy support)
        db: Database session

    Returns:
        User | None: The authenticated user or None
    """
    try:
        token = await get_token_from_cookie(access_token, credentials)
        return await get_current_user(token, db)
    except (HTTPException, CodeGraphException):
        return None


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Get the current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        User: The authenticated active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise AuthenticationException(
            message="User account is inactive",
            error_code=AuthErrorCode.ACCOUNT_INACTIVE,
        )
    return current_user


async def get_current_user_partial(
    token: Annotated[str, Depends(get_token_from_cookie)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get the current user from a partial access token (2FA verification step only).

    Accepts ONLY partial tokens. Rejects full access tokens.
    Used for /auth/verify-2fa endpoint during login.

    Args:
        token: JWT token from cookie or header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid, not partial, or user not found
    """
    payload = decode_token(token)

    if payload is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Only accept partial tokens
    if payload.get("type") != "partial":
        raise AuthenticationException(
            message="Invalid token type for this operation",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise AuthenticationException(
            message="User not found",
            error_code=AuthErrorCode.USER_NOT_FOUND,
        )

    if not user.is_active:
        raise AuthenticationException(
            message="User account is inactive",
            error_code=AuthErrorCode.ACCOUNT_INACTIVE,
        )

    return user


async def get_current_user_or_partial(
    token: Annotated[str, Depends(get_token_from_cookie)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get the current user from either a full or partial access token.

    Accepts both full and partial tokens.
    Used for 2FA setup/enable endpoints that are accessible during login.

    Args:
        token: JWT token from cookie or header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    payload = decode_token(token)

    if payload is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Accept both full and partial tokens
    token_type = payload.get("type")
    if token_type not in ["access", "partial"]:
        raise AuthenticationException(
            message="Invalid token type",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationException(
            message="Invalid authentication credentials",
            error_code=AuthErrorCode.TOKEN_INVALID,
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise AuthenticationException(
            message="User not found",
            error_code=AuthErrorCode.USER_NOT_FOUND,
        )

    if not user.is_active:
        raise AuthenticationException(
            message="User account is inactive",
            error_code=AuthErrorCode.ACCOUNT_INACTIVE,
        )

    return user


# ============================================================================
# PERMISSION DEPENDENCIES
# ============================================================================


def require_permission(
    *permissions: Permission | str,
) -> Callable[..., Awaitable[User]]:
    """Dependency factory that checks if user has required permission(s).

    Superusers bypass all permission checks.
    All specified permissions must be granted (AND logic).

    Args:
        *permissions: One or more permissions to check.

    Returns:
        Dependency function that validates permissions.

    Usage:
        @router.post("/tasks")
        async def create_task(
            user: User = Depends(require_permission(Permission.TASK_CREATE)),
        ):
            ...
    """

    async def check_permission(
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        """Check if current user has all required permissions."""
        # Superuser bypass
        if current_user.is_superuser:
            return current_user

        # Check each permission
        for permission in permissions:
            has_perm = await AuthService.verify_user_permissions(
                db=db,
                user=current_user,
                permission=permission,
            )
            if not has_perm:
                perm_str = permission.value if isinstance(permission, Permission) else permission
                raise AuthorizationException(
                    message=f"Permission denied: {perm_str}",
                    error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
                    details={"required_permission": perm_str},
                )

        return current_user

    return check_permission


def require_any_permission(
    *permissions: Permission | str,
) -> Callable[..., Awaitable[User]]:
    """Dependency factory that checks if user has any of the specified permissions.

    Superusers bypass all permission checks.
    At least one permission must be granted (OR logic).

    Args:
        *permissions: One or more permissions to check.

    Returns:
        Dependency function that validates permissions.

    Usage:
        @router.get("/tasks")
        async def list_tasks(
            user: User = Depends(require_any_permission(
                Permission.TASK_READ,
                Permission.ADMIN_READ,
            )),
        ):
            ...
    """

    async def check_any_permission(
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        """Check if current user has at least one required permission."""
        # Superuser bypass
        if current_user.is_superuser:
            return current_user

        # Check if user has any of the permissions
        for permission in permissions:
            has_perm = await AuthService.verify_user_permissions(
                db=db,
                user=current_user,
                permission=permission,
            )
            if has_perm:
                return current_user

        perm_strs = [p.value if isinstance(p, Permission) else p for p in permissions]
        raise AuthorizationException(
            message=f"Permission denied: requires one of {perm_strs}",
            error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            details={"required_permissions": perm_strs},
        )

    return check_any_permission


def require_role(*roles: RoleType) -> Callable[..., Awaitable[User]]:
    """Dependency factory that checks if user has one of the required roles.

    Superusers bypass role checks.

    Args:
        *roles: One or more roles to accept.

    Returns:
        Dependency function that validates role.

    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(
            user: User = Depends(require_role(RoleType.ADMIN)),
        ):
            ...
    """

    async def check_role(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        """Check if current user has one of the required roles."""
        # Superuser bypass
        if current_user.is_superuser:
            return current_user

        user_role = AuthService.get_user_role(current_user)
        if user_role is None or user_role not in roles:
            role_names = [r.value for r in roles]
            raise AuthorizationException(
                message=f"Role required: {role_names}",
                error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
                details={"required_roles": role_names},
            )

        return current_user

    return check_role


def require_superuser() -> Callable[..., Awaitable[User]]:
    """Dependency that requires superuser access.

    Returns:
        Dependency function that validates superuser status.

    Usage:
        @router.post("/admin/settings")
        async def update_settings(
            user: User = Depends(require_superuser()),
        ):
            ...
    """

    async def check_superuser(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        """Check if current user is a superuser."""
        if not current_user.is_superuser:
            raise AuthorizationException(
                message="Superuser access required",
                error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            )
        return current_user

    return check_superuser


class ResourceOwnershipChecker:
    """Dependency class for checking resource ownership.

    Allows users to access their own resources regardless of role.
    Admins and superusers can access all resources.

    Usage:
        # Create checker for specific resource type
        require_task_owner = ResourceOwnershipChecker("task")

        @router.get("/tasks/{task_id}")
        async def get_task(
            task_id: int,
            user: User = Depends(require_task_owner),
        ):
            ...

        # With additional permission check
        require_task_owner_with_perm = ResourceOwnershipChecker(
            "task",
            permission=Permission.TASK_UPDATE,
        )
    """

    def __init__(
        self,
        resource_type: str,
        permission: Permission | str | None = None,
    ):
        """Initialize ownership checker.

        Args:
            resource_type: Type of resource to check ownership for.
            permission: Optional permission to check in addition to ownership.
        """
        self.resource_type = resource_type
        self.permission = permission

    async def __call__(
        self,
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
        task_id: int | None = None,
        repository_id: int | None = None,
        webhook_id: int | None = None,
        resource_id: int | None = None,
    ) -> User:
        """Check if user owns the resource or has admin access.

        This method accepts common resource ID parameter names and uses
        the first non-None value it finds.

        Args:
            current_user: Current authenticated user.
            db: Database session.
            task_id: Task ID from path (optional).
            repository_id: Repository ID from path (optional).
            webhook_id: Webhook ID from path (optional).
            resource_id: Generic resource ID from path (optional).

        Returns:
            User if access is granted.

        Raises:
            AuthorizationException: If user doesn't have access.
        """
        # Determine the resource ID from parameters
        rid = task_id or repository_id or webhook_id or resource_id

        if rid is None:
            raise AuthorizationException(
                message="Resource ID is required",
                error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            )

        # Superuser bypass
        if current_user.is_superuser:
            return current_user

        # Admin bypass
        user_role = AuthService.get_user_role(current_user)
        if user_role == RoleType.ADMIN:
            return current_user

        # Check ownership
        is_owner = await AuthService.check_resource_ownership(
            db=db,
            user_id=current_user.id,
            resource_id=rid,
            resource_type=self.resource_type,
        )

        if not is_owner:
            raise AuthorizationException(
                message=f"You don't have access to this {self.resource_type}",
                error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
                details={
                    "resource_type": self.resource_type,
                    "resource_id": rid,
                },
            )

        # If permission specified, also check permission
        if self.permission:
            has_perm = await AuthService.verify_user_permissions(
                db=db,
                user=current_user,
                permission=self.permission,
            )
            if not has_perm:
                perm_str = (
                    self.permission.value
                    if isinstance(self.permission, Permission)
                    else self.permission
                )
                raise AuthorizationException(
                    message=f"Permission denied: {perm_str}",
                    error_code=AuthErrorCode.INSUFFICIENT_PERMISSIONS,
                    details={"required_permission": perm_str},
                )

        return current_user


# ============================================================================
# CONVENIENCE DEPENDENCY INSTANCES
# ============================================================================

# Role-based dependencies
require_admin = require_role(RoleType.ADMIN)
require_developer_or_admin = require_role(RoleType.ADMIN, RoleType.DEVELOPER)

# Alias for clarity
require_authenticated = get_current_user
