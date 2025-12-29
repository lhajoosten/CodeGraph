"""API endpoints for task management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import (
    ResourceOwnershipChecker,
    require_permission,
)
from src.core.database import get_db
from src.core.permissions import Permission
from src.models.role import RoleType
from src.models.task import Task
from src.models.user import User
from src.schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate
from src.services.auth_service import AuthService

router = APIRouter()

# Dependency instances for resource ownership
require_task_owner = ResourceOwnershipChecker("task")


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission(Permission.TASK_CREATE))],
) -> Task:
    """
    Create a new coding task.

    Requires: task:create permission

    Args:
        task_data: Task creation data
        db: Database session
        current_user: Current authenticated user with task:create permission

    Returns:
        Created task instance
    """
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        user_id=current_user.id,
        repository_id=task_data.repository_id,
    )

    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return new_task


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission(Permission.TASK_READ))],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
) -> TaskListResponse:
    """
    List tasks with pagination.

    Requires: task:read permission

    - Admins and superusers see all tasks
    - Other users see only their own tasks

    Args:
        db: Database session
        current_user: Current authenticated user with task:read permission
        page: Page number (starts at 1)
        page_size: Number of items per page

    Returns:
        Paginated list of tasks
    """
    offset = (page - 1) * page_size

    # Admins and superusers see all tasks, others see only their own
    user_role = AuthService.get_user_role(current_user)
    if current_user.is_superuser or user_role == RoleType.ADMIN:
        base_query = select(Task)
        count_query = select(func.count()).select_from(Task)
    else:
        base_query = select(Task).where(Task.user_id == current_user.id)
        count_query = select(func.count()).select_from(Task).where(Task.user_id == current_user.id)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated tasks
    result = await db.execute(
        base_query.order_by(desc(Task.created_at)).offset(offset).limit(page_size)
    )
    tasks = list(result.scalars().all())

    return TaskListResponse(
        items=tasks,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_task_owner)],
) -> Task:
    """
    Get a specific task by ID.

    Requires: Ownership of the task, or admin/superuser access

    Args:
        task_id: Task ID
        db: Database session
        current_user: Current authenticated user (ownership verified by dependency)

    Returns:
        Task instance

    Raises:
        HTTPException: If task not found
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_task_owner)],
) -> Task:
    """
    Update a task.

    Requires: Ownership of the task, or admin/superuser access

    Args:
        task_id: Task ID
        task_data: Task update data
        db: Database session
        current_user: Current authenticated user (ownership verified by dependency)

    Returns:
        Updated task instance

    Raises:
        HTTPException: If task not found
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Update fields
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_task_owner)],
) -> None:
    """
    Delete a task.

    Requires: Ownership of the task, or admin/superuser access

    Args:
        task_id: Task ID
        db: Database session
        current_user: Current authenticated user (ownership verified by dependency)

    Raises:
        HTTPException: If task not found
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await db.delete(task)
    await db.commit()
