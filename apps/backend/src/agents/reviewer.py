"""Reviewer agent node for comprehensive code quality assessment.

The reviewer is the final node in the workflow and is responsible for analyzing
the generated code and test suite, identifying quality issues, and determining
whether the code should be approved, revised, or rejected.

TODO: Add council-based review with multiple judges (Phase 3)
TODO: Add detailed metrics collection (Phase 3)
TODO: Add review caching and reuse (Phase 4)
"""

from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.models import get_reviewer_model
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)


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


def extract_verdict(feedback: str) -> str:
    """Extract verdict from reviewer feedback.

    Looks for APPROVE, REVISE, or REJECT in the feedback and returns it.
    Defaults to REVISE if no clear verdict is found.

    Args:
        feedback: The review feedback from the model

    Returns:
        One of: APPROVE, REVISE, REJECT

    TODO: Add more robust verdict extraction using structured output (Phase 3)
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


async def reviewer_node(
    state: WorkflowState, config: RunnableConfig | None = None
) -> dict[str, Any]:
    """Code review node - comprehensively reviews code and tests.

    This node is the final quality gate. It analyzes the generated code,
    test suite, and determines if the work is ready or needs revision.

    Args:
        state: Current workflow state containing code and test_results
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - review_feedback: Detailed review findings and verdict
            - status: "complete" if APPROVE, "coding" if REVISE
            - messages: Accumulated LLM messages
            - iterations: Incremented if revision needed
            - metadata: Updated with review timestamp and verdict

    Raises:
        Exception: If Claude API call fails

    TODO: Add structured output for review verdict (Phase 3)
    TODO: Add confidence scoring (Phase 3)
    """
    logger.info(
        "Reviewer node executing",
        task_id=state.get("task_id"),
        code_length=len(state.get("code", "")),
        test_length=len(state.get("test_results", "")),
    )

    model = get_reviewer_model()

    # Build messages for the reviewer
    messages = list(state.get("messages", []))

    # Create the review prompt
    review_prompt = f"""Please provide a comprehensive code review for the following:

## Generated Code
{state["code"]}

## Test Suite
{state["test_results"]}

## Context (Execution Plan)
{state["plan"]}

Please provide a thorough review covering:
1. Code quality, correctness, and architecture
2. Security vulnerabilities or anti-patterns
3. Test coverage and quality
4. Error handling and edge cases
5. Performance considerations
6. Maintainability and documentation

End with a clear verdict: APPROVE (code is production-ready), REVISE (needs iterations), or REJECT (fundamental issues)."""

    messages.append(HumanMessage(content=review_prompt))

    # Invoke the model with system prompt
    import time

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
        feedback_content = " ".join(str(item) for item in raw_content)
    else:
        feedback_content = str(raw_content)
    verdict = extract_verdict(feedback_content)

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    logger.info(
        "Reviewer completed review",
        task_id=state.get("task_id"),
        verdict=verdict,
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
            "review_completed_at": __import__("datetime").datetime.utcnow().isoformat(),
            "reviewer_model": "sonnet",
            "verdict": verdict,
            "reviewer_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
        },
    }


async def review_with_stream(
    code: str,
    test_results: str,
    plan: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[str, None]:
    """Generate review with streaming output.

    This function streams the review process to the client in real-time,
    useful for showing progress during the review phase.

    Args:
        code: Generated code to review
        test_results: Generated test code
        plan: Execution plan from planner
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Chunks of review feedback as they stream from Claude

    TODO: Implement streaming collection for review metrics (Phase 2)
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

    async for chunk in model.astream(
        [
            ("system", REVIEWER_SYSTEM_PROMPT),
            ("human", review_prompt),
        ],
        config,
    ):
        if chunk.content:
            content = chunk.content
            if isinstance(content, str):
                logger.debug("Streaming review chunk", task_id=task_id, chunk_length=len(content))
                yield content

    logger.info("Finished stream code review", task_id=task_id)
