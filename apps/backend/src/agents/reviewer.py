"""Reviewer agent node for comprehensive code quality assessment.

The reviewer is the final node in the workflow and is responsible for analyzing
the generated code and test suite, identifying quality issues, and determining
whether the code should be approved, revised, or rejected.

Phase 3 Features:
- Structured review output with confidence scoring
- Council-based review with multiple judges (see council.py)
- Detailed metrics collection per review
"""

import json
import re
from collections.abc import AsyncGenerator
from datetime import UTC
from enum import Enum
from typing import Any, Literal

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from src.agents.models import get_reviewer_model
from src.agents.state import WorkflowState
from src.agents.streaming import StreamingMetrics, stream_with_metrics
from src.core.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Structured Review Output Models (Phase 3)
# =============================================================================


class IssueSeverity(str, Enum):
    """Severity level for code review issues."""

    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    SUGGESTION = "suggestion"


class IssueCategory(str, Enum):
    """Category of code review issue."""

    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    CORRECTNESS = "correctness"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    STYLE = "style"


class ReviewIssue(BaseModel):
    """A single issue found during code review."""

    severity: IssueSeverity = Field(description="How severe is this issue")
    category: IssueCategory = Field(description="What category of issue")
    description: str = Field(description="Clear description of the issue")
    file_path: str | None = Field(default=None, description="File where issue was found")
    line_number: int | None = Field(default=None, description="Line number if applicable")
    suggested_fix: str | None = Field(default=None, description="How to fix this issue")


class StructuredReviewVerdict(BaseModel):
    """Structured output for review verdict with confidence scoring.

    This model provides a structured format for code review verdicts,
    enabling better analysis, metrics collection, and council aggregation.
    """

    summary: str = Field(
        description="2-3 sentence summary of overall code quality",
        min_length=10,
        max_length=500,
    )
    verdict: Literal["APPROVE", "REVISE", "REJECT"] = Field(
        description="Final verdict: APPROVE (production-ready), REVISE (needs fixes), REJECT (fundamental issues)"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in this verdict from 0.0 to 1.0",
    )
    issues: list[ReviewIssue] = Field(
        default_factory=list,
        description="List of issues found during review",
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Positive aspects of the code",
    )
    action_items: list[str] = Field(
        default_factory=list,
        description="Specific changes required if REVISE or REJECT",
    )
    test_coverage_assessment: str = Field(
        default="",
        description="Assessment of test quality and coverage",
    )

    @property
    def critical_issue_count(self) -> int:
        """Count of critical issues."""
        return sum(1 for i in self.issues if i.severity == IssueSeverity.CRITICAL)

    @property
    def major_issue_count(self) -> int:
        """Count of major issues."""
        return sum(1 for i in self.issues if i.severity == IssueSeverity.MAJOR)

    @property
    def issues_by_category(self) -> dict[str, int]:
        """Count issues by category."""
        counts: dict[str, int] = {}
        for issue in self.issues:
            cat = issue.category.value
            counts[cat] = counts.get(cat, 0) + 1
        return counts

    def to_feedback_text(self) -> str:
        """Convert structured verdict to human-readable feedback text."""
        lines = [
            f"## Summary\n{self.summary}\n",
            f"## Verdict: {self.verdict} (Confidence: {self.confidence:.0%})\n",
        ]

        if self.strengths:
            lines.append("## Strengths")
            for s in self.strengths:
                lines.append(f"- {s}")
            lines.append("")

        if self.issues:
            lines.append("## Issues Found")
            for i, issue in enumerate(self.issues, 1):
                severity_icon = {
                    "critical": "[CRITICAL]",
                    "major": "[MAJOR]",
                    "minor": "[MINOR]",
                    "suggestion": "[SUGGESTION]",
                }.get(issue.severity.value, "")
                lines.append(f"{i}. {severity_icon} [{issue.category.value}] {issue.description}")
                if issue.suggested_fix:
                    lines.append(f"   Fix: {issue.suggested_fix}")
            lines.append("")

        if self.test_coverage_assessment:
            lines.append(f"## Test Coverage\n{self.test_coverage_assessment}\n")

        if self.action_items:
            lines.append("## Action Items")
            for item in self.action_items:
                lines.append(f"- {item}")
            lines.append("")

        return "\n".join(lines)


