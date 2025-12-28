"""Add missing primary key indexes.

Revision ID: 64932cb045bd
Revises: a91a3381223a
Create Date: 2025-12-28 15:00:49.886169

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "64932cb045bd"
down_revision: str | None = "a91a3381223a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add missing indexes on primary key columns
    op.create_index(
        op.f("ix_email_verification_tokens_id"),
        "email_verification_tokens",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_password_reset_tokens_id"),
        "password_reset_tokens",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_password_reset_tokens_id"), table_name="password_reset_tokens")
    op.drop_index(op.f("ix_email_verification_tokens_id"), table_name="email_verification_tokens")
