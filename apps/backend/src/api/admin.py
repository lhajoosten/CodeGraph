"""Admin API endpoints for role and permission management.

All endpoints in this module require admin role or superuser access.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import require_admin
from src.core.database import get_db
from src.models.permission import Permission as PermissionModel
from src.models.role import Role
from src.models.user import User
from src.schemas.permission import (
    PermissionResponse,
    RoleResponse,
    RoleWithPermissionsResponse,
    UserPermissionsResponse,
    UserRoleAssignment,
)
from src.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/roles", response_model=list[RoleWithPermissionsResponse])
async def list_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> list[Role]:
    """
    List all roles with their permissions.

    Requires: Admin role or superuser access

    Returns:
        List of all roles with permissions
    """
    result = await db.execute(select(Role).options(selectinload(Role.permissions)))
    return list(result.scalars().all())


@router.get("/roles/{role_id}", response_model=RoleWithPermissionsResponse)
async def get_role(
    role_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> Role:
    """
    Get a specific role with its permissions.

    Requires: Admin role or superuser access

    Args:
        role_id: Role ID

    Returns:
        Role with permissions

    Raises:
        HTTPException: If role not found
    """
    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    return role


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> list[PermissionModel]:
    """
    List all available permissions.

    Requires: Admin role or superuser access

    Returns:
        List of all permissions
    """
    result = await db.execute(select(PermissionModel))
    return list(result.scalars().all())


@router.post("/users/{user_id}/role", response_model=UserPermissionsResponse)
async def assign_user_role(
    user_id: int,
    assignment: UserRoleAssignment,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> UserPermissionsResponse:
    """
    Assign a role to a user.

    Requires: Admin role or superuser access

    Args:
        user_id: User ID to assign role to
        assignment: Role assignment data containing role_id

    Returns:
        Updated user permissions

    Raises:
        HTTPException: If user or role not found
    """
    # Get user
    user_result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get role
    role_result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == assignment.role_id)
    )
    role = role_result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Assign role
    user.role_id = role.id
    await db.commit()
    await db.refresh(user)

    # Get permissions for response
    permissions = AuthService.get_user_permissions(user)

    return UserPermissionsResponse(
        user_id=user.id,
        role=RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            created_at=role.created_at,
            updated_at=role.updated_at,
        ),
        is_superuser=user.is_superuser,
        permissions=list(permissions),
    )


@router.delete("/users/{user_id}/role", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_role(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> None:
    """
    Remove a role from a user.

    Requires: Admin role or superuser access

    Args:
        user_id: User ID to remove role from

    Raises:
        HTTPException: If user not found
    """
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.role_id = None
    await db.commit()


@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
async def get_user_permissions(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> UserPermissionsResponse:
    """
    Get all permissions for a specific user.

    Requires: Admin role or superuser access

    Args:
        user_id: User ID

    Returns:
        User permissions including role and superuser status

    Raises:
        HTTPException: If user not found
    """
    user = await AuthService.get_user_with_role(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    permissions = AuthService.get_user_permissions(user)

    role_response = None
    if user.role:
        role_response = RoleResponse(
            id=user.role.id,
            name=user.role.name,
            description=user.role.description,
            created_at=user.role.created_at,
            updated_at=user.role.updated_at,
        )

    return UserPermissionsResponse(
        user_id=user.id,
        role=role_response,
        is_superuser=user.is_superuser,
        permissions=list(permissions),
    )


@router.get("/users", response_model=list[UserPermissionsResponse])
async def list_users_with_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> list[UserPermissionsResponse]:
    """
    List all users with their roles and permissions.

    Requires: Admin role or superuser access

    Returns:
        List of users with their permissions
    """
    result = await db.execute(select(User).options(selectinload(User.role)))
    users = result.scalars().all()

    responses = []
    for user in users:
        permissions = AuthService.get_user_permissions(user)

        role_response = None
        if user.role:
            role_response = RoleResponse(
                id=user.role.id,
                name=user.role.name,
                description=user.role.description,
                created_at=user.role.created_at,
                updated_at=user.role.updated_at,
            )

        responses.append(
            UserPermissionsResponse(
                user_id=user.id,
                role=role_response,
                is_superuser=user.is_superuser,
                permissions=list(permissions),
            )
        )

    return responses
