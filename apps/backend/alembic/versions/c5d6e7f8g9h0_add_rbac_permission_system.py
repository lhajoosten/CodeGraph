"""Add RBAC permission system.

Revision ID: c5d6e7f8g9h0
Revises: b4e5f6a7c8d9
Create Date: 2025-12-29 10:00:00.000000

Adds:
- roles table with RoleType enum (admin, developer, viewer)
- permissions table with resource:action pattern
- role_permissions association table
- role_id column to users table
- Seeds default roles and permissions
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c5d6e7f8g9h0"
down_revision: str | None = "b4e5f6a7c8d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Default permissions to seed
DEFAULT_PERMISSIONS = [
    ("task", "create", "Create new tasks"),
    ("task", "read", "View tasks"),
    ("task", "update", "Update tasks"),
    ("task", "delete", "Delete tasks"),
    ("task", "execute", "Execute task workflows"),
    ("repository", "create", "Create repository connections"),
    ("repository", "read", "View repositories"),
    ("repository", "update", "Update repository settings"),
    ("repository", "delete", "Delete repository connections"),
    ("user", "read", "View user profiles"),
    ("user", "update", "Update user profiles"),
    ("user", "delete", "Delete user accounts"),
    ("user", "manage", "Manage all user accounts"),
    ("agent", "read", "View agent runs and status"),
    ("agent", "execute", "Execute agents"),
    ("agent", "manage", "Manage agent configurations"),
    ("webhook", "create", "Create webhooks"),
    ("webhook", "read", "View webhooks"),
    ("webhook", "update", "Update webhooks"),
    ("webhook", "delete", "Delete webhooks"),
    ("metrics", "read", "View usage metrics"),
    ("metrics", "manage", "Manage metrics settings"),
    ("council", "read", "View council reviews"),
    ("council", "manage", "Manage council configurations"),
    ("admin", "read", "View admin dashboard"),
    ("admin", "manage", "Full admin access"),
]

# Role definitions with their permissions
ROLE_DEFINITIONS = {
    "admin": {
        "description": "Full system access - can manage all resources and users",
        "permissions": "*",  # All permissions
    },
    "developer": {
        "description": "Can create, read, update, delete own resources and execute agents",
        "permissions": [
            "task:create",
            "task:read",
            "task:update",
            "task:delete",
            "task:execute",
            "repository:create",
            "repository:read",
            "repository:update",
            "repository:delete",
            "user:read",
            "user:update",
            "agent:read",
            "agent:execute",
            "webhook:create",
            "webhook:read",
            "webhook:update",
            "webhook:delete",
            "metrics:read",
            "council:read",
        ],
    },
    "viewer": {
        "description": "Read-only access to shared resources",
        "permissions": [
            "task:read",
            "repository:read",
            "user:read",
            "agent:read",
            "webhook:read",
            "metrics:read",
            "council:read",
        ],
    },
}


def upgrade() -> None:
    # Create role type enum
    role_type_enum = postgresql.ENUM(
        "admin",
        "developer",
        "viewer",
        name="roletype",
        create_type=False,
    )
    role_type_enum.create(op.get_bind(), checkfirst=True)

    # Create roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "name",
            postgresql.ENUM("admin", "developer", "viewer", name="roletype", create_type=False),
            nullable=False,
        ),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)

    # Create permissions table
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("resource", sa.String(length=100), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("resource", "action", name="uq_permission_resource_action"),
    )
    op.create_index(op.f("ix_permissions_id"), "permissions", ["id"], unique=False)
    op.create_index(op.f("ix_permissions_resource"), "permissions", ["resource"], unique=False)
    op.create_index(op.f("ix_permissions_action"), "permissions", ["action"], unique=False)

    # Create role_permissions association table
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )
    op.create_index(
        op.f("ix_role_permissions_role_id"),
        "role_permissions",
        ["role_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_role_permissions_permission_id"),
        "role_permissions",
        ["permission_id"],
        unique=False,
    )

    # Add role_id column to users table
    op.add_column("users", sa.Column("role_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_role_id", "users", "roles", ["role_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)

    # Seed data
    conn = op.get_bind()

    # Insert default permissions
    for resource, action, description in DEFAULT_PERMISSIONS:
        conn.execute(
            sa.text(
                "INSERT INTO permissions (resource, action, description) "
                "VALUES (:resource, :action, :description)"
            ),
            {"resource": resource, "action": action, "description": description},
        )

    # Insert roles
    for role_name, role_config in ROLE_DEFINITIONS.items():
        conn.execute(
            sa.text("INSERT INTO roles (name, description) VALUES (:name, :description)"),
            {"name": role_name, "description": role_config["description"]},
        )

    # Get role and permission IDs
    roles_result = conn.execute(sa.text("SELECT id, name FROM roles"))
    roles = {row[1]: row[0] for row in roles_result}

    permissions_result = conn.execute(sa.text("SELECT id, resource, action FROM permissions"))
    permissions = {f"{row[1]}:{row[2]}": row[0] for row in permissions_result}

    # Assign permissions to roles
    for role_name, role_config in ROLE_DEFINITIONS.items():
        role_id = roles[role_name]
        role_perms = role_config["permissions"]

        if role_perms == "*":
            # Admin gets all permissions
            perm_ids = list(permissions.values())
        else:
            perm_ids = [permissions[p] for p in role_perms if p in permissions]

        for perm_id in perm_ids:
            conn.execute(
                sa.text(
                    "INSERT INTO role_permissions (role_id, permission_id) "
                    "VALUES (:role_id, :permission_id)"
                ),
                {"role_id": role_id, "permission_id": perm_id},
            )

    # Set default role for existing users (developer role for active non-superusers)
    developer_role_id = roles["developer"]
    conn.execute(
        sa.text("UPDATE users SET role_id = :role_id WHERE is_superuser = false"),
        {"role_id": developer_role_id},
    )


def downgrade() -> None:
    # Remove role_id from users
    op.drop_index(op.f("ix_users_role_id"), table_name="users")
    op.drop_constraint("fk_users_role_id", "users", type_="foreignkey")
    op.drop_column("users", "role_id")

    # Drop role_permissions table
    op.drop_index(op.f("ix_role_permissions_permission_id"), table_name="role_permissions")
    op.drop_index(op.f("ix_role_permissions_role_id"), table_name="role_permissions")
    op.drop_table("role_permissions")

    # Drop permissions table
    op.drop_index(op.f("ix_permissions_action"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_resource"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_id"), table_name="permissions")
    op.drop_table("permissions")

    # Drop roles table
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_index(op.f("ix_roles_id"), table_name="roles")
    op.drop_table("roles")

    # Drop enum
    op.execute("DROP TYPE IF EXISTS roletype")
