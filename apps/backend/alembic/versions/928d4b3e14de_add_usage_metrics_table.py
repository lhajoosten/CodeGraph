"""add_usage_metrics_table

Revision ID: 928d4b3e14de
Revises: a3fd7b821b30
Create Date: 2025-12-28 11:58:27.550658

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "928d4b3e14de"
down_revision: str | None = "a3fd7b821b30"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create usage_metrics table for token tracking and cost analytics
    op.create_table(
        "usage_metrics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=True),
        sa.Column(
            "agent_type",
            postgresql.ENUM(
                "PLANNER", "CODER", "TESTER", "REVIEWER", name="agenttype", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("model_used", sa.String(length=200), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["agent_run_id"], ["agent_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_usage_metrics_agent_run_id"), "usage_metrics", ["agent_run_id"], unique=False
    )
    op.create_index(
        op.f("ix_usage_metrics_agent_type"), "usage_metrics", ["agent_type"], unique=False
    )
    op.create_index(op.f("ix_usage_metrics_id"), "usage_metrics", ["id"], unique=False)
    op.create_index(
        op.f("ix_usage_metrics_recorded_at"), "usage_metrics", ["recorded_at"], unique=False
    )
    op.create_index(op.f("ix_usage_metrics_task_id"), "usage_metrics", ["task_id"], unique=False)


def downgrade() -> None:
    # Drop usage_metrics table and indexes
    op.drop_index(op.f("ix_usage_metrics_task_id"), table_name="usage_metrics")
    op.drop_index(op.f("ix_usage_metrics_recorded_at"), table_name="usage_metrics")
    op.drop_index(op.f("ix_usage_metrics_id"), table_name="usage_metrics")
    op.drop_index(op.f("ix_usage_metrics_agent_type"), table_name="usage_metrics")
    op.drop_index(op.f("ix_usage_metrics_agent_run_id"), table_name="usage_metrics")
    op.drop_table("usage_metrics")
