"""Unit tests for permission constants and helper functions."""

import pytest

from src.core.permissions import (
    ADMIN_PERMISSIONS,
    DEVELOPER_PERMISSIONS,
    VIEWER_PERMISSIONS,
    Permission,
    get_role_permissions,
    has_permission,
)
from src.models.role import RoleType


class TestPermissionEnum:
    """Tests for Permission enum."""

    def test_permission_count(self) -> None:
        """Verify total number of permissions."""
        assert len(Permission) == 26

    def test_permission_format(self) -> None:
        """All permissions follow resource:action format."""
        for perm in Permission:
            parts = perm.value.split(":")
            assert len(parts) == 2, f"Permission {perm.value} should have format resource:action"
            assert parts[0] != "", f"Permission {perm.value} should have a resource"
            assert parts[1] != "", f"Permission {perm.value} should have an action"

    def test_task_permissions_exist(self) -> None:
        """Verify all task permissions exist."""
        task_perms = [
            Permission.TASK_CREATE,
            Permission.TASK_READ,
            Permission.TASK_UPDATE,
            Permission.TASK_DELETE,
            Permission.TASK_EXECUTE,
        ]
        for perm in task_perms:
            assert perm.value.startswith("task:")

    def test_user_permissions_exist(self) -> None:
        """Verify all user permissions exist."""
        user_perms = [
            Permission.USER_READ,
            Permission.USER_UPDATE,
            Permission.USER_DELETE,
            Permission.USER_MANAGE,
        ]
        for perm in user_perms:
            assert perm.value.startswith("user:")

    def test_admin_permissions_exist(self) -> None:
        """Verify admin-specific permissions exist."""
        admin_perms = [
            Permission.ADMIN_READ,
            Permission.ADMIN_MANAGE,
        ]
        for perm in admin_perms:
            assert perm.value.startswith("admin:")

    def test_permission_string_conversion(self) -> None:
        """Permission values can be used as strings."""
        assert Permission.TASK_CREATE.value == "task:create"
        assert str(Permission.TASK_CREATE) == "Permission.TASK_CREATE"
        assert Permission("task:create") == Permission.TASK_CREATE


class TestRolePermissionMappings:
    """Tests for role-permission mappings."""

    def test_admin_has_all_permissions(self) -> None:
        """Admin role has all permissions."""
        assert ADMIN_PERMISSIONS == frozenset(Permission)
        assert len(ADMIN_PERMISSIONS) == 26

    def test_developer_permission_count(self) -> None:
        """Developer role has expected number of permissions."""
        assert len(DEVELOPER_PERMISSIONS) == 19

    def test_viewer_permission_count(self) -> None:
        """Viewer role has expected number of permissions."""
        assert len(VIEWER_PERMISSIONS) == 7

    def test_viewer_has_subset_of_developer(self) -> None:
        """Viewer permissions should be subset of developer permissions."""
        assert VIEWER_PERMISSIONS.issubset(DEVELOPER_PERMISSIONS)

    def test_developer_has_subset_of_admin(self) -> None:
        """Developer permissions should be subset of admin permissions."""
        assert DEVELOPER_PERMISSIONS.issubset(ADMIN_PERMISSIONS)

    def test_viewer_cannot_create_tasks(self) -> None:
        """Viewer should not have task:create permission."""
        assert Permission.TASK_CREATE not in VIEWER_PERMISSIONS

    def test_viewer_can_read_tasks(self) -> None:
        """Viewer should have task:read permission."""
        assert Permission.TASK_READ in VIEWER_PERMISSIONS

    def test_developer_can_create_tasks(self) -> None:
        """Developer should have task:create permission."""
        assert Permission.TASK_CREATE in DEVELOPER_PERMISSIONS

    def test_developer_cannot_manage_admin(self) -> None:
        """Developer should not have admin:manage permission."""
        assert Permission.ADMIN_MANAGE not in DEVELOPER_PERMISSIONS

    def test_admin_can_manage_admin(self) -> None:
        """Admin should have admin:manage permission."""
        assert Permission.ADMIN_MANAGE in ADMIN_PERMISSIONS

    def test_viewer_cannot_delete_users(self) -> None:
        """Viewer should not have user:delete permission."""
        assert Permission.USER_DELETE not in VIEWER_PERMISSIONS

    def test_developer_cannot_delete_users(self) -> None:
        """Developer should not have user:delete permission."""
        assert Permission.USER_DELETE not in DEVELOPER_PERMISSIONS


