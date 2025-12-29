"""Pydantic schemas for permission and role operations."""

from datetime import datetime

from pydantic import BaseModel, Field

from src.models.role import RoleType


class PermissionBase(BaseModel):
    """Base permission schema."""

    resource: str = Field(..., description="Resource type (task, repository, etc.)")
    action: str = Field(..., description="Action type (create, read, update, delete)")


class PermissionCreate(PermissionBase):
    """Schema for creating a permission."""

    description: str | None = Field(None, max_length=500)


class PermissionResponse(PermissionBase):
    """Schema for permission responses."""

    id: int
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    @property
    def code(self) -> str:
        """Get permission code in resource:action format."""
        return f"{self.resource}:{self.action}"

    model_config = {"from_attributes": True}


class RoleBase(BaseModel):
    """Base role schema."""

    name: RoleType = Field(..., description="Role type (admin, developer, viewer)")


class RoleCreate(RoleBase):
    """Schema for creating a role."""

    description: str | None = Field(None, max_length=500)
    permission_ids: list[int] = Field(default_factory=list)


class RoleResponse(RoleBase):
    """Schema for role responses."""

    id: int
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoleWithPermissionsResponse(RoleResponse):
    """Schema for role responses with permissions included."""

    permissions: list[PermissionResponse] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    """Schema for updating a role."""

    description: str | None = None
    permission_ids: list[int] | None = None


class UserRoleAssignment(BaseModel):
    """Schema for assigning a role to a user."""

    role_id: int = Field(..., description="Role ID to assign")


class UserPermissionsResponse(BaseModel):
    """Schema for user permissions response."""

    user_id: int
    role: RoleResponse | None = None
    is_superuser: bool
    permissions: list[str] = Field(
        default_factory=list,
        description="List of permission codes the user has (e.g., 'task:create')",
    )


class PermissionCheckRequest(BaseModel):
    """Schema for checking a permission."""

    permission: str = Field(
        ...,
        description="Permission code to check (e.g., 'task:create')",
        pattern=r"^[a-z_]+:[a-z_]+$",
    )
    resource_id: int | None = Field(None, description="Optional resource ID for ownership check")
    resource_type: str | None = Field(
        None, description="Optional resource type for ownership check"
    )


class PermissionCheckResponse(BaseModel):
    """Schema for permission check response."""

    has_permission: bool
    permission: str
    reason: str | None = Field(None, description="Reason for permission grant/denial")
