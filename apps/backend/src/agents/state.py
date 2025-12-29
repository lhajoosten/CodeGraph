"""Workflow state definitions for LangGraph agent orchestration.

This module defines the shared state that flows through all agent nodes.
State is defined using TypedDict with annotated reducers that control how
updates merge across nodes without overwriting previous values.

Features:
- Typed metadata schemas for each node (Planner, Coder, Tester, Reviewer)
- CouncilState for multi-judge review with personas
- JudgeVerdictState for individual judge outcomes
- Metrics collection for council deliberation
- State persistence via AsyncPostgresSaver checkpointer
"""

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph.message import add_messages

# =============================================================================
# Node Metadata Schemas
# =============================================================================


class LLMUsageMetadata(TypedDict, total=False):
    """Common LLM usage metrics shared across all nodes.

    Attributes:
        input_tokens: Number of input/prompt tokens
        output_tokens: Number of output/completion tokens
        total_tokens: Total tokens used (input + output)
        latency_ms: Response time in milliseconds
        model: Model name used (e.g., "claude-3-5-sonnet-latest")
    """

    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: int
    model: str


class PlanValidationMetadata(TypedDict, total=False):
    """Plan validation results from plan_validator.

    Attributes:
        is_valid: Whether the plan passed validation
        total_steps: Number of steps extracted from the plan
        complexity_level: "low", "medium", or "high"
        complexity_score: Numeric complexity score
        issues: List of validation issues found
    """

    is_valid: bool
    total_steps: int
    complexity_level: str
    complexity_score: float
    issues: list[dict[str, Any]]


class PlanVersionMetadata(TypedDict, total=False):
    """Metadata for a single plan version.

    Attributes:
        version: Version number (1-based)
        created_at: ISO timestamp when this version was created
        plan_content: The plan content for this version
        validation: Validation result for this version
        is_refinement: Whether this was a refinement of a previous version
        refinement_reason: Why refinement was needed (if applicable)
    """

    version: int
    created_at: str
    plan_content: str
    validation: PlanValidationMetadata
    is_refinement: bool
    refinement_reason: str | None


class PlannerMetadata(TypedDict, total=False):
    """Metadata produced by the planner node.

    Attributes:
        plan_generated_at: ISO timestamp when plan was generated
        planner_model: Model used for planning (e.g., "sonnet")
        plan_validation: Validation results
        plan_from_cache: Whether plan was retrieved from cache
        plan_cached: Whether plan was stored in cache
        cache_source_task_id: If from cache, the original task ID
        cache_source_timestamp: If from cache, when it was cached
        planner_usage: LLM token usage and latency
        plan_version: Current plan version number
        plan_history: History of all plan versions
    """

    plan_generated_at: str
    planner_model: str
    plan_validation: PlanValidationMetadata
    plan_from_cache: bool
    plan_cached: bool
    cache_source_task_id: int | None
    cache_source_timestamp: str | None
    planner_usage: LLMUsageMetadata
    plan_version: int
    plan_history: list[PlanVersionMetadata]


class CodeBlockMetadata(TypedDict, total=False):
    """Metadata for a single code block.

    Attributes:
        language: Programming language (python, javascript, etc.)
        filepath: Inferred or specified file path
        line_count: Number of lines in the block
        is_test: Whether this is test code
        functions: List of function names found
        classes: List of class names found
    """

    language: str
    filepath: str | None
    line_count: int
    is_test: bool
    functions: list[str]
    classes: list[str]


class FormattingMetadata(TypedDict, total=False):
    """Code formatting results.

    Attributes:
        all_valid: Whether all code passed syntax validation
        files_formatted: Number of files that were auto-formatted
        syntax_errors: Number of syntax errors found
        lint_warnings: Total lint warnings across all files
    """

    all_valid: bool
    files_formatted: int
    syntax_errors: int
    lint_warnings: int


class CoderMetadata(TypedDict, total=False):
    """Metadata produced by the coder node.

    Attributes:
        code_generated_at: ISO timestamp when code was generated
        coder_model: Model used for code generation
        is_revision: Whether this is a revision based on review feedback
        code_blocks: List of code block metadata
        code_block_count: Total number of code blocks
        has_test_code: Whether test code was included
        multi_file: Full multi-file result structure
        formatting: Code formatting results
        coder_usage: LLM token usage and latency
    """

    code_generated_at: str
    coder_model: str
    is_revision: bool
    code_blocks: list[CodeBlockMetadata]
    code_block_count: int
    has_test_code: bool
    multi_file: dict[str, Any]
    formatting: FormattingMetadata
    coder_usage: LLMUsageMetadata


