"""Integration tests for task management endpoints with real database."""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import create_access_token, get_password_hash
from src.models.permission import Permission as PermissionModel
from src.models.permission import RolePermission
from src.models.role import Role, RoleType
from src.models.task import Task, TaskPriority, TaskStatus
from src.models.user import User


@pytest_asyncio.fixture
async def developer_role(db_session: AsyncSession) -> Role:
    """Create a developer role with necessary permissions."""
    role = Role(name=RoleType.DEVELOPER, description="Developer role")
    db_session.add(role)
    await db_session.commit()
    await db_session.refresh(role)

    # Create task permissions
    task_perms = ["task:create", "task:read", "task:update", "task:delete", "task:execute"]
    for code in task_perms:
        resource, action = code.split(":")
        perm = PermissionModel(resource=resource, action=action)
        db_session.add(perm)
        await db_session.flush()
        role_perm = RolePermission(role_id=role.id, permission_id=perm.id)
        db_session.add(role_perm)

    await db_session.commit()
    await db_session.refresh(role)
    return role


@pytest_asyncio.fixture
async def auth_token(db_session: AsyncSession, developer_role: Role) -> str:
    """Create an authenticated user with developer role and return access token."""
    user = User(
        email="taskuser@example.com",
        hashed_password=get_password_hash("pass1234"),
        role_id=developer_role.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return create_access_token({"sub": str(user.id)})


@pytest_asyncio.fixture
async def user_with_tasks(db_session: AsyncSession, developer_role: Role) -> tuple[User, str]:
    """Create user with some tasks and return user + token."""
    user = User(
        email="taskcreator@example.com",
        hashed_password=get_password_hash("pass1234"),
        role_id=developer_role.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create some tasks
    for i in range(3):
        task = Task(
            title=f"Task {i + 1}",
            description=f"Description for task {i + 1}",
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

    async def test_create_task_success(self, client: AsyncClient, auth_token: str) -> None:
        """Test successful task creation."""
        response = await client.post(
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

    async def test_create_task_unauthorized(self, client: AsyncClient) -> None:
        """Test task creation fails without authentication."""
        response = await client.post(
            "/api/v1/tasks",
            json={
                "title": "Unauthorized task",
                "description": "This should fail",
                "priority": "medium",
            },
        )
        assert response.status_code == 401

    async def test_list_user_tasks(
        self, client: AsyncClient, user_with_tasks: tuple[User, str]
    ) -> None:
        """Test retrieving user's tasks."""
        user, token = user_with_tasks

        response = await client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3
        assert all(task["user_id"] == user.id for task in data["items"])

    async def test_get_task_detail(
        self, client: AsyncClient, db_session: AsyncSession, auth_token: str
    ) -> None:
        """Test retrieving a single task."""
        # Setup async database operations
        user = await db_session.get(User, 1)
        if not user:
            user = User(
                email="detailuser@example.com",
                hashed_password=get_password_hash("pass1234"),
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
        response = await client.get(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["id"] == task.id

    async def test_update_task(
        self, client: AsyncClient, user_with_tasks: tuple[User, str], db_session: AsyncSession
    ) -> None:
        """Test updating a task."""
        from sqlalchemy import select

        user, token = user_with_tasks

        # Get first task
        result = await db_session.execute(select(Task).where(Task.user_id == user.id))
        tasks = result.scalars().all()
        task_id = tasks[0].id if tasks else None

        if not task_id:
            pytest.skip("No tasks found")

        # Update task
        response = await client.patch(
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
        self, client: AsyncClient, user_with_tasks: tuple[User, str], db_session: AsyncSession
    ) -> None:
        """Test deleting a task."""
        from sqlalchemy import select

        user, token = user_with_tasks

        # Get first task
        result = await db_session.execute(select(Task).where(Task.user_id == user.id))
        tasks = result.scalars().all()
        task_id = tasks[0].id if tasks else None

        if not task_id:
            pytest.skip("No tasks found")

        # Delete task
        response = await client.delete(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 204

        # Verify deletion - returns 403 (permission denied) because:
        # 1. The task no longer exists, so ownership check fails
        # 2. We don't reveal whether a resource exists or not (security best practice)
        response = await client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    async def test_get_nonexistent_task(self, client: AsyncClient, auth_token: str) -> None:
        """Test getting a non-existent task returns 403 (not 404).

        We return 403 instead of 404 to avoid revealing whether resources exist
        to users who don't have access (security best practice).
        """
        response = await client.get(
            "/api/v1/tasks/99999",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Returns 403 because ownership check fails (resource doesn't exist)
        # This prevents enumeration attacks
        assert response.status_code == 403
