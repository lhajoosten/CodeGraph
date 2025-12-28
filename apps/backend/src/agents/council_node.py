"""Council reviewer node for LangGraph workflow.

This module provides the council_reviewer_node function that integrates
the CodeReviewCouncil into the multi-agent workflow. It replaces the
standard reviewer_node when council review is enabled.

Phase 3 Features:
- Multi-judge code review with parallel execution
- Verdict aggregation with confidence scoring
- Detailed metrics collection per judge
- Seamless integration with workflow state
"""

from datetime import UTC, datetime
from typing import Any

from langchain_core.runnables import RunnableConfig

from src.agents.council import CodeReviewCouncil, CouncilConfig
from src.agents.reviewer import ReviewVerdict
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


async def council_reviewer_node(
    state: WorkflowState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    """Council-based review node with multiple judges.

    This node replaces the standard reviewer_node when council review
    is enabled. It convenes a council of judges (either different models
    or different personas) to review the code independently, then
    aggregates their verdicts into a final decision.

    For local vLLM: Uses prompt-based personas (security, performance,
    maintainability) with the same underlying model.

    For Claude API: Uses different model tiers (haiku, sonnet, opus)
    as independent judges.

    Args:
        state: Current workflow state containing code, tests, and plan
        config: Optional LangChain runnable config for tracing

    Returns:
        Dictionary with:
            - review_feedback: Human-readable council conclusion
            - status: "complete" if APPROVE, "coding" if REVISE
            - messages: Empty (council handles internally)
            - iterations: Incremented if revision needed
            - metadata: Updated with council review metrics including:
                - council_review: Full council state data
                - judge_verdicts: Individual judge outcomes
                - confidence_score: Overall confidence
                - consensus_type: How consensus was reached

    Example:
        # In graph definition:
        workflow.add_node("reviewer", council_reviewer_node)
    """
    logger.info(
        "Council reviewer node executing",
        task_id=state.get("task_id"),
        code_length=len(state.get("code", "")),
        test_length=len(state.get("test_results", "")),
        llm_mode="local" if settings.use_local_llm else "cloud",
    )

    # Create council with appropriate configuration
    council_config = (
        CouncilConfig.default_local() if settings.use_local_llm else CouncilConfig.default_cloud()
    )
    council = CodeReviewCouncil(config=council_config)

    # Convene the council
    council_state = await council.convene(
        code=state.get("code", ""),
        tests=state.get("test_results", ""),
        plan=state.get("plan", ""),
        config=config,
    )

    # Extract final verdict and confidence
    final_verdict = council_state["final_verdict"]
    confidence = council_state["confidence_score"]
    consensus_type = council_state["consensus_type"]

    logger.info(
        "Council review completed",
        task_id=state.get("task_id"),
        final_verdict=final_verdict,
        confidence=confidence,
        consensus_type=consensus_type,
        judge_count=len(council_state["judge_verdicts"]),
        dissenting_count=len(council_state["dissenting_opinions"]),
        deliberation_time_ms=council_state["deliberation_time_ms"],
        total_cost_usd=council_state["total_cost_usd"],
    )

    # Determine next status based on verdict
    # REVISE: go back to coder (handled by graph routing)
    # APPROVE or REJECT: workflow is complete
    next_status = "coding" if final_verdict == ReviewVerdict.REVISE else "complete"

    # Only increment iterations on REVISE
    iterations = state.get("iterations", 0)
    if final_verdict == ReviewVerdict.REVISE:
        iterations += 1

    # Calculate aggregate token usage
    total_tokens = sum(v["tokens_used"] for v in council_state["judge_verdicts"].values())

    return {
        "review_feedback": council_state["council_conclusion"],
        "status": next_status,
        "messages": [],  # Council handles messages internally
        "iterations": iterations,
        "metadata": {
            **(state.get("metadata", {})),
            "review_completed_at": datetime.now(UTC).isoformat(),
            "reviewer_model": "council",
            "verdict": final_verdict,
            "confidence_score": confidence,
            "reviewer_usage": {
                "input_tokens": 0,  # Aggregate from judges
                "output_tokens": 0,
                "total_tokens": total_tokens,
                "latency_ms": council_state["deliberation_time_ms"],
            },
            # Council-specific metadata (Phase 3)
            "council_review": {
                "final_verdict": council_state["final_verdict"],
                "confidence_score": council_state["confidence_score"],
                "consensus_type": council_state["consensus_type"],
                "dissenting_opinions": council_state["dissenting_opinions"],
                "deliberation_time_ms": council_state["deliberation_time_ms"],
                "total_cost_usd": council_state["total_cost_usd"],
                "llm_mode": council_state["llm_mode"],
                "judge_count": len(council_state["judge_verdicts"]),
            },
            "judge_verdicts": {
                name: {
                    "judge_name": v["judge_name"],
                    "persona": v["persona"],
                    "model_tier": v["model_tier"],
                    "verdict": v["verdict"],
                    "confidence": v["confidence"],
                    "issue_count": len(v["issues"]),
                    "tokens_used": v["tokens_used"],
                    "latency_ms": v["latency_ms"],
                    "cost_usd": v["cost_usd"],
                }
                for name, v in council_state["judge_verdicts"].items()
            },
            # Aggregate issue counts
            "total_issues": sum(len(v["issues"]) for v in council_state["judge_verdicts"].values()),
            "critical_issues": sum(
                sum(1 for i in v["issues"] if i.get("severity") == "critical")
                for v in council_state["judge_verdicts"].values()
            ),
            "major_issues": sum(
                sum(1 for i in v["issues"] if i.get("severity") == "major")
                for v in council_state["judge_verdicts"].values()
            ),
        },
    }


async def get_council_reviewer_node(
    use_council: bool = True,
) -> Any:
    """Factory function to get the appropriate reviewer node.

    Args:
        use_council: Whether to use council review (default True)

    Returns:
        Either council_reviewer_node or the standard reviewer_node
    """
    if use_council:
        return council_reviewer_node
    else:
        from src.agents.reviewer import reviewer_node

        return reviewer_node
