"""Pydantic schemas for task-related operations."""

from datetime import datetime

from pydantic import BaseModel, Field

from src.models.task import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    """Base task schema with common fields."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    repository_id: int | None = None


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, min_length=1)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    repository_id: int | None = None


class TaskResponse(TaskBase):
    """Schema for task responses."""

    id: int
    status: TaskStatus
    user_id: int
    repository_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Schema for paginated task list responses."""

    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
