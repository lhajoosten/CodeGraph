"""Add council review tables and extend agent_run metrics.

Revision ID: b4e5f6a7c8d9
Revises: 64932cb045bd
Create Date: 2025-12-28 16:00:00.000000

Phase 3 database changes:
- Creates council_reviews table for aggregate multi-judge review data
- Creates judge_verdicts table for individual judge evaluations
- Adds new metrics columns to agent_runs table
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b4e5f6a7c8d9"
down_revision: str | None = "64932cb045bd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create review verdict enum
    review_verdict_enum = postgresql.ENUM(
        "APPROVE", "REVISE", "REJECT", name="reviewverdict", create_type=False
    )
    review_verdict_enum.create(op.get_bind(), checkfirst=True)

    # Create consensus type enum
    consensus_type_enum = postgresql.ENUM(
        "unanimous", "majority", "tie_broken", "dissent", name="consensustype", create_type=False
    )
    consensus_type_enum.create(op.get_bind(), checkfirst=True)

    # Create LLM mode enum
    llm_mode_enum = postgresql.ENUM("local", "cloud", name="llmmode", create_type=False)
    llm_mode_enum.create(op.get_bind(), checkfirst=True)

    # Create council_reviews table
    op.create_table(
        "council_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=True),
        sa.Column(
            "final_verdict",
            postgresql.ENUM("APPROVE", "REVISE", "REJECT", name="reviewverdict", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "consensus_type",
            postgresql.ENUM(
                "unanimous",
                "majority",
                "tie_broken",
                "dissent",
                name="consensustype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("confidence_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("deliberation_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_cost_usd", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column(
            "llm_mode",
            postgresql.ENUM("local", "cloud", name="llmmode", create_type=False),
            nullable=False,
            server_default="local",
        ),
        sa.Column("council_config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("council_conclusion", sa.Text(), nullable=True),
        sa.Column("dissenting_opinions", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("total_issues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("critical_issues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("major_issues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["agent_run_id"], ["agent_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_council_reviews_agent_run_id"), "council_reviews", ["agent_run_id"], unique=False
    )
    op.create_index(
        op.f("ix_council_reviews_final_verdict"), "council_reviews", ["final_verdict"], unique=False
    )
    op.create_index(
        op.f("ix_council_reviews_consensus_type"),
        "council_reviews",
        ["consensus_type"],
        unique=False,
    )
    op.create_index(op.f("ix_council_reviews_id"), "council_reviews", ["id"], unique=False)
    op.create_index(
        op.f("ix_council_reviews_llm_mode"), "council_reviews", ["llm_mode"], unique=False
    )
    op.create_index(
        op.f("ix_council_reviews_reviewed_at"), "council_reviews", ["reviewed_at"], unique=False
    )
    op.create_index(
        op.f("ix_council_reviews_task_id"), "council_reviews", ["task_id"], unique=False
    )

    # Create judge_verdicts table
    op.create_table(
        "judge_verdicts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("council_review_id", sa.Integer(), nullable=False),
        sa.Column("judge_name", sa.String(length=100), nullable=False),
        sa.Column("persona", sa.String(length=50), nullable=False),
        sa.Column("model_tier", sa.String(length=50), nullable=False, server_default="local"),
        sa.Column(
            "verdict",
            postgresql.ENUM("APPROVE", "REVISE", "REJECT", name="reviewverdict", create_type=False),
            nullable=False,
        ),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("issues_found", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("strengths_found", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_usd", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("judged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["council_review_id"], ["council_reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_judge_verdicts_council_review_id"),
        "judge_verdicts",
        ["council_review_id"],
        unique=False,
    )
    op.create_index(op.f("ix_judge_verdicts_id"), "judge_verdicts", ["id"], unique=False)
    op.create_index(
        op.f("ix_judge_verdicts_judge_name"), "judge_verdicts", ["judge_name"], unique=False
    )
    op.create_index(
        op.f("ix_judge_verdicts_judged_at"), "judge_verdicts", ["judged_at"], unique=False
    )
    op.create_index(op.f("ix_judge_verdicts_persona"), "judge_verdicts", ["persona"], unique=False)
    op.create_index(op.f("ix_judge_verdicts_verdict"), "judge_verdicts", ["verdict"], unique=False)

    # Add Phase 3 columns to agent_runs table
    op.add_column("agent_runs", sa.Column("model_tier", sa.String(length=50), nullable=True))
    op.add_column("agent_runs", sa.Column("input_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_runs", sa.Column("output_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_runs", sa.Column("cost_usd", sa.Float(), nullable=True))
    op.add_column("agent_runs", sa.Column("first_token_latency_ms", sa.Integer(), nullable=True))
    op.add_column("agent_runs", sa.Column("total_latency_ms", sa.Integer(), nullable=True))
    op.add_column("agent_runs", sa.Column("code_quality_score", sa.Integer(), nullable=True))
    op.add_column("agent_runs", sa.Column("lint_warning_count", sa.Integer(), nullable=True))

    # Add index on model_tier
    op.create_index(op.f("ix_agent_runs_model_tier"), "agent_runs", ["model_tier"], unique=False)


def downgrade() -> None:
    # Drop agent_runs extensions
    op.drop_index(op.f("ix_agent_runs_model_tier"), table_name="agent_runs")
    op.drop_column("agent_runs", "lint_warning_count")
    op.drop_column("agent_runs", "code_quality_score")
    op.drop_column("agent_runs", "total_latency_ms")
    op.drop_column("agent_runs", "first_token_latency_ms")
    op.drop_column("agent_runs", "cost_usd")
    op.drop_column("agent_runs", "output_tokens")
    op.drop_column("agent_runs", "input_tokens")
    op.drop_column("agent_runs", "model_tier")

    # Drop judge_verdicts table
    op.drop_index(op.f("ix_judge_verdicts_verdict"), table_name="judge_verdicts")
    op.drop_index(op.f("ix_judge_verdicts_persona"), table_name="judge_verdicts")
    op.drop_index(op.f("ix_judge_verdicts_judged_at"), table_name="judge_verdicts")
    op.drop_index(op.f("ix_judge_verdicts_judge_name"), table_name="judge_verdicts")
    op.drop_index(op.f("ix_judge_verdicts_id"), table_name="judge_verdicts")
    op.drop_index(op.f("ix_judge_verdicts_council_review_id"), table_name="judge_verdicts")
    op.drop_table("judge_verdicts")

    # Drop council_reviews table
    op.drop_index(op.f("ix_council_reviews_task_id"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_reviewed_at"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_llm_mode"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_id"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_consensus_type"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_final_verdict"), table_name="council_reviews")
    op.drop_index(op.f("ix_council_reviews_agent_run_id"), table_name="council_reviews")
    op.drop_table("council_reviews")

    # Drop enums (in reverse order of dependencies)
    op.execute("DROP TYPE IF EXISTS llmmode")
    op.execute("DROP TYPE IF EXISTS consensustype")
    op.execute("DROP TYPE IF EXISTS reviewverdict")
