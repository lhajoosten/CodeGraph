"""Tester agent node for generating and executing tests for generated code.

The tester is responsible for analyzing the generated code and plan, creating
comprehensive pytest test cases with full coverage, and simulating test execution.
It supports multiple test scenarios and integrates with the testing pipeline.

TODO: Add mock strategy recommendations (Phase 3)
TODO: Add integration with actual pytest execution (Phase 3)
"""

from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.code_parser import parse_code_blocks
from src.agents.models import get_tester_model
from src.agents.state import WorkflowState
from src.agents.streaming import StreamingMetrics, stream_with_metrics
from src.agents.test_analyzer import create_test_analysis
from src.core.logging import get_logger

logger = get_logger(__name__)


TESTER_SYSTEM_PROMPT = """You are an expert QA engineer specializing in pytest and comprehensive test coverage.

Your role is to analyze generated code and create thorough, production-ready test suites.

Requirements:
1. Analyze the code and identify all functions, classes, and edge cases
2. Write comprehensive pytest test cases with clear, descriptive names
3. Include unit tests for individual functions
4. Include integration tests for component interactions
5. Cover edge cases, boundary conditions, and error scenarios
6. Use fixtures and mocking for external dependencies
7. Include docstrings explaining what each test verifies
8. Follow pytest best practices and conventions
9. Ensure tests are deterministic and isolated
10. Add parametrized tests for multiple input scenarios

Output format: Provide complete, ready-to-run pytest test code.
Include all necessary imports and fixtures.
Structure tests in a clear, logical order.
Add comments for complex test logic but keep them concise.

When reviewing previous feedback, thoroughly address all concerns and improve test coverage."""


async def tester_node(state: WorkflowState, config: RunnableConfig | None = None) -> dict[str, Any]:
    """Test generation node - creates comprehensive tests for generated code.

    This node takes the generated code and execution plan, then produces
    comprehensive pytest test cases with full coverage including unit tests,
    integration tests, and edge case scenarios. It also analyzes the tests
    for coverage metrics and quality scoring.

    Args:
        state: Current workflow state containing code and plan
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - test_results: Generated pytest test code
            - test_analysis: Structured analysis with coverage, quality, recommendations
            - status: Updated to "reviewing"
            - messages: Accumulated LLM messages
            - metadata: Updated with test generation timestamp, analysis summary
            - iterations: Preserved from state

    Raises:
        Exception: If Claude API call fails
    """
    logger.info(
        "Tester node executing",
        task_id=state.get("task_id"),
        code_length=len(state.get("code", "")),
    )

    model = get_tester_model()

    # Build messages for the tester
    messages = list(state.get("messages", []))

    # Create the test generation prompt
    test_prompt = f"""Analyze the following code and execution plan, then generate comprehensive pytest test cases:

Code:
{state["code"]}

Execution Plan (for context):
{state["plan"]}

Generate complete, production-ready pytest test cases with:
- Unit tests for all functions and methods
- Integration tests for component interactions
- Edge case and boundary condition testing
- Error handling and exception testing
- Clear test names and docstrings
- Proper fixtures and mocking setup
- Parametrized tests for multiple scenarios
- At least 80% code coverage target"""

    messages.append(HumanMessage(content=test_prompt))

    # Invoke the model with system prompt
    import time

    start_time = time.time()
    response = await model.ainvoke(
        [
            ("system", TESTER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )
    latency_ms = int((time.time() - start_time) * 1000)

    raw_content = response.content if isinstance(response, BaseMessage) else str(response)

    # Parse code blocks from response to extract test code
    parsed = parse_code_blocks(str(raw_content))

    # Get the primary test code (prefer parsed, fall back to raw)
    if parsed.has_code and parsed.test_blocks:
        test_content = "\n\n".join(block.content for block in parsed.test_blocks)
    elif parsed.has_code and parsed.code_blocks:
        test_content = parsed.code_blocks[0].content
    else:
        test_content = str(raw_content)

    # Analyze the generated tests
    source_code = state.get("code", "")
    test_analysis = create_test_analysis(
        test_code=test_content,
        source_code=source_code,
        filepath="tests/test_generated.py",
    )

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    logger.info(
        "Tester generated tests",
        task_id=state.get("task_id"),
        test_length=len(test_content),
        test_count=test_analysis.test_suite.test_count,
        coverage=test_analysis.coverage.coverage_percentage,
        quality_score=test_analysis.quality_score,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )

    return {
        "test_results": test_content,
        "test_analysis": test_analysis.to_dict(),
        "status": "reviewing",
        "messages": [response],
        "iterations": state.get("iterations", 0),
        "metadata": {
            **(state.get("metadata", {})),
            "tests_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "tester_model": "sonnet",
            "test_summary": {
                "test_count": test_analysis.test_suite.test_count,
                "coverage_percentage": test_analysis.coverage.coverage_percentage,
                "quality_score": test_analysis.quality_score,
                "passed": test_analysis.summary.passed,
                "failed": test_analysis.summary.failed,
                "recommendations": test_analysis.recommendations[:3],  # Top 3
            },
            "tester_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
        },
    }


async def test_with_stream(
    code: str,
    plan: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Generate tests with streaming output and metrics collection.

    This function streams the test generation process to the client in real-time
    while collecting usage metrics. Yields (chunk, None) for content chunks,
    then ("", metrics) as the final item with complete usage metrics.

    Args:
        code: Generated code to test
        plan: Execution plan from planner
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in test_with_stream(code, plan, task_id):
            if metrics is None:
                send_to_client(chunk)  # Stream to client
            else:
                # Final metrics available
                log_usage(metrics.input_tokens, metrics.output_tokens)
    """
    logger.info("Starting stream test generation", task_id=task_id)

    model = get_tester_model()

    test_prompt = f"""Analyze the following code and execution plan, then generate comprehensive pytest test cases:

Code:
{code}

Execution Plan (for context):
{plan}

Generate complete, production-ready pytest test cases with:
- Unit tests for all functions and methods
- Integration tests for component interactions
- Edge case and boundary condition testing
- Error handling and exception testing
- Clear test names and docstrings
- Proper fixtures and mocking setup
- Parametrized tests for multiple scenarios
- At least 80% code coverage target"""

    messages: list[tuple[str, str]] = [
        ("system", TESTER_SYSTEM_PROMPT),
        ("human", test_prompt),
    ]

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            logger.debug("Streaming test chunk", task_id=task_id, chunk_length=len(chunk))
            yield chunk, None
        else:
            logger.info(
                "Finished stream test generation",
                task_id=task_id,
                input_tokens=metrics.input_tokens,
                output_tokens=metrics.output_tokens,
                latency_ms=metrics.latency_ms,
            )
            yield "", metrics
