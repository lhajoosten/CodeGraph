"""Add two-factor authentication.

Revision ID: 4a2b3c4d5e6f
Revises: 3f1a2b5c7d8e
Create Date: 2025-12-21 23:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4a2b3c4d5e6f"
down_revision: str | None = "3f1a2b5c7d8e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add 2FA columns to users table
    op.add_column(
        "users",
        sa.Column("two_factor_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column("two_factor_secret", sa.String(32), nullable=True),
    )

    # Create backup_codes table
    op.create_table(
        "backup_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(255), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_backup_codes_id", "backup_codes", ["id"])
    op.create_index("ix_backup_codes_user_id", "backup_codes", ["user_id"])


def downgrade() -> None:
    # Drop backup_codes table
    op.drop_index("ix_backup_codes_user_id", table_name="backup_codes")
    op.drop_index("ix_backup_codes_id", table_name="backup_codes")
    op.drop_table("backup_codes")

    # Remove 2FA columns from users table
    op.drop_column("users", "two_factor_secret")
    op.drop_column("users", "two_factor_enabled")