REVIEWER_SYSTEM_PROMPT = """You are a senior code review expert with expertise in software architecture, security, and best practices.

Your role is to thoroughly review generated code and test suites, identifying strengths, weaknesses, and areas for improvement.

Requirements:
1. Analyze code structure, logic, and correctness
2. Check for security vulnerabilities and anti-patterns
3. Evaluate test coverage and quality
4. Review error handling and edge case coverage
5. Check code style and consistency
6. Verify performance considerations
7. Assess maintainability and documentation
8. Consider architectural decisions
9. Provide actionable, specific feedback
10. Make a clear verdict: APPROVE, REVISE, or REJECT

Verdict Guidelines:
- APPROVE: Code is production-ready, well-tested, and meets quality standards
- REVISE: Code has issues that can be fixed with iterations (send back to coder)
- REJECT: Code has fundamental problems requiring major rework or re-planning

IMPORTANT: You MUST respond with a valid JSON object following this exact schema:
{
  "summary": "2-3 sentence summary of code quality",
  "verdict": "APPROVE" | "REVISE" | "REJECT",
  "confidence": 0.0 to 1.0,
  "strengths": ["strength 1", "strength 2"],
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "category": "security" | "performance" | "maintainability" | "correctness" | "testing" | "documentation" | "style",
      "description": "Clear description of the issue",
      "file_path": "optional file path",
      "line_number": optional line number,
      "suggested_fix": "optional fix suggestion"
    }
  ],
  "action_items": ["action 1", "action 2"],
  "test_coverage_assessment": "Assessment of test quality and coverage"
}

Be thorough but constructive. Focus on actionable feedback. Always respond with valid JSON only."""


# Legacy prompt for non-JSON mode (fallback)
REVIEWER_SYSTEM_PROMPT_LEGACY = """You are a senior code review expert with expertise in software architecture, security, and best practices.

Your role is to thoroughly review generated code and test suites, identifying strengths, weaknesses, and areas for improvement.

Requirements:
1. Analyze code structure, logic, and correctness
2. Check for security vulnerabilities and anti-patterns
3. Evaluate test coverage and quality
4. Review error handling and edge case coverage
5. Check code style and consistency
6. Verify performance considerations
7. Assess maintainability and documentation
8. Consider architectural decisions
9. Provide actionable, specific feedback
10. Make a clear verdict: APPROVE, REVISE, or REJECT

Verdict Guidelines:
- APPROVE: Code is production-ready, well-tested, and meets quality standards
- REVISE: Code has issues that can be fixed with iterations (send back to coder)
- REJECT: Code has fundamental problems requiring major rework or re-planning

Output format:
1. Summary: Brief overview of code quality (2-3 sentences)
2. Strengths: What the code does well (2-3 bullet points)
3. Issues: Critical or important issues found (numbered list)
4. Test Coverage: Assessment of test quality and coverage
5. Verdict: APPROVE | REVISE | REJECT
6. Action Items: Specific changes needed (if REVISE or REJECT)
7. Confidence: Your confidence in this verdict (0-100%)

Be thorough but constructive. Focus on actionable feedback."""


class ReviewVerdict(str):
    """Review verdict enum values."""

    APPROVE = "APPROVE"
    REVISE = "REVISE"
    REJECT = "REJECT"


def extract_verdict_from_text(feedback: str) -> str:
    """Extract verdict from plain text reviewer feedback (legacy fallback).

    Looks for APPROVE, REVISE, or REJECT in the feedback and returns it.
    Defaults to REVISE if no clear verdict is found.

    Args:
        feedback: The review feedback from the model

    Returns:
        One of: APPROVE, REVISE, REJECT
    """
    feedback_upper = feedback.upper()

    if "APPROVE" in feedback_upper:
        return ReviewVerdict.APPROVE
    elif "REJECT" in feedback_upper:
        return ReviewVerdict.REJECT
    elif "REVISE" in feedback_upper:
        return ReviewVerdict.REVISE

    # Default to REVISE if unclear
    logger.warning("Could not extract clear verdict from feedback, defaulting to REVISE")
    return ReviewVerdict.REVISE


