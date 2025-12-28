"""Planner agent node for breaking down coding tasks into execution steps.

The planner is the first node in the workflow and is responsible for analyzing
the task description and creating a detailed, step-by-step execution plan.
This plan guides all subsequent coding, testing, and review stages.

Features:
- Plan caching for similar tasks (reduces LLM calls)
- Plan validation and complexity scoring
- Plan refinement loop on validation failure
- Streaming support for real-time output

TODO: Add plan versioning and history (Phase 4)
"""

import time
from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.analyzers.plan_validator import (
    PlanValidation,
    get_refinement_suggestions,
    needs_refinement,
    validate_plan,
)
from src.agents.infrastructure.models import get_planner_model
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Maximum number of refinement attempts before giving up
MAX_REFINEMENT_ATTEMPTS = 2


PLANNER_SYSTEM_PROMPT = """You are a senior software architect specializing in breaking down complex coding tasks.

Your role is to analyze a task description and create a detailed, step-by-step execution plan.
The plan should be specific, actionable, and guide other agents through implementation.

Requirements:
1. Start with understanding the requirements and edge cases
2. Break the task into logical phases (design -> implementation -> testing -> deployment considerations)
3. For each step, specify:
   - What needs to be done
   - Why it matters
   - Any dependencies on other steps
   - Success criteria
4. Consider error handling, security, and performance
5. Be concise but comprehensive
6. Format as a numbered list with clear sections

Output a professional plan that a senior developer could follow directly."""


REFINEMENT_PROMPT_TEMPLATE = """Your previous plan needs improvement. Here's the feedback:

## Validation Issues
{issues}

## Suggestions for Improvement
{suggestions}

Please revise your plan to address these issues. Focus on:
1. Making each step more specific and actionable
2. Adding clear success criteria where appropriate
3. Organizing into logical phases if the plan is complex
4. Ensuring all steps have clear action verbs (create, implement, test, etc.)

Original task: {task_description}

Previous plan:
{previous_plan}

Please provide an improved, revised plan:"""


def _format_validation_issues(validation: PlanValidation) -> str:
    """Format validation issues for the refinement prompt."""
    if not validation.issues:
        return "No specific issues identified."

    lines = []
    for issue in validation.issues:
        severity = issue.severity.value.upper()
        location = f" ({issue.location})" if issue.location else ""
        lines.append(f"- [{severity}]{location}: {issue.message}")
    return "\n".join(lines)


async def _invoke_planner(
    model: Any,
    messages: list[tuple[str, str]],
    config: RunnableConfig | None,
) -> tuple[str, dict[str, int], int]:
    """Invoke the planner model and return the response with metrics.

    Args:
        model: The LangChain model to invoke
        messages: List of (role, content) tuples
        config: Optional RunnableConfig for tracing

    Returns:
        Tuple of (plan_content, usage_dict, latency_ms)
    """
    start_time = time.time()
    response = await model.ainvoke(messages, config)
    latency_ms = int((time.time() - start_time) * 1000)

    plan_content = response.content if isinstance(response, BaseMessage) else str(response)

    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }

    return plan_content, usage, latency_ms


async def _refine_plan(
    model: Any,
    task_description: str,
    previous_plan: str,
    validation: PlanValidation,
    config: RunnableConfig | None,
) -> tuple[str, dict[str, int], int]:
    """Refine a plan based on validation feedback.

    Args:
        model: The LangChain model to invoke
        task_description: Original task description
        previous_plan: The plan that needs refinement
        validation: Validation result with issues
        config: Optional RunnableConfig for tracing

    Returns:
        Tuple of (refined_plan, usage_dict, latency_ms)
    """
    issues_text = _format_validation_issues(validation)
    suggestions = get_refinement_suggestions(validation)
    suggestions_text = "\n".join(f"- {s}" for s in suggestions) if suggestions else "None"

    refinement_prompt = REFINEMENT_PROMPT_TEMPLATE.format(
        issues=issues_text,
        suggestions=suggestions_text,
        task_description=task_description,
        previous_plan=previous_plan,
    )

    messages = [
        ("system", PLANNER_SYSTEM_PROMPT),
        ("human", refinement_prompt),
    ]

    return await _invoke_planner(model, messages, config)


