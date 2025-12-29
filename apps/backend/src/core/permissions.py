"""Permission constants and role-permission mappings for ABAC.

This module defines all permissions in the system using a resource:action pattern
and provides role-to-permission mappings for the three role types.

Usage:
    from src.core.permissions import Permission, has_permission, get_role_permissions
    from src.models.role import RoleType

    # Check if a role has a permission
    if has_permission(RoleType.DEVELOPER, Permission.TASK_CREATE):
        ...

    # Get all permissions for a role
    permissions = get_role_permissions(RoleType.ADMIN)
"""

from enum import Enum
from typing import TYPE_CHECKING, Final

if TYPE_CHECKING:
    from src.models.role import RoleType


class Permission(str, Enum):
    """All available permissions in the system.

    Permissions use the format RESOURCE_ACTION = "resource:action".
    This enum defines both the Python constant and the string value
    stored in the database.
    """

    # Task permissions
    TASK_CREATE = "task:create"
    TASK_READ = "task:read"
    TASK_UPDATE = "task:update"
    TASK_DELETE = "task:delete"
    TASK_EXECUTE = "task:execute"

    # Repository permissions
    REPOSITORY_CREATE = "repository:create"
    REPOSITORY_READ = "repository:read"
    REPOSITORY_UPDATE = "repository:update"
    REPOSITORY_DELETE = "repository:delete"

    # User permissions
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_MANAGE = "user:manage"  # Admin: manage all users

    # Agent permissions
    AGENT_READ = "agent:read"
    AGENT_EXECUTE = "agent:execute"
    AGENT_MANAGE = "agent:manage"

    # Webhook permissions
    WEBHOOK_CREATE = "webhook:create"
    WEBHOOK_READ = "webhook:read"
    WEBHOOK_UPDATE = "webhook:update"
    WEBHOOK_DELETE = "webhook:delete"

    # Metrics permissions
    METRICS_READ = "metrics:read"
    METRICS_MANAGE = "metrics:manage"

    # Council review permissions
    COUNCIL_READ = "council:read"
    COUNCIL_MANAGE = "council:manage"

    # Admin permissions
    ADMIN_READ = "admin:read"
    ADMIN_MANAGE = "admin:manage"


# Role to permission mappings
# These define what each role can do by default

ADMIN_PERMISSIONS: Final[frozenset[Permission]] = frozenset(Permission)

DEVELOPER_PERMISSIONS: Final[frozenset[Permission]] = frozenset(
    [
        # Tasks - full CRUD + execute
        Permission.TASK_CREATE,
        Permission.TASK_READ,
        Permission.TASK_UPDATE,
        Permission.TASK_DELETE,
        Permission.TASK_EXECUTE,
        # Repositories - full CRUD
        Permission.REPOSITORY_CREATE,
        Permission.REPOSITORY_READ,
        Permission.REPOSITORY_UPDATE,
        Permission.REPOSITORY_DELETE,
        # Users - read and update own profile
        Permission.USER_READ,
        Permission.USER_UPDATE,
        # Agents - read and execute
        Permission.AGENT_READ,
        Permission.AGENT_EXECUTE,
        # Webhooks - full CRUD for own
        Permission.WEBHOOK_CREATE,
        Permission.WEBHOOK_READ,
        Permission.WEBHOOK_UPDATE,
        Permission.WEBHOOK_DELETE,
        # Metrics - read only
        Permission.METRICS_READ,
        # Council - read only
        Permission.COUNCIL_READ,
    ]
)

VIEWER_PERMISSIONS: Final[frozenset[Permission]] = frozenset(
    [
        # Tasks - read only
        Permission.TASK_READ,
        # Repositories - read only
        Permission.REPOSITORY_READ,
        # Users - read own profile only
        Permission.USER_READ,
        # Agents - read only
        Permission.AGENT_READ,
        # Webhooks - read only
        Permission.WEBHOOK_READ,
        # Metrics - read only
        Permission.METRICS_READ,
        # Council - read only
        Permission.COUNCIL_READ,
    ]
)


def _get_role_permissions_map() -> dict["RoleType", frozenset[Permission]]:
    """Get the role-to-permissions mapping.

    This is a function to avoid circular imports with RoleType.
    """
    from src.models.role import RoleType

    return {
        RoleType.ADMIN: ADMIN_PERMISSIONS,
        RoleType.DEVELOPER: DEVELOPER_PERMISSIONS,
        RoleType.VIEWER: VIEWER_PERMISSIONS,
    }


def has_permission(role: "RoleType", permission: Permission) -> bool:
    """Check if a role has a specific permission.

    Args:
        role: The role to check.
        permission: The permission to check for.

    Returns:
        True if the role has the permission, False otherwise.
    """
    role_permissions = _get_role_permissions_map()
    return permission in role_permissions.get(role, frozenset())


def get_role_permissions(role: "RoleType") -> frozenset[Permission]:
    """Get all permissions for a role.

    Args:
        role: The role to get permissions for.

    Returns:
        Frozenset of permissions for the role.
    """
    role_permissions = _get_role_permissions_map()
    return role_permissions.get(role, frozenset())


def permission_to_resource_action(permission: Permission | str) -> tuple[str, str]:
    """Parse a permission into resource and action components.

    Args:
        permission: Permission enum or string in format "resource:action".

    Returns:
        Tuple of (resource, action).

    Raises:
        ValueError: If permission format is invalid.
    """
    perm_str = permission.value if isinstance(permission, Permission) else permission
    parts = perm_str.split(":", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid permission format: {perm_str}")
    return parts[0], parts[1]