def parse_structured_verdict(response_text: str) -> StructuredReviewVerdict | None:
    """Parse structured JSON verdict from model response.

    Attempts to extract and parse JSON from the response. Handles cases where
    the model includes extra text around the JSON.

    Args:
        response_text: Raw response text from the model

    Returns:
        StructuredReviewVerdict if parsing succeeds, None otherwise
    """
    try:
        # Try direct JSON parse first
        data = json.loads(response_text.strip())
        return StructuredReviewVerdict.model_validate(data)
    except (json.JSONDecodeError, Exception):
        pass

    # Try to extract JSON from markdown code blocks
    json_pattern = r"```(?:json)?\s*(\{[\s\S]*?\})\s*```"
    matches = re.findall(json_pattern, response_text)
    for match in matches:
        try:
            data = json.loads(match)
            return StructuredReviewVerdict.model_validate(data)
        except (json.JSONDecodeError, Exception):
            continue

    # Try to find raw JSON object in the response
    brace_pattern = r"\{[\s\S]*\}"
    matches = re.findall(brace_pattern, response_text)
    for match in matches:
        try:
            data = json.loads(match)
            # Validate it has the required fields
            if "verdict" in data and "summary" in data:
                return StructuredReviewVerdict.model_validate(data)
        except (json.JSONDecodeError, Exception):
            continue

    logger.warning("Could not parse structured verdict from response")
    return None


def create_fallback_verdict(feedback: str) -> StructuredReviewVerdict:
    """Create a structured verdict from plain text feedback (fallback).

    Used when the model doesn't return valid JSON. Extracts what we can
    from the plain text response.

    Args:
        feedback: Plain text review feedback

    Returns:
        StructuredReviewVerdict with extracted information
    """
    verdict = extract_verdict_from_text(feedback)

    # Try to extract confidence from text (e.g., "Confidence: 85%")
    confidence = 0.7  # Default confidence
    confidence_match = re.search(r"confidence[:\s]+(\d+)%?", feedback, re.IGNORECASE)
    if confidence_match:
        confidence = min(1.0, int(confidence_match.group(1)) / 100)

    # Cast verdict to the expected Literal type
    verdict_literal: Literal["APPROVE", "REVISE", "REJECT"] = (
        "APPROVE" if verdict == "APPROVE" else ("REJECT" if verdict == "REJECT" else "REVISE")
    )

    return StructuredReviewVerdict(
        summary=feedback[:300] + "..." if len(feedback) > 300 else feedback,
        verdict=verdict_literal,
        confidence=confidence,
        issues=[],  # Can't reliably extract from plain text
        strengths=[],
        action_items=[],
        test_coverage_assessment="",
    )


