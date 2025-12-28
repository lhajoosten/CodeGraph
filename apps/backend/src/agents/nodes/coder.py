"""Coder agent node for generating code from execution plans.

The coder is responsible for analyzing the plan from the planner and generating
clean, well-documented, production-ready code. It supports multiple programming
languages and integrates with the code generation pipeline.
"""

from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.infrastructure.models import get_coder_model
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.processing.formatter import (
    create_multi_file_result,
    format_python_code,
    infer_filepath,
)
from src.agents.processing.parser import parse_code_blocks
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)


CODER_SYSTEM_PROMPT = """You are an expert Python developer specializing in clean, maintainable, and secure code.

Your role is to implement code based on the execution plan from the planning phase.

Requirements:
1. Write clean, well-documented code following PEP 8 standards
2. Include comprehensive docstrings for all functions and classes
3. Add proper type hints to all function parameters and returns
4. Implement error handling with appropriate exceptions
5. Include logging statements for debugging
6. Consider edge cases and error conditions
7. Write code that is testable and modular
8. Follow security best practices
9. Optimize for readability and maintainability
10. If reviewing previous feedback, address all points

Output format: Provide the complete, production-ready code.
Include comments for complex logic but keep comments concise.

When reviewing feedback, be thorough in addressing all concerns and improving code quality."""


async def coder_node(state: WorkflowState, config: RunnableConfig | None = None) -> dict[str, Any]:
    """Code generation node - implements code from the plan.

    This node takes the execution plan created by the planner and generates
    production-ready code. It supports multi-file generation, code formatting,
    linting, and syntax validation.

    Args:
        state: Current workflow state containing plan and review feedback
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - code: Generated source code (primary file content)
            - code_files: Multi-file result with all generated files
            - status: Updated to "testing"
            - messages: Accumulated LLM messages
            - metadata: Updated with code generation timestamp, formatting, validation
            - iterations: Incremented if this is a revision

    Raises:
        Exception: If Claude API call fails
    """
    logger.info(
        "Coder node executing",
        task_id=state.get("task_id"),
        has_feedback=bool(state.get("review_feedback")),
    )

    model = get_coder_model()

    # Build messages for the coder
    messages = list(state.get("messages", []))

    # Create the code generation prompt
    code_prompt = f"""Based on the following execution plan, generate complete, production-ready code:

Plan:
{state["plan"]}"""

    # If there's review feedback, incorporate it
    if state.get("review_feedback"):
        code_prompt += f"""

Previous Review Feedback:
{state["review_feedback"]}

Please address all the feedback above in your revised code."""

    messages.append(HumanMessage(content=code_prompt))

    # Invoke the model with system prompt
    import time

    start_time = time.time()
    response = await model.ainvoke(
        [
            ("system", CODER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )
    latency_ms = int((time.time() - start_time) * 1000)

    raw_content = response.content if isinstance(response, BaseMessage) else str(response)

    # Parse code blocks from response
    parsed = parse_code_blocks(str(raw_content))

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    # Build multi-file result with formatting
    code_blocks_tuples: list[tuple[str, str, str]] = []
    for i, block in enumerate(parsed.code_blocks):
        filepath = block.filepath or infer_filepath(block.content, i)
        code_blocks_tuples.append((filepath, block.content, block.language.value))

    # Create multi-file result with formatting and validation
    multi_file_result = create_multi_file_result(code_blocks_tuples, format_code=True)

    # Use primary file content, or fall back to raw content
    if multi_file_result.primary_file:
        code_content = multi_file_result.primary_file.content
    elif parsed.has_code and parsed.primary_code:
        # Format single code block if no multi-file result
        format_result = format_python_code(parsed.primary_code.content)
        code_content = format_result.formatted_code
    else:
        code_content = str(raw_content)

    # Build structured code info for metadata
    code_blocks_info = [
        {
            "language": block.language.value,
            "filepath": block.filepath,
            "line_count": block.line_count,
            "is_test": block.is_test,
            "functions": block.metadata.get("functions", []),
            "classes": block.metadata.get("classes", []),
        }
        for block in parsed.code_blocks
    ]

    # Collect formatting results
    format_summary = {
        "all_valid": multi_file_result.all_valid,
        "files_formatted": sum(
            1 for f in multi_file_result.files if f.format_result and f.format_result.was_modified
        ),
        "syntax_errors": sum(
            1 for f in multi_file_result.files if f.format_result and f.format_result.syntax_error
        ),
        "lint_warnings": sum(
            f.format_result.warning_count for f in multi_file_result.files if f.format_result
        ),
    }

    logger.info(
        "Coder generated code",
        task_id=state.get("task_id"),
        code_length=len(code_content),
        code_blocks=len(parsed.code_blocks),
        file_count=len(multi_file_result.files),
        all_valid=multi_file_result.all_valid,
        is_revision=bool(state.get("review_feedback")),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )

    # Increment iterations if this is a revision
    iterations = state.get("iterations", 0)
    if state.get("review_feedback"):
        iterations += 1

    return {
        "code": code_content,
        "code_files": multi_file_result.to_dict(),
        "status": "testing",
        "messages": [response],
        "iterations": iterations,
        "metadata": {
            **(state.get("metadata", {})),
            "code_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "coder_model": "sonnet",
            "is_revision": bool(state.get("review_feedback")),
            "code_blocks": code_blocks_info,
            "code_block_count": len(parsed.code_blocks),
            "has_test_code": any(block.is_test for block in parsed.code_blocks),
            "multi_file": multi_file_result.to_dict(),
            "formatting": format_summary,
            "coder_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
        },
    }


async def code_with_stream(
    plan: str,
    task_id: int,
    review_feedback: str | None = None,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Generate code with streaming output and metrics collection.

    This function streams the code generation process to the client in real-time
    while collecting usage metrics. Yields (chunk, None) for content chunks,
    then ("", metrics) as the final item with complete usage metrics.

    Args:
        plan: Execution plan from planner
        task_id: ID of the task
        review_feedback: Optional feedback from previous review
        config: Optional RunnableConfig for tracing

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in code_with_stream(plan, task_id):
            if metrics is None:
                send_to_client(chunk)  # Stream to client
            else:
                # Final metrics available
                log_usage(metrics.input_tokens, metrics.output_tokens)
    """
    logger.info("Starting stream code generation", task_id=task_id)

    model = get_coder_model()

    code_prompt = f"""Based on the following execution plan, generate complete, production-ready code:

Plan:
{plan}"""

    if review_feedback:
        code_prompt += f"""

Previous Review Feedback:
{review_feedback}

Please address all the feedback above in your revised code."""

    messages: list[tuple[str, str]] = [
        ("system", CODER_SYSTEM_PROMPT),
        ("human", code_prompt),
    ]

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            logger.debug("Streaming code chunk", task_id=task_id, chunk_length=len(chunk))
            yield chunk, None
        else:
            logger.info(
                "Finished stream code generation",
                task_id=task_id,
                input_tokens=metrics.input_tokens,
                output_tokens=metrics.output_tokens,
                latency_ms=metrics.latency_ms,
            )
            yield "", metrics