async def _get_cached_plan(task_description: str) -> dict[str, Any] | None:
    """Try to retrieve a cached plan for the task description.

    Only attempts cache retrieval if plan caching is enabled in settings.
    Returns None on any error or if caching is disabled.

    Args:
        task_description: The task description to look up

    Returns:
        Cached plan data or None if not found/disabled
    """
    if not getattr(settings, "enable_plan_caching", False):
        return None

    try:
        from src.services.cache_service import WorkflowCacheService, get_redis_client

        redis = await get_redis_client()
        cache = WorkflowCacheService(redis=redis)
        cached = await cache.get_cached_plan(task_description)

        if cached:
            logger.info(
                "Plan cache hit",
                original_task_id=cached.get("task_id"),
                cached_at=cached.get("cached_at"),
            )
        return cached

    except Exception as e:
        logger.debug("Plan cache lookup failed", error=str(e))
        return None


async def _cache_plan(task_id: int, task_description: str, plan: str) -> bool:
    """Cache a successfully generated plan.

    Only attempts caching if plan caching is enabled in settings.
    Failures are logged but don't raise exceptions.

    Args:
        task_id: The task ID
        task_description: The task description
        plan: The generated plan text

    Returns:
        True if cached successfully, False otherwise
    """
    if not getattr(settings, "enable_plan_caching", False):
        return False

    try:
        from src.services.cache_service import WorkflowCacheService, get_redis_client

        redis = await get_redis_client()
        cache = WorkflowCacheService(redis=redis)
        return await cache.cache_plan(task_id, task_description, plan)

    except Exception as e:
        logger.debug("Plan cache store failed", error=str(e))
        return False


