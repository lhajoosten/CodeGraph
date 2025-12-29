"""Coder agent node for generating code from execution plans.

The coder is responsible for analyzing the plan from the planner and generating
clean, well-documented, production-ready code. It supports multiple programming
languages and integrates with the code generation pipeline.

The coder has full access to tools for:
- Reading and writing files
- Editing existing code
- Running linters and type checkers
- Executing Python code
- Git operations
"""

from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from src.agents.infrastructure.models import get_coder_model, get_coder_model_with_tools
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.nodes.react_executor import (
    count_tool_calls_by_type,
    execute_react_loop,
    extract_final_response,
)
from src.agents.processing.formatter import (
    create_multi_file_result,
    format_python_code,
    infer_filepath,
)
from src.agents.processing.parser import parse_code_blocks
from src.agents.state import WorkflowState
from src.core.logging import get_logger
from src.tools.registry import AgentType

logger = get_logger(__name__)


CODER_SYSTEM_PROMPT = """You are an expert Python developer specializing in clean, maintainable, and secure code.

Your role is to implement code based on the execution plan from the planning phase.

## Available Tools

You have access to the following tools to help you implement code:

**File Operations:**
- read_file: Read file contents to understand existing code
- write_file: Write new files or replace existing ones
- edit_file: Make targeted edits to existing files
- list_directory: Explore directory structure

**Code Quality:**
- run_ruff: Check code for linting issues
- run_mypy: Check type annotations
- run_python: Execute Python code to verify it works

**Git Operations:**
- git_status: Check repository status
- git_diff: See recent changes

## Process

1. First, use read_file and list_directory to explore the existing codebase
2. Understand the context and patterns used in the project
3. Write code using write_file or edit_file
4. Use run_ruff and run_mypy to verify code quality
5. Optionally use run_python to test your implementation

## Requirements

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

## Output

After using tools to implement and verify your code, provide a summary of:
- Files created or modified
- Key implementation decisions
- Any issues found and how they were addressed

When reviewing feedback, be thorough in addressing all concerns and improving code quality."""


async def coder_node(
    state: WorkflowState,
    config: RunnableConfig = {},  # noqa: B006
) -> dict[str, Any]:
    """Code generation node - implements code from the plan using tools.

    This node takes the execution plan created by the planner and generates
    production-ready code using the ReAct pattern. The coder can:
    - Read existing files to understand context
    - Write new files or edit existing ones
    - Run linters and type checkers
    - Execute code to verify it works

    Args:
        state: Current workflow state containing plan and review feedback
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - code: Generated source code (primary file content)
            - code_files: Multi-file result with all generated files
            - status: Updated to "testing"
            - messages: Accumulated LLM messages
            - tool_calls: List of tool calls made during execution
            - metadata: Updated with code generation timestamp, tool usage
            - iterations: Incremented if this is a revision

    Raises:
        Exception: If Claude API call fails
    """
    logger.info(
        "Coder node executing with tools",
        task_id=state.get("task_id"),
        has_feedback=bool(state.get("review_feedback")),
        workspace=state.get("workspace_path"),
    )

    # Get model with tools bound
    model = get_coder_model_with_tools()

    # Build initial messages
    initial_messages: list[BaseMessage] = [
        SystemMessage(content=CODER_SYSTEM_PROMPT),
    ]

    # Add any existing conversation context
    for msg in state.get("messages", []):
        initial_messages.append(msg)

    # Create the code generation prompt
    workspace_info = ""
    if state.get("workspace_path"):
        workspace_info = f"\n\nWorkspace: {state['workspace_path']}"

    code_prompt = f"""Based on the following execution plan, implement the code:

Plan:
{state["plan"]}{workspace_info}"""

    # If there's review feedback, incorporate it
    if state.get("review_feedback"):
        code_prompt += f"""

Previous Review Feedback:
{state["review_feedback"]}

Please address all the feedback above in your revised code."""

    initial_messages.append(HumanMessage(content=code_prompt))

    # Execute ReAct loop with tools
    all_messages, tool_call_records, usage = await execute_react_loop(
        model=model,
        messages=initial_messages,
        state=dict(state),
        agent_type=AgentType.CODER,
        config=config,
    )

    # Extract the final response
    final_response = extract_final_response(all_messages)

    # Parse code blocks from the final response
    parsed = parse_code_blocks(final_response)

    # Build multi-file result with formatting
    code_blocks_tuples: list[tuple[str, str, str]] = []
    for i, block in enumerate(parsed.code_blocks):
        filepath = block.filepath or infer_filepath(block.content, i)
        code_blocks_tuples.append((filepath, block.content, block.language.value))

    # Create multi-file result with formatting and validation
    multi_file_result = create_multi_file_result(code_blocks_tuples, format_code=True)

    # Use primary file content, or fall back to final response
    if multi_file_result.primary_file:
        code_content = multi_file_result.primary_file.content
    elif parsed.has_code and parsed.primary_code:
        format_result = format_python_code(parsed.primary_code.content)
        code_content = format_result.formatted_code
    else:
        code_content = final_response

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

    # Count tool calls by type
    tool_counts = count_tool_calls_by_type(tool_call_records)

    logger.info(
        "Coder completed with tools",
        task_id=state.get("task_id"),
        code_length=len(code_content),
        code_blocks=len(parsed.code_blocks),
        file_count=len(multi_file_result.files),
        all_valid=multi_file_result.all_valid,
        is_revision=bool(state.get("review_feedback")),
        tool_calls_made=len(tool_call_records),
        tool_counts=tool_counts,
        iterations=usage.get("iterations", 0),
        input_tokens=usage.get("input_tokens", 0),
        output_tokens=usage.get("output_tokens", 0),
        latency_ms=usage.get("latency_ms", 0),
    )

    # Increment iterations if this is a revision
    iterations = state.get("iterations", 0)
    if state.get("review_feedback"):
        iterations += 1

    # Combine existing tool calls with new ones
    existing_tool_calls = list(state.get("tool_calls", []))
    existing_tool_calls.extend(tool_call_records)

    return {
        "code": code_content,
        "code_files": multi_file_result.to_dict(),
        "status": "testing",
        "messages": all_messages[len(initial_messages) :],  # Only new messages
        "tool_calls": existing_tool_calls,
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
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
                "latency_ms": usage.get("latency_ms", 0),
                "iterations": usage.get("iterations", 0),
            },
            "tool_calls_summary": {
                "total": len(tool_call_records),
                "by_tool": tool_counts,
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
