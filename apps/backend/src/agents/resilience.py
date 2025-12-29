"""Error recovery and resilience for workflow nodes.

This module provides automatic error handling, retry logic, and recovery
strategies for workflow nodes to handle transient failures gracefully.

Features:
- Automatic retry with exponential backoff for transient errors
- Error classification (rate limit, timeout, API error, etc.)
- State truncation for context length errors
- Graceful degradation with fallback to simpler models
- Per-node retry tracking

Example:
    # Wrap a node with error recovery
    resilient_planner = create_resilient_node(planner_node, "planner")
    workflow.add_node("planner", resilient_planner)
"""

import asyncio
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any

from langchain_core.runnables import RunnableConfig

from src.agents.infrastructure.error_handler import ErrorHandler
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)

# Type alias for node functions - matches LangGraph's expected signature
NodeFunction = Callable[[WorkflowState, RunnableConfig], Awaitable[dict[str, Any]]]

# Global error handler instance for the workflow
_workflow_error_handler = ErrorHandler()


def create_resilient_node(
    node_fn: NodeFunction,
    node_name: str,
    model_tier: str = "sonnet",
) -> NodeFunction:
    """Wrap a node function with error recovery capabilities.

    This wrapper integrates the ErrorHandler to provide:
    - Automatic retry with exponential backoff for transient errors
    - Error classification and appropriate recovery strategies
    - State truncation for context length errors
    - Graceful degradation with fallback to simpler models

    Args:
        node_fn: The original node async function
        node_name: Name of the node for tracking/logging
        model_tier: Current model tier for fallback decisions

    Returns:
        Wrapped node function with error recovery

    Example:
        resilient_planner = create_resilient_node(planner_node, "planner")
        workflow.add_node("planner", resilient_planner)
    """

    @wraps(node_fn)
    async def resilient_wrapper(
        state: WorkflowState,
        config: RunnableConfig = {},  # noqa: B006
    ) -> dict[str, Any]:
        handler = _workflow_error_handler
        current_state = state
        last_error: Exception | None = None

        while True:
            try:
                result = await node_fn(current_state, config)

                # Reset retry counts on success
                handler.reset_retries(node_name)

                # Add error recovery metadata if we recovered from errors
                if last_error is not None:
                    result.setdefault("metadata", {})
                    result["metadata"]["recovered_from_error"] = True
                    result["metadata"]["recovery_error_type"] = str(type(last_error).__name__)

                return result

            except Exception as e:
                last_error = e
                recovery = handler.handle_error(e, node_name, current_state, model_tier)

                if recovery.should_retry:
                    logger.info(
                        "Node error - retrying",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        delay=recovery.retry_delay_seconds,
                        attempt=recovery.current_retry,
                        max_retries=recovery.max_retries,
                    )

                    if recovery.retry_delay_seconds > 0:
                        await asyncio.sleep(recovery.retry_delay_seconds)

                    # Use modified state if provided (e.g., truncated for context length)
                    if recovery.modified_state:
                        current_state = recovery.modified_state  # type: ignore[assignment]
                    continue

                elif recovery.should_fallback:
                    logger.warning(
                        "Node error - fallback required",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        fallback_tier=recovery.fallback_model_tier,
                    )
                    # For now, re-raise with context - future: implement model tier switching
                    raise RuntimeError(
                        f"Fallback to {recovery.fallback_model_tier} required: {e}"
                    ) from e

                else:
                    # No recovery possible - add error to state and return
                    logger.error(
                        "Node error - recovery exhausted",
                        node=node_name,
                        error_type=recovery.error_type.value,
                        error=str(e),
                    )

                    return {
                        "error": f"Node '{node_name}' failed: {e}",
                        "status": "error",
                        "metadata": {
                            **(state.get("metadata", {})),
                            "error_node": node_name,
                            "error_type": recovery.error_type.value,
                            "error_message": str(e),
                            "recovery_exhausted": True,
                        },
                    }

    return resilient_wrapper


def reset_workflow_error_handler() -> None:
    """Reset the workflow error handler retry counts.

    Call this at the start of a new workflow execution to ensure
    clean retry state.
    """
    _workflow_error_handler.reset_retries()


def get_error_handler() -> ErrorHandler:
    """Get the global workflow error handler.

    Useful for inspection or manual error handling.

    Returns:
        The global ErrorHandler instance
    """
    return _workflow_error_handler


def get_node_retry_counts() -> dict[str, int]:
    """Get current retry counts for all nodes.

    Useful for debugging and monitoring.

    Returns:
        Dictionary mapping node names to retry counts
    """
    return _workflow_error_handler.retry_counts.copy()