async def planner_node(
    state: WorkflowState, config: RunnableConfig | None = None
) -> dict[str, Any]:
    """Plan execution node - breaks down task into actionable steps.

    This node is the entry point to the workflow. It receives a task description
    and produces a detailed execution plan that guides the coder, tester, and
    reviewer nodes. The plan is validated and scored for complexity.

    Features:
    - Plan caching for similar tasks
    - Plan validation with complexity scoring
    - Automatic plan refinement loop if validation fails (max 2 attempts)

    Args:
        state: Current workflow state containing task_description
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - plan: Generated execution plan
            - status: Updated to "coding"
            - messages: Accumulated LLM messages
            - metadata: Updated with planning timestamp, validation, complexity,
              and refinement history if applicable

    Raises:
        Exception: If Claude API call fails
    """
    task_id = state.get("task_id", 0)
    task_description = state.get("task_description", "")

    logger.info(
        "Planner node executing",
        task_id=task_id,
        description_length=len(task_description),
    )

    # Check cache first
    cached_plan = await _get_cached_plan(task_description)
    if cached_plan:
        plan_content = cached_plan.get("plan", "")
        validation = validate_plan(plan_content)

        logger.info(
            "Using cached plan",
            task_id=task_id,
            original_task_id=cached_plan.get("task_id"),
            cached_at=cached_plan.get("cached_at"),
            plan_length=len(plan_content),
        )

        return {
            "plan": plan_content,
            "status": "coding",
            "messages": [],  # No new messages when using cache
            "metadata": {
                **(state.get("metadata", {})),
                "plan_generated_at": datetime.utcnow().isoformat(),
                "planner_model": "sonnet",
                "plan_validation": validation.to_dict(),
                "plan_from_cache": True,
                "cache_source_task_id": cached_plan.get("task_id"),
                "cache_source_timestamp": cached_plan.get("cached_at"),
                "planner_usage": {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "latency_ms": 0,
                },
            },
        }

    model = get_planner_model()

    # Build initial messages for the planner
    initial_prompt = f"""Please create a detailed execution plan for the following coding task:

Task: {task_description}

Provide a comprehensive step-by-step plan that will guide implementation, testing, and review."""

    messages = [
        ("system", PLANNER_SYSTEM_PROMPT),
        ("human", initial_prompt),
    ]

    # Generate initial plan
    plan_content, usage, latency_ms = await _invoke_planner(model, messages, config)

    # Track total usage across refinement attempts
    total_usage = {
        "input_tokens": usage["input_tokens"],
        "output_tokens": usage["output_tokens"],
        "total_tokens": usage["total_tokens"],
    }
    total_latency_ms = latency_ms

    # Validate the plan
    validation = validate_plan(str(plan_content))

    logger.info(
        "Planner generated initial plan",
        task_id=task_id,
        plan_length=len(plan_content),
        input_tokens=usage["input_tokens"],
        output_tokens=usage["output_tokens"],
        latency_ms=latency_ms,
        is_valid=validation.is_valid,
        complexity_level=validation.complexity.level.value,
        total_steps=validation.total_steps,
    )

    # Plan refinement loop
    refinement_attempts = 0
    refinement_history: list[dict[str, Any]] = []

    while needs_refinement(validation) and refinement_attempts < MAX_REFINEMENT_ATTEMPTS:
        refinement_attempts += 1

        logger.info(
            "Plan needs refinement, attempting...",
            task_id=task_id,
            attempt=refinement_attempts,
            max_attempts=MAX_REFINEMENT_ATTEMPTS,
            error_count=validation.error_count,
            warning_count=validation.warning_count,
        )

        # Record the previous attempt
        refinement_history.append({
            "attempt": refinement_attempts,
            "plan_length": len(plan_content),
            "validation": validation.to_dict(),
            "issues": [issue.to_dict() for issue in validation.issues],
        })

        # Refine the plan
        plan_content, refinement_usage, refinement_latency = await _refine_plan(
            model=model,
            task_description=task_description,
            previous_plan=str(plan_content),
            validation=validation,
            config=config,
        )

        # Accumulate usage
        total_usage["input_tokens"] += refinement_usage["input_tokens"]
        total_usage["output_tokens"] += refinement_usage["output_tokens"]
        total_usage["total_tokens"] += refinement_usage["total_tokens"]
        total_latency_ms += refinement_latency

        # Re-validate
        validation = validate_plan(str(plan_content))

        logger.info(
            "Plan refined",
            task_id=task_id,
            attempt=refinement_attempts,
            plan_length=len(plan_content),
            refinement_tokens=refinement_usage["total_tokens"],
            is_valid=validation.is_valid,
            complexity_level=validation.complexity.level.value,
            total_steps=validation.total_steps,
        )

    # Log final refinement status
    if refinement_attempts > 0:
        final_status = "improved" if validation.is_valid else "max_attempts_reached"
        logger.info(
            "Plan refinement completed",
            task_id=task_id,
            refinement_attempts=refinement_attempts,
            final_status=final_status,
            total_tokens_used=total_usage["total_tokens"],
            total_latency_ms=total_latency_ms,
        )

    # Cache the final plan for future similar tasks (non-blocking)
    plan_cached = await _cache_plan(task_id, task_description, str(plan_content))
    if plan_cached:
        logger.debug("Plan cached for future use", task_id=task_id)

    # Build metadata with refinement info
    metadata = {
        **(state.get("metadata", {})),
        "plan_generated_at": datetime.utcnow().isoformat(),
        "planner_model": "sonnet",
        "plan_validation": validation.to_dict(),
        "plan_from_cache": False,
        "plan_cached": plan_cached,
        "planner_usage": {
            "input_tokens": total_usage["input_tokens"],
            "output_tokens": total_usage["output_tokens"],
            "total_tokens": total_usage["total_tokens"],
            "latency_ms": total_latency_ms,
        },
    }

    # Add refinement history if any refinement occurred
    if refinement_attempts > 0:
        metadata["plan_refinement"] = {
            "attempts": refinement_attempts,
            "max_attempts": MAX_REFINEMENT_ATTEMPTS,
            "refinement_successful": validation.is_valid,
            "history": refinement_history,
        }

    return {
        "plan": plan_content,
        "status": "coding",
        "messages": [],  # Messages tracked in metadata instead
        "metadata": metadata,
    }


async def plan_with_stream(
    task_description: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Generate a plan with streaming output and metrics collection.

    This function streams the planner's thinking to the client in real-time
    while also collecting usage metrics. Yields (chunk, None) for content chunks,
    then ("", metrics) as the final item with complete usage metrics.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in plan_with_stream(task_description, task_id):
            if metrics is None:
                send_to_client(chunk)  # Stream to client
            else:
                # Final metrics available
                log_usage(metrics.input_tokens, metrics.output_tokens)
    """
    logger.info("Starting stream planning", task_id=task_id)

    model = get_planner_model()
    messages: list[tuple[str, str]] = [
        ("system", PLANNER_SYSTEM_PROMPT),
        (
            "human",
            f"""Please create a detailed execution plan for the following coding task:

Task: {task_description}

Provide a comprehensive step-by-step plan that will guide implementation, testing, and review.""",
        ),
    ]

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            logger.debug("Streaming plan chunk", task_id=task_id, chunk_length=len(chunk))
            yield chunk, None
        else:
            logger.info(
                "Finished stream planning",
                task_id=task_id,
                input_tokens=metrics.input_tokens,
                output_tokens=metrics.output_tokens,
                latency_ms=metrics.latency_ms,
            )
            yield "", metrics
