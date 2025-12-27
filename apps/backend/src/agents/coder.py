"""Coder agent node for generating code from execution plans.

The coder is responsible for analyzing the plan from the planner and generating
clean, well-documented, production-ready code. It supports multiple programming
languages and integrates with the code generation pipeline.

TODO: Add structured output for code blocks (Phase 2)
TODO: Add code formatting and linting integration (Phase 2)
TODO: Add multi-file code generation (Phase 2)
TODO: Add code quality metrics and scoring (Phase 3)
"""

from typing import Any, AsyncGenerator

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.models import get_coder_model
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
    production-ready code. It can handle multiple programming languages and
    incorporates feedback from previous review iterations.

    Args:
        state: Current workflow state containing plan and review feedback
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - code: Generated source code
            - status: Updated to "testing"
            - messages: Accumulated LLM messages
            - metadata: Updated with code generation timestamp
            - iterations: Incremented if this is a revision

    Raises:
        Exception: If Claude API call fails

    TODO: Add language parameter for multi-language support (Phase 2)
    TODO: Add code complexity metrics (Phase 2)
    TODO: Add syntax validation before returning (Phase 2)
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
    response = await model.ainvoke(
        [
            ("system", CODER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )

    code_content = response.content if isinstance(response, BaseMessage) else str(response)

    logger.info(
        "Coder generated code",
        task_id=state.get("task_id"),
        code_length=len(code_content),
        is_revision=bool(state.get("review_feedback")),
    )

    # Increment iterations if this is a revision
    iterations = state.get("iterations", 0)
    if state.get("review_feedback"):
        iterations += 1

    return {
        "code": code_content,
        "status": "testing",
        "messages": [response],
        "iterations": iterations,
        "metadata": {
            **(state.get("metadata", {})),
            "code_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "coder_model": "sonnet",
            "is_revision": bool(state.get("review_feedback")),
        },
    }


async def code_with_stream(
    plan: str,
    task_id: int,
    review_feedback: str | None = None,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[str, None]:
    """Generate code with streaming output.

    This function streams the code generation process to the client in real-time,
    useful for showing progress during long code generation tasks.

    Args:
        plan: Execution plan from planner
        task_id: ID of the task
        review_feedback: Optional feedback from previous review
        config: Optional RunnableConfig for tracing

    Yields:
        Chunks of generated code as they stream from Claude

    TODO: Implement streaming collection for metrics (Phase 2)
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

    async for chunk in model.astream(
        [
            ("system", CODER_SYSTEM_PROMPT),
            ("human", code_prompt),
        ],
        config,
    ):
        if chunk.content:
            content = chunk.content
            if isinstance(content, str):
                logger.debug("Streaming code chunk", task_id=task_id, chunk_length=len(content))
                yield content

    logger.info("Finished stream code generation", task_id=task_id)
