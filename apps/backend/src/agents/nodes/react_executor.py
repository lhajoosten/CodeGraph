"""ReAct execution pattern for agent nodes with tool calling.

This module provides the core ReAct (Reason + Act) loop implementation
that enables agents to iteratively call tools and observe results.

The ReAct pattern:
1. Agent receives task and available tools
2. Agent reasons about what to do
3. Agent calls tools to gather information or take actions
4. Agent observes tool results
5. Repeat until agent determines it's done (no more tool calls)

Usage:
    from src.agents.nodes.react_executor import execute_react_loop

    async def my_agent_node(state: WorkflowState) -> dict:
        model = get_model_with_tools(AgentType.CODER)
        messages = build_initial_messages(state)

        all_messages, tool_calls, usage = await execute_react_loop(
            model=model,
            messages=messages,
            state=state,
            agent_type=AgentType.CODER,
        )

        return {"output": extract_output(all_messages), "tool_calls": tool_calls}
"""

import time
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

from src.core.config import settings
from src.core.logging import get_logger
from src.tools.base import execute_tool
from src.tools.registry import AgentType, get_tools_for_agent

logger = get_logger(__name__)

# Default maximum iterations for the ReAct loop
DEFAULT_MAX_ITERATIONS = 10


async def execute_react_loop(
    model: Any,
    messages: list[BaseMessage],
    state: dict[str, Any],
    agent_type: AgentType,
    config: RunnableConfig | None = None,
    max_iterations: int | None = None,
) -> tuple[list[BaseMessage], list[dict[str, Any]], dict[str, int]]:
    """Execute a ReAct loop with tool calling.

    The agent reasons about what to do, calls tools, observes results,
    and iterates until done or max iterations reached.

    Args:
        model: LangChain model with tools bound via bind_tools()
        messages: Initial messages for the conversation (system + user prompts)
        state: Current workflow state dict (for building tool context)
        agent_type: Type of agent (determines tool permissions)
        config: Optional RunnableConfig for tracing callbacks
        max_iterations: Maximum iterations (defaults to settings.max_tool_iterations)

    Returns:
        Tuple of:
            - List of all messages (including tool calls and results)
            - List of tool call records for state tracking
            - Usage metrics dict (input_tokens, output_tokens, total_tokens, latency_ms)

    Example:
        >>> model = get_coder_model_with_tools()
        >>> messages = [SystemMessage(content="..."), HumanMessage(content="...")]
        >>> all_msgs, tool_calls, usage = await execute_react_loop(
        ...     model, messages, state, AgentType.CODER
        ... )
        >>> print(f"Made {len(tool_calls)} tool calls")
    """
    from src.tools.base import build_tool_context

    # Determine max iterations
    max_iter = max_iterations
    if max_iter is None:
        max_iter = getattr(settings, "max_tool_iterations", DEFAULT_MAX_ITERATIONS)

    # Get tools for this agent type
    tools = get_tools_for_agent(agent_type)
    if not tools:
        logger.warning(
            "react_loop_no_tools",
            agent_type=agent_type.value,
            message="No tools available for agent type",
        )

    # Build tool context with appropriate permissions
    context = build_tool_context(state, agent_type)

    # Track state
    all_messages = list(messages)  # Copy to avoid mutating input
    tool_call_records: list[dict[str, Any]] = []
    total_usage = {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
    }
    start_time = time.time()

    logger.info(
        "react_loop_started",
        agent_type=agent_type.value,
        task_id=state.get("task_id"),
        tool_count=len(tools),
        max_iterations=max_iter,
    )

    iteration = 0
    for iteration in range(max_iter):
        # Call the model
        try:
            response = await model.ainvoke(all_messages, config)
        except Exception as e:
            logger.error(
                "react_loop_model_error",
                agent_type=agent_type.value,
                task_id=state.get("task_id"),
                iteration=iteration + 1,
                error=str(e),
            )
            raise

        all_messages.append(response)

        # Track token usage if available
        usage_metadata = getattr(response, "usage_metadata", None)
        if usage_metadata:
            total_usage["input_tokens"] += usage_metadata.get("input_tokens", 0)
            total_usage["output_tokens"] += usage_metadata.get("output_tokens", 0)
            total_usage["total_tokens"] += usage_metadata.get("total_tokens", 0)

        # Check if model wants to call tools
        tool_calls = getattr(response, "tool_calls", None) or []

        if not tool_calls:
            # No more tool calls - agent is done reasoning
            logger.info(
                "react_loop_completed",
                agent_type=agent_type.value,
                task_id=state.get("task_id"),
                iterations=iteration + 1,
                tool_calls_made=len(tool_call_records),
                reason="no_more_tool_calls",
            )
            break

        # Execute each tool call
        for tool_call in tool_calls:
            tool_name = tool_call.get("name", "unknown")
            tool_args = tool_call.get("args", {})
            tool_call_id = tool_call.get("id", f"call_{iteration}_{tool_name}")

            logger.debug(
                "react_loop_tool_executing",
                tool_name=tool_name,
                task_id=state.get("task_id"),
                iteration=iteration + 1,
                args_preview=str(tool_args)[:100],
            )

            # Execute the tool
            tool_message = await execute_tool(tool_call, tools, context)
            all_messages.append(tool_message)

            # Determine if tool call was successful
            # Handle content being either string or list of content blocks
            content_str = (
                tool_message.content
                if isinstance(tool_message.content, str)
                else str(tool_message.content)
            )
            is_success = not (
                content_str.startswith("Error:")
                or content_str.startswith("Tool execution failed")
                or "error" in content_str.lower()[:50]
            )

            # Record the tool call for state tracking
            tool_call_records.append(
                {
                    "iteration": iteration + 1,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "tool_call_id": tool_call_id,
                    "result_preview": str(tool_message.content)[:500],
                    "success": is_success,
                    "agent_type": agent_type.value,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
            )

            logger.debug(
                "react_loop_tool_completed",
                tool_name=tool_name,
                task_id=state.get("task_id"),
                success=is_success,
                result_length=len(str(tool_message.content)),
            )
    else:
        # Max iterations reached without completion
        logger.warning(
            "react_loop_max_iterations",
            agent_type=agent_type.value,
            task_id=state.get("task_id"),
            max_iterations=max_iter,
            tool_calls_made=len(tool_call_records),
        )

    # Calculate total latency
    total_usage["latency_ms"] = int((time.time() - start_time) * 1000)
    total_usage["iterations"] = iteration + 1

    return all_messages, tool_call_records, total_usage


def extract_final_response(messages: list[BaseMessage]) -> str:
    """Extract the final text response from a ReAct loop.

    Finds the last AI message that doesn't have tool calls,
    which represents the agent's final output.

    Args:
        messages: List of messages from execute_react_loop()

    Returns:
        The content of the final AI response, or empty string if none found
    """
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            # Skip messages that are just tool calls
            if getattr(msg, "tool_calls", None):
                continue
            if msg.content:
                return str(msg.content)
    return ""


def extract_tool_outputs(
    messages: list[BaseMessage],
    tool_name: str | None = None,
) -> list[str]:
    """Extract tool output contents from messages.

    Args:
        messages: List of messages from execute_react_loop()
        tool_name: Optional filter for specific tool name

    Returns:
        List of tool output contents
    """
    outputs = []
    for msg in messages:
        if isinstance(msg, ToolMessage):
            # If filtering by tool name, check the preceding AI message
            if tool_name is not None:
                # Would need to track tool names - for now return all
                pass
            outputs.append(str(msg.content))
    return outputs


def count_tool_calls_by_type(
    tool_call_records: list[dict[str, Any]],
) -> dict[str, int]:
    """Count tool calls by tool name.

    Args:
        tool_call_records: List of tool call records from execute_react_loop()

    Returns:
        Dict mapping tool name to call count
    """
    counts: dict[str, int] = {}
    for record in tool_call_records:
        tool_name = record.get("tool_name", "unknown")
        counts[tool_name] = counts.get(tool_name, 0) + 1
    return counts
