"""Workflow state definitions for LangGraph agent orchestration.

This module defines the shared state that flows through all agent nodes.
State is defined using TypedDict with annotated reducers that control how
updates merge across nodes without overwriting previous values.

Features:
- CouncilState for multi-judge review with personas
- JudgeVerdictState for individual judge outcomes
- Metrics collection for council deliberation

TODO: Add state persistence integration with AsyncPostgresSaver (Phase 4)
"""

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph.message import add_messages


class WorkflowState(TypedDict):
    """Shared state for the multi-agent coding workflow.

    This TypedDict defines all state shared across planning, coding, testing,
    and reviewing nodes. Uses Annotated with add_messages to accumulate LLM
    messages rather than overwriting them.

    Attributes:
        messages: Accumulated messages from all LLM calls in the workflow
        task_id: ID of the task being executed
        task_description: User-provided description of the coding task
        plan: Step-by-step plan created by the planner
        code: Generated code from the coder (primary file content)
        code_files: Multi-file code generation result with all files
        test_results: Generated test code from the tester
        test_analysis: Structured test analysis with coverage and quality metrics
        review_feedback: Feedback from the reviewer
        iterations: Counter for review loop iterations
        status: Current workflow status (planning -> coding -> testing -> reviewing -> complete)
        error: Error message if any step fails
        metadata: Additional context (timestamps, execution info, etc.)

    Example:
        state = {
            "task_id": 123,
            "task_description": "Create a FastAPI endpoint for user authentication",
            "messages": [...],
            "plan": "1. Design auth schema...",
            "code": "...",
            "code_files": {"files": [...], "all_valid": True},
            "test_analysis": {"summary": {...}, "coverage": {...}},
            "status": "coding",
            ...
        }
    """

    messages: Annotated[list[Any], add_messages]
    task_id: int
    task_description: str
    plan: str
    code: str
    code_files: dict[str, Any]
    test_results: str
    test_analysis: dict[str, Any]
    review_feedback: str
    iterations: int
    status: Literal[
        "planning", "coding", "testing", "reviewing", "complete", "timeout", "cancelled"
    ]
    error: str | None
    metadata: dict[str, Any]


# =============================================================================
# Council Review State Definitions
# =============================================================================


class JudgeVerdictState(TypedDict):
    """State for a single judge's verdict in council review.

    Each judge in the council produces a verdict with confidence score,
    issues found, and reasoning. This enables aggregation and consensus
    calculation across multiple judges.

    Attributes:
        judge_name: Identifier for the judge (e.g., "security_judge")
        persona: The focus area/persona of this judge
        model_tier: The model tier used (haiku/sonnet/opus or "local")
        verdict: The judge's decision (APPROVE/REVISE/REJECT)
        confidence: Confidence in the verdict (0.0 to 1.0)
        issues: List of issues found, each with severity, category, description
        reasoning: Full reasoning text from the judge
        strengths: Positive aspects identified
        action_items: Specific changes recommended
        tokens_used: Total tokens consumed by this judge
        latency_ms: Time taken for this judge's review
        cost_usd: Estimated cost for this judge's review (0.0 for local)
    """

    judge_name: str
    persona: str
    model_tier: Literal["haiku", "sonnet", "opus", "local"]
    verdict: Literal["APPROVE", "REVISE", "REJECT"]
    confidence: float
    issues: list[dict[str, Any]]
    reasoning: str
    strengths: list[str]
    action_items: list[str]
    tokens_used: int
    latency_ms: int
    cost_usd: float


class CouncilState(TypedDict):
    """Extended state for council review with multiple judges.

    The council review process uses multiple judges (either different
    models or different personas on the same model) to review code.
    Each judge provides an independent verdict, which are then
    aggregated into a final decision.

    For local vLLM: Uses prompt-based personas (security, performance,
    maintainability) with the same underlying model.

    For Claude API: Uses actual different models (haiku, sonnet, opus)
    as independent judges.

    Attributes:
        judge_verdicts: Map of judge_name to their verdict state
        council_conclusion: Final aggregated conclusion text
        final_verdict: The aggregated verdict (APPROVE/REVISE/REJECT)
        confidence_score: Overall confidence (weighted average)
        consensus_type: How consensus was reached:
            - "unanimous": All judges agree
            - "majority": Most judges agree (weighted)
            - "tie_broken": Close call, decided by weights
            - "dissent": Significant disagreement recorded
        dissenting_opinions: List of judge names that disagreed
        deliberation_time_ms: Total time for all judges
        total_cost_usd: Sum of costs across all judges
        llm_mode: Whether using "local" (vLLM) or "cloud" (Claude API)

    Example:
        council_state = {
            "judge_verdicts": {
                "security_judge": {...},
                "performance_judge": {...},
                "maintainability_judge": {...},
            },
            "final_verdict": "REVISE",
            "confidence_score": 0.85,
            "consensus_type": "majority",
            "dissenting_opinions": ["security_judge"],
            ...
        }
    """

    judge_verdicts: dict[str, JudgeVerdictState]
    council_conclusion: str
    final_verdict: Literal["APPROVE", "REVISE", "REJECT"]
    confidence_score: float
    consensus_type: Literal["unanimous", "majority", "tie_broken", "dissent"]
    dissenting_opinions: list[str]
    deliberation_time_ms: int
    total_cost_usd: float
    llm_mode: Literal["local", "cloud"]


class CouncilWorkflowState(TypedDict):
    """Combined workflow state that includes council review data.

    This extends the base WorkflowState with council-specific fields
    for use when council review is enabled.

    Attributes:
        (all fields from WorkflowState)
        council_state: The council review state (if council review was used)
    """

    # Base workflow fields
    messages: Annotated[list[Any], add_messages]
    task_id: int
    task_description: str
    plan: str
    code: str
    code_files: dict[str, Any]
    test_results: str
    test_analysis: dict[str, Any]
    review_feedback: str
    iterations: int
    status: Literal[
        "planning", "coding", "testing", "reviewing", "complete", "timeout", "cancelled"
    ]
    error: str | None
    metadata: dict[str, Any]

    # Council-specific field
    council_state: CouncilState | None
