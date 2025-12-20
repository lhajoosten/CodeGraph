"""Pydantic schemas for repository-related operations."""

from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class RepositoryBase(BaseModel):
    """Base repository schema with common fields."""

    name: str = Field(..., min_length=1, max_length=255)
    github_url: str = Field(..., min_length=1, max_length=500)
    default_branch: str = Field("main", max_length=100)
    description: str | None = Field(None, max_length=1000)


class RepositoryCreate(RepositoryBase):
    """Schema for creating a new repository."""

    pass


class RepositoryUpdate(BaseModel):
    """Schema for updating a repository."""

    name: str | None = Field(None, min_length=1, max_length=255)
    github_url: str | None = Field(None, min_length=1, max_length=500)
    default_branch: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=1000)


class RepositoryResponse(RepositoryBase):
    """Schema for repository responses."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
