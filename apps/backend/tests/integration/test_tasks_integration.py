"""Integration tests for task management endpoints with real database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import create_access_token, get_password_hash
from src.models.task import Task, TaskPriority, TaskStatus
from src.models.user import User


@pytest.fixture
async def auth_token(db_session: AsyncSession) -> str:
    """Create an authenticated user and return access token."""
    user = User(
        email="taskuser@example.com",
        hashed_password=get_password_hash("pass123"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return create_access_token({"sub": str(user.id)})


@pytest.fixture
async def user_with_tasks(db_session: AsyncSession) -> tuple[User, str]:
    """Create user with some tasks and return user + token."""
    user = User(
        email="taskcreator@example.com",
        hashed_password=get_password_hash("pass123"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create some tasks
    for i in range(3):
        task = Task(
            title=f"Task {i+1}",
            description=f"Description for task {i+1}",
            status=TaskStatus.PENDING if i == 0 else TaskStatus.IN_PROGRESS,
            priority=TaskPriority.MEDIUM,
            user_id=user.id,
        )
        db_session.add(task)

    await db_session.commit()

    token = create_access_token({"sub": str(user.id)})
    return user, token


@pytest.mark.asyncio
class TestTaskIntegration:
    """Integration tests for task management with PostgreSQL."""

    async def test_create_task_success(
        self, client: TestClient, auth_token: str
    ) -> None:
        """Test successful task creation."""
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Fix bug in login",
                "description": "Users cannot login with special characters",
                "priority": "high",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Fix bug in login"
        assert data["priority"] == "high"
        assert data["status"] == "pending"

    async def test_create_task_unauthorized(self, client: TestClient) -> None:
        """Test task creation fails without authentication."""
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Unauthorized task",
                "description": "This should fail",
                "priority": "medium",
            },
        )
        assert response.status_code == 401

    async def test_list_user_tasks(
        self, client: TestClient, user_with_tasks: tuple[User, str]
    ) -> None:
        """Test retrieving user's tasks."""
        user, token = user_with_tasks

        response = client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(task["user_id"] == user.id for task in data)

    async def test_get_task_detail(
        self, client: TestClient, db_session: AsyncSession, auth_token: str
    ) -> None:
        """Test retrieving a single task."""
        # Get user from token
        user = await db_session.get(User, 1)
        if not user:
            user = User(
                email="detailuser@example.com",
                hashed_password=get_password_hash("pass123"),
            )
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)

        # Create task
        task = Task(
            title="Test Task",
            description="Test Description",
            user_id=user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        # Get task
        response = client.get(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["id"] == task.id

    async def test_update_task(
        self, client: TestClient, user_with_tasks: tuple[User, str], db_session: AsyncSession
    ) -> None:
        """Test updating a task."""
        user, token = user_with_tasks

        # Get first task
        tasks = await db_session.query(Task).filter(Task.user_id == user.id).all()
        task_id = tasks[0].id if tasks else None

        if not task_id:
            pytest.skip("No tasks found")

        # Update task
        response = client.patch(
            f"/api/v1/tasks/{task_id}",
            json={
                "title": "Updated Task Title",
                "status": "completed",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task Title"
        assert data["status"] == "completed"

    async def test_delete_task(
        self, client: TestClient, user_with_tasks: tuple[User, str], db_session: AsyncSession
    ) -> None:
        """Test deleting a task."""
        user, token = user_with_tasks

        # Get first task
        tasks = await db_session.query(Task).filter(Task.user_id == user.id).all()
        task_id = tasks[0].id if tasks else None

        if not task_id:
            pytest.skip("No tasks found")

        # Delete task
        response = client.delete(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 204

        # Verify deletion
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404

    async def test_get_nonexistent_task(
        self, client: TestClient, auth_token: str
    ) -> None:
        """Test getting a non-existent task."""
        response = client.get(
            "/api/v1/tasks/99999",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404
