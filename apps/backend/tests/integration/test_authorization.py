"""Integration tests for authorization and RBAC system."""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.permissions import Permission
from src.core.security import create_access_token, get_password_hash
from src.models.permission import Permission as PermissionModel
from src.models.permission import RolePermission
from src.models.role import Role, RoleType
from src.models.task import Task, TaskPriority
from src.models.user import User


async def create_permissions(
    db_session: AsyncSession,
    permission_codes: list[str],
) -> dict[str, PermissionModel]:
    """Helper to create all permissions once."""
    permissions = {}
    for code in permission_codes:
        resource, action = code.split(":")
        perm = PermissionModel(resource=resource, action=action)
        db_session.add(perm)
        await db_session.flush()
        permissions[code] = perm
    await db_session.commit()
    return permissions


async def create_role_with_permissions(
    db_session: AsyncSession,
    role_type: RoleType,
    permission_codes: list[str],
    all_permissions: dict[str, PermissionModel],
) -> Role:
    """Helper to create a role with specific permissions."""
    role = Role(name=role_type, description=f"{role_type.value} role")
    db_session.add(role)
    await db_session.commit()
    await db_session.refresh(role)

    # Associate existing permissions via association table
    for code in permission_codes:
        perm = all_permissions.get(code)
        if perm:
            role_perm = RolePermission(role_id=role.id, permission_id=perm.id)
            db_session.add(role_perm)

    await db_session.commit()

    # Re-fetch role with permissions loaded
    result = await db_session.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == role.id)
    )
    return result.scalar_one()


async def create_user_with_role(
    db_session: AsyncSession,
    email: str,
    role: Role | None = None,
    is_superuser: bool = False,
) -> tuple[User, str]:
    """Helper to create a user with optional role and return user + token."""
    user = User(
        email=email,
        hashed_password=get_password_hash("password123"),
        is_superuser=is_superuser,
        role_id=role.id if role else None,
    )
    db_session.add(user)
    await db_session.commit()

    # Re-fetch user with role loaded
    result = await db_session.execute(
        select(User).options(selectinload(User.role)).where(User.id == user.id)
    )
    user = result.scalar_one()

    token = create_access_token({"sub": str(user.id)})
    return user, token


@pytest_asyncio.fixture
async def roles(db_session: AsyncSession) -> dict[str, Role]:
    """Create all roles with their permissions."""
    # First, create all permissions once
    all_perm_codes = [p.value for p in Permission]
    all_permissions = await create_permissions(db_session, all_perm_codes)

    # Admin role - all permissions
    admin_perms = [p.value for p in Permission]
    admin_role = await create_role_with_permissions(
        db_session, RoleType.ADMIN, admin_perms, all_permissions
    )

    # Developer role - subset of permissions
    developer_perms = [
        "task:create",
        "task:read",
        "task:update",
        "task:delete",
        "task:execute",
        "user:read",
        "user:update",
        "repository:create",
        "repository:read",
        "repository:update",
        "repository:delete",
        "agent:read",
        "agent:execute",
        "webhook:create",
        "webhook:read",
        "webhook:update",
        "webhook:delete",
        "metrics:read",
        "council:read",
    ]
    developer_role = await create_role_with_permissions(
        db_session, RoleType.DEVELOPER, developer_perms, all_permissions
    )

    # Viewer role - read-only
    viewer_perms = [
        "task:read",
        "user:read",
        "repository:read",
        "agent:read",
        "webhook:read",
        "metrics:read",
        "council:read",
    ]
    viewer_role = await create_role_with_permissions(
        db_session, RoleType.VIEWER, viewer_perms, all_permissions
    )

    return {
        "admin": admin_role,
        "developer": developer_role,
        "viewer": viewer_role,
    }


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, roles: dict[str, Role]) -> tuple[User, str]:
    """Create admin user and return user + token."""
    return await create_user_with_role(db_session, "admin@example.com", role=roles["admin"])