class TestHasPermissionFunction:
    """Tests for has_permission helper function."""

    def test_admin_has_all_permissions(self) -> None:
        """Admin should have all permissions."""
        for perm in Permission:
            assert has_permission(RoleType.ADMIN, perm) is True

    def test_viewer_read_only_permissions(self) -> None:
        """Viewer should only have read-type permissions."""
        # Viewer should have these
        assert has_permission(RoleType.VIEWER, Permission.TASK_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.USER_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.REPOSITORY_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.AGENT_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.WEBHOOK_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.METRICS_READ) is True
        assert has_permission(RoleType.VIEWER, Permission.COUNCIL_READ) is True

        # Viewer should NOT have these
        assert has_permission(RoleType.VIEWER, Permission.TASK_CREATE) is False
        assert has_permission(RoleType.VIEWER, Permission.TASK_UPDATE) is False
        assert has_permission(RoleType.VIEWER, Permission.TASK_DELETE) is False
        assert has_permission(RoleType.VIEWER, Permission.USER_UPDATE) is False
        assert has_permission(RoleType.VIEWER, Permission.ADMIN_MANAGE) is False

    def test_developer_permissions(self) -> None:
        """Developer should have CRUD on tasks and repos, but not admin."""
        # Developer should have these
        assert has_permission(RoleType.DEVELOPER, Permission.TASK_CREATE) is True
        assert has_permission(RoleType.DEVELOPER, Permission.TASK_READ) is True
        assert has_permission(RoleType.DEVELOPER, Permission.TASK_UPDATE) is True
        assert has_permission(RoleType.DEVELOPER, Permission.TASK_DELETE) is True
        assert has_permission(RoleType.DEVELOPER, Permission.TASK_EXECUTE) is True
        assert has_permission(RoleType.DEVELOPER, Permission.REPOSITORY_CREATE) is True
        assert has_permission(RoleType.DEVELOPER, Permission.AGENT_EXECUTE) is True

        # Developer should NOT have these
        assert has_permission(RoleType.DEVELOPER, Permission.ADMIN_READ) is False
        assert has_permission(RoleType.DEVELOPER, Permission.ADMIN_MANAGE) is False
        assert has_permission(RoleType.DEVELOPER, Permission.USER_DELETE) is False
        assert has_permission(RoleType.DEVELOPER, Permission.USER_MANAGE) is False


class TestGetRolePermissionsFunction:
    """Tests for get_role_permissions helper function."""

    def test_get_admin_permissions(self) -> None:
        """get_role_permissions returns all permissions for admin."""
        perms = get_role_permissions(RoleType.ADMIN)
        assert perms == ADMIN_PERMISSIONS
        assert len(perms) == 26

    def test_get_developer_permissions(self) -> None:
        """get_role_permissions returns correct permissions for developer."""
        perms = get_role_permissions(RoleType.DEVELOPER)
        assert perms == DEVELOPER_PERMISSIONS
        assert len(perms) == 19

    def test_get_viewer_permissions(self) -> None:
        """get_role_permissions returns correct permissions for viewer."""
        perms = get_role_permissions(RoleType.VIEWER)
        assert perms == VIEWER_PERMISSIONS
        assert len(perms) == 7

    def test_returns_frozenset(self) -> None:
        """get_role_permissions returns immutable frozenset."""
        perms = get_role_permissions(RoleType.ADMIN)
        assert isinstance(perms, frozenset)
        # Cannot modify
        with pytest.raises(AttributeError):
            perms.add(Permission.TASK_CREATE)  # type: ignore[attr-defined]


class TestPermissionResourceGroups:
    """Tests for permission grouping by resource."""

    def test_task_resource_permissions(self) -> None:
        """Verify task resource has all expected permissions."""
        task_perms = [p for p in Permission if p.value.startswith("task:")]
        assert len(task_perms) == 5
        task_actions = {p.value.split(":")[1] for p in task_perms}
        assert task_actions == {"create", "read", "update", "delete", "execute"}

    def test_user_resource_permissions(self) -> None:
        """Verify user resource has all expected permissions."""
        user_perms = [p for p in Permission if p.value.startswith("user:")]
        assert len(user_perms) == 4
        user_actions = {p.value.split(":")[1] for p in user_perms}
        assert user_actions == {"read", "update", "delete", "manage"}

    def test_repository_resource_permissions(self) -> None:
        """Verify repository resource has all expected permissions."""
        repo_perms = [p for p in Permission if p.value.startswith("repository:")]
        assert len(repo_perms) == 4
        repo_actions = {p.value.split(":")[1] for p in repo_perms}
        assert repo_actions == {"create", "read", "update", "delete"}

    def test_agent_resource_permissions(self) -> None:
        """Verify agent resource has all expected permissions."""
        agent_perms = [p for p in Permission if p.value.startswith("agent:")]
        assert len(agent_perms) == 3
        agent_actions = {p.value.split(":")[1] for p in agent_perms}
        assert agent_actions == {"read", "execute", "manage"}

    def test_webhook_resource_permissions(self) -> None:
        """Verify webhook resource has all expected permissions."""
        webhook_perms = [p for p in Permission if p.value.startswith("webhook:")]
        assert len(webhook_perms) == 4
        webhook_actions = {p.value.split(":")[1] for p in webhook_perms}
        assert webhook_actions == {"create", "read", "update", "delete"}

    def test_metrics_resource_permissions(self) -> None:
        """Verify metrics resource has all expected permissions."""
        metrics_perms = [p for p in Permission if p.value.startswith("metrics:")]
        assert len(metrics_perms) == 2
        metrics_actions = {p.value.split(":")[1] for p in metrics_perms}
        assert metrics_actions == {"read", "manage"}

    def test_council_resource_permissions(self) -> None:
        """Verify council resource has all expected permissions."""
        council_perms = [p for p in Permission if p.value.startswith("council:")]
        assert len(council_perms) == 2
        council_actions = {p.value.split(":")[1] for p in council_perms}
        assert council_actions == {"read", "manage"}

    def test_admin_resource_permissions(self) -> None:
        """Verify admin resource has all expected permissions."""
        admin_perms = [p for p in Permission if p.value.startswith("admin:")]
        assert len(admin_perms) == 2
        admin_actions = {p.value.split(":")[1] for p in admin_perms}
        assert admin_actions == {"read", "manage"}