class TestCoverageMetadata(TypedDict, total=False):
    """Test coverage metrics.

    Attributes:
        line_coverage: Percentage of lines covered
        branch_coverage: Percentage of branches covered
        function_coverage: Percentage of functions tested
        estimated: Whether these are estimated values
    """

    line_coverage: float
    branch_coverage: float
    function_coverage: float
    estimated: bool


class TesterMetadata(TypedDict, total=False):
    """Metadata produced by the tester node.

    Attributes:
        tests_generated_at: ISO timestamp when tests were generated
        tester_model: Model used for test generation
        test_count: Number of test functions generated
        test_types: Types of tests (unit, integration, edge_case)
        mock_recommendations: Suggested mocks for external dependencies
        coverage: Coverage metrics (estimated)
        test_quality_score: Overall test quality score (0-100)
        tester_usage: LLM token usage and latency
    """

    tests_generated_at: str
    tester_model: str
    test_count: int
    test_types: list[str]
    mock_recommendations: list[str]
    coverage: TestCoverageMetadata
    test_quality_score: float
    tester_usage: LLMUsageMetadata


class ReviewerMetadata(TypedDict, total=False):
    """Metadata produced by the reviewer node.

    Attributes:
        review_completed_at: ISO timestamp when review completed
        reviewer_model: Model used for review
        verdict: APPROVE, REVISE, or REJECT
        confidence: Confidence in the verdict (0.0-1.0)
        issues_found: Number of issues identified
        issue_categories: Categories of issues found
        reviewer_usage: LLM token usage and latency
        is_council_review: Whether this was a council-based review
    """

    review_completed_at: str
    reviewer_model: str
    verdict: str
    confidence: float
    issues_found: int
    issue_categories: list[str]
    reviewer_usage: LLMUsageMetadata
    is_council_review: bool


class WorkflowMetadata(TypedDict, total=False):
    """Combined metadata from all workflow nodes.

    This provides a typed structure for the metadata field in WorkflowState,
    ensuring consistent access to node-specific metadata.

    Attributes:
        workflow_started_at: ISO timestamp when workflow started
        workflow_completed_at: ISO timestamp when workflow completed
        thread_id: Thread ID for checkpointing
        timeout_seconds: Configured timeout
        planner: Planner node metadata
        coder: Coder node metadata
        tester: Tester node metadata
        reviewer: Reviewer node metadata
        error_node: Name of node that caused error (if any)
        error_type: Type of error that occurred
        error_message: Error message
        recovered_from_error: Whether error recovery was successful
        recovery_error_type: Type of error that was recovered from
    """

    # Workflow-level
    workflow_started_at: str
    workflow_completed_at: str
    workflow_cancelled_at: str
    workflow_timeout_at: str
    thread_id: str | None
    timeout_seconds: int
    cancellation_token_id: int

    # Node-specific
    planner: PlannerMetadata
    coder: CoderMetadata
    tester: TesterMetadata
    reviewer: ReviewerMetadata

    # Error handling
    error_node: str
    error_type: str
    error_message: str
    recovered_from_error: bool
    recovery_exhausted: bool
    recovery_error_type: str

    # Council review (added when council review is used)
    verdict: str
    confidence_score: float
    consensus_type: str
    council_mode: str


# =============================================================================
# Workflow State
# =============================================================================


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
        status: Current workflow status (planning -> coding -> testing -> reviewing -> complete/error)
        error: Error message if any step fails
        metadata: Additional context - see WorkflowMetadata for typed structure
        workspace_path: Path to the workspace directory for file operations (optional)
        tool_calls: List of tool calls made during workflow execution (optional)

    Note:
        The metadata field uses dict[str, Any] for flexibility, but follows
        the structure defined in WorkflowMetadata. Each node adds its own
        metadata under its key (e.g., metadata["planner_usage"], metadata["verdict"]).

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
            "workspace_path": "/tmp/codegraph_workspaces/task_123",
            "metadata": {
                "workflow_started_at": "2025-01-15T10:00:00Z",
                "plan_validation": {"is_valid": True, "complexity_level": "medium"},
                "planner_usage": {"input_tokens": 500, "output_tokens": 1000},
            },
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
        "planning", "coding", "testing", "reviewing", "complete", "timeout", "cancelled", "error"
    ]
    error: str | None
    metadata: dict[str, Any]  # See WorkflowMetadata for typed structure
    workspace_path: str | None  # Path to workspace for file operations
    tool_calls: list[dict[str, Any]]  # Tool calls made during execution


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
    workspace_path: str | None  # Path to workspace for file operations
    tool_calls: list[dict[str, Any]]  # Tool calls made during execution

    # Council-specific field
    council_state: CouncilState | None