@pytest_asyncio.fixture
async def developer_user(db_session: AsyncSession, roles: dict[str, Role]) -> tuple[User, str]:
    """Create developer user and return user + token."""
    return await create_user_with_role(db_session, "developer@example.com", role=roles["developer"])


@pytest_asyncio.fixture
async def viewer_user(db_session: AsyncSession, roles: dict[str, Role]) -> tuple[User, str]:
    """Create viewer user and return user + token."""
    return await create_user_with_role(db_session, "viewer@example.com", role=roles["viewer"])


@pytest_asyncio.fixture
async def superuser(db_session: AsyncSession) -> tuple[User, str]:
    """Create superuser without role and return user + token."""
    return await create_user_with_role(db_session, "super@example.com", is_superuser=True)


@pytest_asyncio.fixture
async def user_no_role(db_session: AsyncSession) -> tuple[User, str]:
    """Create user without any role and return user + token."""
    return await create_user_with_role(db_session, "norole@example.com")


@pytest.mark.asyncio
class TestTaskPermissions:
    """Test task endpoint authorization."""

    async def test_developer_can_create_task(
        self, client: AsyncClient, developer_user: tuple[User, str]
    ) -> None:
        """Developer should be able to create tasks."""
        _, token = developer_user
        response = await client.post(
            "/api/v1/tasks",
            json={"title": "Dev Task", "description": "Test", "priority": "medium"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        assert response.json()["title"] == "Dev Task"

    async def test_viewer_cannot_create_task(
        self, client: AsyncClient, viewer_user: tuple[User, str]
    ) -> None:
        """Viewer should not be able to create tasks."""
        _, token = viewer_user
        response = await client.post(
            "/api/v1/tasks",
            json={"title": "Viewer Task", "description": "Test", "priority": "medium"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert "Permission denied" in response.json()["detail"]

    async def test_viewer_can_read_own_tasks(
        self, client: AsyncClient, db_session: AsyncSession, viewer_user: tuple[User, str]
    ) -> None:
        """Viewer should be able to read tasks."""
        user, token = viewer_user

        # Create a task directly in DB (simulating another user created it)
        task = Task(
            title="Existing Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=user.id,
        )
        db_session.add(task)
        await db_session.commit()

        # Viewer should be able to list tasks
        response = await client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

    async def test_admin_can_delete_any_task(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: tuple[User, str],
        developer_user: tuple[User, str],
    ) -> None:
        """Admin should be able to delete any user's task."""
        dev_user, _ = developer_user
        admin_user_obj, admin_token = admin_user

        # Create task owned by developer
        task = Task(
            title="Dev's Task",
            description="Test",
            priority=TaskPriority.LOW,
            user_id=dev_user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        # Admin should be able to delete it
        response = await client.delete(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 204

    async def test_developer_cannot_delete_others_task(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        developer_user: tuple[User, str],
        viewer_user: tuple[User, str],
    ) -> None:
        """Developer should not be able to delete another user's task."""
        viewer, _ = viewer_user
        _, dev_token = developer_user

        # Create task owned by viewer
        task = Task(
            title="Viewer's Task",
            description="Test",
            priority=TaskPriority.LOW,
            user_id=viewer.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        # Developer should NOT be able to delete it
        response = await client.delete(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {dev_token}"},
        )
        assert response.status_code == 403

    async def test_user_can_delete_own_task(
        self, client: AsyncClient, db_session: AsyncSession, developer_user: tuple[User, str]
    ) -> None:
        """User should be able to delete their own task."""
        user, token = developer_user

        # Create task owned by user
        task = Task(
            title="My Task",
            description="Test",
            priority=TaskPriority.HIGH,
            user_id=user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        # User should be able to delete their own task
        response = await client.delete(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 204


@pytest.mark.asyncio
class TestSuperuserBypass:
    """Test superuser bypasses all permission checks."""

    async def test_superuser_can_create_task(
        self, client: AsyncClient, superuser: tuple[User, str]
    ) -> None:
        """Superuser can create tasks without having task:create permission."""
        _, token = superuser
        response = await client.post(
            "/api/v1/tasks",
            json={"title": "Super Task", "description": "Test", "priority": "high"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201

    async def test_superuser_can_delete_any_task(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        superuser: tuple[User, str],
        developer_user: tuple[User, str],
    ) -> None:
        """Superuser can delete any user's task."""
        dev_user, _ = developer_user
        _, super_token = superuser

        task = Task(
            title="Dev's Task",
            description="Test",
            priority=TaskPriority.LOW,
            user_id=dev_user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        response = await client.delete(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {super_token}"},
        )
        assert response.status_code == 204

    async def test_superuser_can_access_admin_endpoints(
        self, client: AsyncClient, superuser: tuple[User, str], roles: dict[str, Role]
    ) -> None:
        """Superuser can access admin endpoints."""
        _, token = superuser

        # Access admin roles endpoint
        response = await client.get(
            "/api/v1/admin/roles",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200


@pytest.mark.asyncio
class TestUserWithNoRole:
    """Test users without any role assigned."""

    async def test_no_role_cannot_create_task(
        self, client: AsyncClient, user_no_role: tuple[User, str]
    ) -> None:
        """User without role cannot create tasks."""
        _, token = user_no_role
        response = await client.post(
            "/api/v1/tasks",
            json={"title": "No Role Task", "description": "Test", "priority": "medium"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    async def test_no_role_cannot_read_tasks(
        self, client: AsyncClient, user_no_role: tuple[User, str]
    ) -> None:
        """User without role cannot read tasks."""
        _, token = user_no_role
        response = await client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestAdminEndpoints:
    """Test admin-only endpoints."""

    async def test_admin_can_list_roles(
        self, client: AsyncClient, admin_user: tuple[User, str], roles: dict[str, Role]
    ) -> None:
        """Admin can list all roles."""
        _, token = admin_user
        response = await client.get(
            "/api/v1/admin/roles",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # admin, developer, viewer

    async def test_developer_cannot_access_admin_roles(
        self, client: AsyncClient, developer_user: tuple[User, str]
    ) -> None:
        """Developer cannot access admin endpoints."""
        _, token = developer_user
        response = await client.get(
            "/api/v1/admin/roles",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    async def test_viewer_cannot_access_admin_roles(
        self, client: AsyncClient, viewer_user: tuple[User, str]
    ) -> None:
        """Viewer cannot access admin endpoints."""
        _, token = viewer_user
        response = await client.get(
            "/api/v1/admin/roles",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    async def test_admin_can_get_role_details(
        self, client: AsyncClient, admin_user: tuple[User, str], roles: dict[str, Role]
    ) -> None:
        """Admin can get specific role details."""
        _, token = admin_user
        admin_role = roles["admin"]

        response = await client.get(
            f"/api/v1/admin/roles/{admin_role.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "admin"
        assert "permissions" in data

    async def test_admin_can_list_permissions(
        self, client: AsyncClient, admin_user: tuple[User, str], roles: dict[str, Role]
    ) -> None:
        """Admin can list all permissions."""
        _, token = admin_user
        response = await client.get(
            "/api/v1/admin/permissions",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0  # Should have permissions seeded

    async def test_admin_can_assign_role(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: tuple[User, str],
        user_no_role: tuple[User, str],
        roles: dict[str, Role],
    ) -> None:
        """Admin can assign a role to a user."""
        _, admin_token = admin_user
        target_user, _ = user_no_role
        developer_role = roles["developer"]

        response = await client.post(
            f"/api/v1/admin/users/{target_user.id}/role",
            json={"role_id": developer_role.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"]["name"] == "developer"
        assert "task:create" in data["permissions"]

    async def test_admin_can_remove_role(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: tuple[User, str],
        developer_user: tuple[User, str],
    ) -> None:
        """Admin can remove a role from a user."""
        _, admin_token = admin_user
        dev_user, _ = developer_user

        response = await client.delete(
            f"/api/v1/admin/users/{dev_user.id}/role",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 204

        # Verify user now has no role
        await db_session.refresh(dev_user)
        assert dev_user.role_id is None

    async def test_admin_can_get_user_permissions(
        self, client: AsyncClient, admin_user: tuple[User, str], developer_user: tuple[User, str]
    ) -> None:
        """Admin can get user's permissions."""
        _, admin_token = admin_user
        dev_user, _ = developer_user

        response = await client.get(
            f"/api/v1/admin/users/{dev_user.id}/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == dev_user.id
        assert data["role"]["name"] == "developer"
        assert "task:create" in data["permissions"]

    async def test_admin_can_list_users_with_roles(
        self,
        client: AsyncClient,
        admin_user: tuple[User, str],
        developer_user: tuple[User, str],
        viewer_user: tuple[User, str],
    ) -> None:
        """Admin can list all users with their roles."""
        _, admin_token = admin_user

        response = await client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3  # At least admin, developer, viewer


@pytest.mark.asyncio
class TestResourceOwnership:
    """Test resource ownership checking."""

    async def test_user_can_access_own_task(
        self, client: AsyncClient, db_session: AsyncSession, developer_user: tuple[User, str]
    ) -> None:
        """User can access their own task."""
        user, token = developer_user

        task = Task(
            title="My Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        response = await client.get(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "My Task"

    async def test_user_cannot_access_others_task(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        developer_user: tuple[User, str],
        viewer_user: tuple[User, str],
    ) -> None:
        """User cannot access another user's task."""
        viewer, _ = viewer_user
        _, dev_token = developer_user

        task = Task(
            title="Viewer's Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=viewer.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        response = await client.get(
            f"/api/v1/tasks/{task.id}",
            headers={"Authorization": f"Bearer {dev_token}"},
        )
        assert response.status_code == 403

    async def test_user_can_update_own_task(
        self, client: AsyncClient, db_session: AsyncSession, developer_user: tuple[User, str]
    ) -> None:
        """User can update their own task."""
        user, token = developer_user

        task = Task(
            title="Original Title",
            description="Test",
            priority=TaskPriority.LOW,
            user_id=user.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        response = await client.patch(
            f"/api/v1/tasks/{task.id}",
            json={"title": "Updated Title"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    async def test_user_cannot_update_others_task(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        developer_user: tuple[User, str],
        viewer_user: tuple[User, str],
    ) -> None:
        """User cannot update another user's task."""
        viewer, _ = viewer_user
        _, dev_token = developer_user

        task = Task(
            title="Viewer's Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=viewer.id,
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        response = await client.patch(
            f"/api/v1/tasks/{task.id}",
            json={"title": "Hacked Title"},
            headers={"Authorization": f"Bearer {dev_token}"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestListFiltering:
    """Test that list endpoints filter by ownership for non-admins."""

    async def test_admin_sees_all_tasks(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: tuple[User, str],
        developer_user: tuple[User, str],
    ) -> None:
        """Admin should see all tasks."""
        admin, admin_token = admin_user
        dev, _ = developer_user

        # Create tasks for both users
        for i, u in enumerate([admin, dev]):
            task = Task(
                title=f"Task {i}",
                description="Test",
                priority=TaskPriority.MEDIUM,
                user_id=u.id,
            )
            db_session.add(task)
        await db_session.commit()

        response = await client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

    async def test_developer_sees_only_own_tasks(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: tuple[User, str],
        developer_user: tuple[User, str],
    ) -> None:
        """Developer should only see their own tasks."""
        admin, _ = admin_user
        dev, dev_token = developer_user

        # Create tasks for both users
        admin_task = Task(
            title="Admin's Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=admin.id,
        )
        dev_task = Task(
            title="Dev's Task",
            description="Test",
            priority=TaskPriority.MEDIUM,
            user_id=dev.id,
        )
        db_session.add_all([admin_task, dev_task])
        await db_session.commit()

        response = await client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {dev_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Dev's Task"
