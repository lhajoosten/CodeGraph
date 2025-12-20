"""API endpoints for task management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.database import get_db
from src.models.task import Task
from src.models.user import User
from src.schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate

router = APIRouter()


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    """
    Create a new coding task.

    Args:
        task_data: Task creation data
        db: Database session
        current_user: Current authenticated user

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
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
) -> TaskListResponse:
    """
    List tasks for the current user with pagination.

    Args:
        db: Database session
        current_user: Current authenticated user
        page: Page number (starts at 1)
        page_size: Number of items per page

    Returns:
        Paginated list of tasks
    """
    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count
    count_result = await db.execute(
        select(Task).where(Task.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())

    # Get paginated tasks
    result = await db.execute(
        select(Task)
        .where(Task.user_id == current_user.id)
        .order_by(desc(Task.created_at))
        .offset(offset)
        .limit(page_size)
    )
    tasks = result.scalars().all()

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
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    """
    Get a specific task by ID.

    Args:
        task_id: Task ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Task instance

    Raises:
        HTTPException: If task not found or unauthorized
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task",
        )

    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    """
    Update a task.

    Args:
        task_id: Task ID
        task_data: Task update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated task instance

    Raises:
        HTTPException: If task not found or unauthorized
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task",
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
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete a task.

    Args:
        task_id: Task ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If task not found or unauthorized
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task",
        )

    await db.delete(task)
    await db.commit()
