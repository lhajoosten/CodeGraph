"""Add webhook tables

Revision ID: a91a3381223a
Revises: 928d4b3e14de
Create Date: 2025-12-28 14:44:34.878351

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a91a3381223a"
down_revision: str | None = "928d4b3e14de"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create webhooks table
    op.create_table(
        "webhooks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("secret", sa.String(length=64), nullable=False),
        sa.Column("events", sa.JSON(), nullable=False),
        sa.Column(
            "status", sa.Enum("ACTIVE", "PAUSED", "DISABLED", name="webhookstatus"), nullable=False
        ),
        sa.Column("headers", sa.JSON(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False),
        sa.Column("success_count", sa.Integer(), nullable=False),
        sa.Column("failure_count", sa.Integer(), nullable=False),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_failure_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_webhooks_id"), "webhooks", ["id"], unique=False)
    op.create_index(op.f("ix_webhooks_status"), "webhooks", ["status"], unique=False)
    op.create_index(op.f("ix_webhooks_user_id"), "webhooks", ["user_id"], unique=False)

    # Create webhook_deliveries table
    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "SUCCESS", "FAILED", "RETRYING", name="deliverystatus"),
            nullable=False,
        ),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("response_headers", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.String(length=1000), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("webhook_id", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["webhook_id"], ["webhooks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_webhook_deliveries_event_id"), "webhook_deliveries", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_webhook_deliveries_event_type"), "webhook_deliveries", ["event_type"], unique=False
    )
    op.create_index(op.f("ix_webhook_deliveries_id"), "webhook_deliveries", ["id"], unique=False)
    op.create_index(
        op.f("ix_webhook_deliveries_status"), "webhook_deliveries", ["status"], unique=False
    )
    op.create_index(
        op.f("ix_webhook_deliveries_webhook_id"), "webhook_deliveries", ["webhook_id"], unique=False
    )


def downgrade() -> None:
    # Drop webhook_deliveries table and indexes
    op.drop_index(op.f("ix_webhook_deliveries_webhook_id"), table_name="webhook_deliveries")
    op.drop_index(op.f("ix_webhook_deliveries_status"), table_name="webhook_deliveries")
    op.drop_index(op.f("ix_webhook_deliveries_id"), table_name="webhook_deliveries")
    op.drop_index(op.f("ix_webhook_deliveries_event_type"), table_name="webhook_deliveries")
    op.drop_index(op.f("ix_webhook_deliveries_event_id"), table_name="webhook_deliveries")
    op.drop_table("webhook_deliveries")

    # Drop webhooks table and indexes
    op.drop_index(op.f("ix_webhooks_user_id"), table_name="webhooks")
    op.drop_index(op.f("ix_webhooks_status"), table_name="webhooks")
    op.drop_index(op.f("ix_webhooks_id"), table_name="webhooks")
    op.drop_table("webhooks")

    # Drop enum types
    sa.Enum("PENDING", "SUCCESS", "FAILED", "RETRYING", name="deliverystatus").drop(op.get_bind())
    sa.Enum("ACTIVE", "PAUSED", "DISABLED", name="webhookstatus").drop(op.get_bind())
