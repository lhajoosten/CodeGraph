"""Planner agent node for breaking down coding tasks into execution steps.

The planner is the first node in the workflow and is responsible for analyzing
the task description and creating a detailed, step-by-step execution plan.
This plan guides all subsequent coding, testing, and review stages.

TODO: Add plan validation and complexity scoring (Phase 2)
TODO: Add plan caching for similar tasks (Phase 3)
TODO: Add plan versioning and history (Phase 4)
"""

from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.models import get_planner_model
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)


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


async def planner_node(
    state: WorkflowState, config: RunnableConfig | None = None
) -> dict[str, Any]:
    """Plan execution node - breaks down task into actionable steps.

    This node is the entry point to the workflow. It receives a task description
    and produces a detailed execution plan that guides the coder, tester, and
    reviewer nodes.

    Args:
        state: Current workflow state containing task_description
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - plan: Generated execution plan
            - status: Updated to "coding"
            - messages: Accumulated LLM messages
            - metadata: Updated with planning timestamp

    Raises:
        Exception: If Claude API call fails

    TODO: Add plan refinement loop if plan too vague (Phase 2)
    TODO: Add task complexity detection (Phase 2)
    """
    logger.info(
        "Planner node executing",
        task_id=state.get("task_id"),
        description_length=len(state.get("task_description", "")),
    )

    model = get_planner_model()

    # Build messages for the planner
    messages = list(state.get("messages", []))
    messages.append(
        HumanMessage(
            content=f"""Please create a detailed execution plan for the following coding task:

Task: {state["task_description"]}

Provide a comprehensive step-by-step plan that will guide implementation, testing, and review."""
        )
    )

    # Invoke the model with system prompt
    import time

    start_time = time.time()
    response = await model.ainvoke(
        [
            ("system", PLANNER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )
    latency_ms = int((time.time() - start_time) * 1000)

    plan_content = response.content if isinstance(response, BaseMessage) else str(response)

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    logger.info(
        "Planner generated plan",
        task_id=state.get("task_id"),
        plan_length=len(plan_content),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )

    return {
        "plan": plan_content,
        "status": "coding",
        "messages": [response],
        "metadata": {
            **(state.get("metadata", {})),
            "plan_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "planner_model": "sonnet",
            "planner_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
        },
    }


async def plan_with_stream(
    task_description: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[str, None]:
    """Generate a plan with streaming output.

    This function is useful for streaming the planner's thinking to the client
    in real-time using Server-Sent Events. Yields chunks of the plan as they
    are generated by Claude.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Chunks of the plan as they stream from Claude

    TODO: Implement stream state collection for plan chunks (Phase 2)
    """
    logger.info("Starting stream planning", task_id=task_id)

    model = get_planner_model()

    async for chunk in model.astream(
        [
            ("system", PLANNER_SYSTEM_PROMPT),
            (
                "human",
                f"""Please create a detailed execution plan for the following coding task:

Task: {task_description}

Provide a comprehensive step-by-step plan that will guide implementation, testing, and review.""",
            ),
        ],
        config,
    ):
        if chunk.content:
            content = chunk.content
            if isinstance(content, str):
                logger.debug("Streaming plan chunk", task_id=task_id, chunk_length=len(content))
                yield content

    logger.info("Finished stream planning", task_id=task_id)