async def reviewer_node(
    state: WorkflowState, config: RunnableConfig | None = None
) -> dict[str, Any]:
    """Code review node - comprehensively reviews code and tests.

    This node is the final quality gate. It analyzes the generated code,
    test suite, and determines if the work is ready or needs revision.

    Phase 3 Features:
    - Structured JSON output parsing with confidence scores
    - Detailed issue categorization (security, performance, etc.)
    - Fallback to text parsing if JSON fails

    Args:
        state: Current workflow state containing code and test_results
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - review_feedback: Human-readable review findings
            - status: "complete" if APPROVE, "coding" if REVISE
            - messages: Accumulated LLM messages
            - iterations: Incremented if revision needed
            - metadata: Updated with review metrics including:
                - structured_verdict: Full StructuredReviewVerdict data
                - confidence_score: Model's confidence in verdict
                - issues_by_category: Issue counts per category
                - critical_issue_count: Number of critical issues

    Raises:
        Exception: If LLM API call fails
    """
    import time
    from datetime import datetime

    logger.info(
        "Reviewer node executing",
        task_id=state.get("task_id"),
        code_length=len(state.get("code", "")),
        test_length=len(state.get("test_results", "")),
    )

    model = get_reviewer_model()

    # Build messages for the reviewer
    messages = list(state.get("messages", []))

    # Create the review prompt requesting JSON output
    review_prompt = f"""Please provide a comprehensive code review for the following:

## Generated Code
{state["code"]}

## Test Suite
{state["test_results"]}

## Context (Execution Plan)
{state["plan"]}

Review the code thoroughly covering:
1. Code quality, correctness, and architecture
2. Security vulnerabilities or anti-patterns
3. Test coverage and quality
4. Error handling and edge cases
5. Performance considerations
6. Maintainability and documentation

Respond with a JSON object containing your review verdict."""

    messages.append(HumanMessage(content=review_prompt))

    # Invoke the model with structured output system prompt
    start_time = time.time()
    response = await model.ainvoke(
        [
            ("system", REVIEWER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )
    latency_ms = int((time.time() - start_time) * 1000)

    raw_content = response.content if isinstance(response, BaseMessage) else str(response)
    # Handle the case where content might be a list (e.g., for tool calls)
    if isinstance(raw_content, list):
        response_text = " ".join(str(item) for item in raw_content)
    else:
        response_text = str(raw_content)

    # Try to parse structured verdict, fall back to text extraction
    structured_verdict = parse_structured_verdict(response_text)
    if structured_verdict is None:
        logger.info(
            "Falling back to text-based verdict extraction",
            task_id=state.get("task_id"),
        )
        structured_verdict = create_fallback_verdict(response_text)

    verdict = structured_verdict.verdict
    confidence = structured_verdict.confidence

    # Generate human-readable feedback from structured verdict
    feedback_content = structured_verdict.to_feedback_text()

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    logger.info(
        "Reviewer completed review",
        task_id=state.get("task_id"),
        verdict=verdict,
        confidence=confidence,
        issue_count=len(structured_verdict.issues),
        critical_issues=structured_verdict.critical_issue_count,
        feedback_length=len(feedback_content),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )

    # Determine next status based on verdict
    # REVISE: go back to coder (handled by graph routing)
    # APPROVE or REJECT: workflow is complete
    next_status = "coding" if verdict == ReviewVerdict.REVISE else "complete"

    # Only increment iterations on REVISE, not on REJECT or APPROVE
    iterations = state.get("iterations", 0)
    if verdict == ReviewVerdict.REVISE:
        iterations += 1

    return {
        "review_feedback": feedback_content,
        "status": next_status,
        "messages": [response],
        "iterations": iterations,
        "metadata": {
            **(state.get("metadata", {})),
            "review_completed_at": datetime.now(UTC).isoformat(),
            "reviewer_model": "sonnet",
            "verdict": verdict,
            "confidence_score": confidence,
            "reviewer_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
            # Structured verdict metrics (Phase 3)
            "structured_verdict": {
                "summary": structured_verdict.summary,
                "verdict": structured_verdict.verdict,
                "confidence": structured_verdict.confidence,
                "strengths": structured_verdict.strengths,
                "issues": [
                    {
                        "severity": i.severity.value,
                        "category": i.category.value,
                        "description": i.description,
                        "file_path": i.file_path,
                        "line_number": i.line_number,
                        "suggested_fix": i.suggested_fix,
                    }
                    for i in structured_verdict.issues
                ],
                "action_items": structured_verdict.action_items,
                "test_coverage_assessment": structured_verdict.test_coverage_assessment,
            },
            "issues_by_category": structured_verdict.issues_by_category,
            "critical_issue_count": structured_verdict.critical_issue_count,
            "major_issue_count": structured_verdict.major_issue_count,
        },
    }


async def review_with_stream(
    code: str,
    test_results: str,
    plan: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Generate review with streaming output and metrics collection.

    This function streams the review process to the client in real-time
    while collecting usage metrics. Yields (chunk, None) for content chunks,
    then ("", metrics) as the final item with complete usage metrics.

    Args:
        code: Generated code to review
        test_results: Generated test code
        plan: Execution plan from planner
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in review_with_stream(code, tests, plan, task_id):
            if metrics is None:
                send_to_client(chunk)  # Stream to client
            else:
                # Final metrics available
                log_usage(metrics.input_tokens, metrics.output_tokens)
    """
    logger.info("Starting stream code review", task_id=task_id)

    model = get_reviewer_model()

    review_prompt = f"""Please provide a comprehensive code review for the following:

## Generated Code
{code}

## Test Suite
{test_results}

## Context (Execution Plan)
{plan}

Please provide a thorough review covering:
1. Code quality, correctness, and architecture
2. Security vulnerabilities or anti-patterns
3. Test coverage and quality
4. Error handling and edge cases
5. Performance considerations
6. Maintainability and documentation

End with a clear verdict: APPROVE (code is production-ready), REVISE (needs iterations), or REJECT (fundamental issues)."""

    messages: list[tuple[str, str]] = [
        ("system", REVIEWER_SYSTEM_PROMPT),
        ("human", review_prompt),
    ]

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            logger.debug("Streaming review chunk", task_id=task_id, chunk_length=len(chunk))
            yield chunk, None
        else:
            logger.info(
                "Finished stream code review",
                task_id=task_id,
                input_tokens=metrics.input_tokens,
                output_tokens=metrics.output_tokens,
                latency_ms=metrics.latency_ms,
            )
            yield "", metrics
