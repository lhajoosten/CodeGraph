"""Workflow execution functions for running agent workflows.

This module provides the high-level API for executing workflows, including:
- Single execution with invoke_workflow()
- Streaming execution with stream_workflow()
- Event filtering utilities for stream processing

Features:
- Timeout support with graceful handling
- Cancellation integration
- Database tracking support
- Checkpointing for persistence
- Event filtering for streaming

Example:
    # Simple invocation
    result = await invoke_workflow(
        task_description="Build auth API",
        task_id=123,
    )

    # Streaming with event filtering
    async for event in stream_workflow("Build auth", task_id=123):
        if filter_stream_events(event, include_types=["on_node_end"]):
            print(f"Completed: {event['name']}")
"""

import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from src.agents.cancellation import (
    CancellationToken,
    WorkflowCancelledError,
    cleanup_cancellation_token,
    get_cancellation_token,
)
from src.agents.state import WorkflowState
from src.core.config import settings
from src.core.logging import get_logger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

# Default workflow timeout (5 minutes)
WORKFLOW_TIMEOUT_SECONDS = 300


class StreamEventType:
    """Event types emitted during workflow streaming.

    Use these constants to filter events in stream_workflow.

    Categories:
    - Graph events: on_chain_start, on_chain_end, on_chain_error
    - Node events: on_node_start, on_node_end
    - LLM events: on_llm_start, on_llm_end, on_llm_stream (tokens)
    - Tool events: on_tool_start, on_tool_end

    Example:
        # Filter for progress-only events
        event_filter = StreamEventType.progress_events()
        async for event in stream_workflow(..., event_filter=event_filter):
            update_progress_bar(event)
    """

    # Graph lifecycle
    ON_CHAIN_START = "on_chain_start"
    ON_CHAIN_END = "on_chain_end"
    ON_CHAIN_ERROR = "on_chain_error"

    # Node execution
    ON_NODE_START = "on_node_start"
    ON_NODE_END = "on_node_end"

    # LLM interactions
    ON_LLM_START = "on_llm_start"
    ON_LLM_END = "on_llm_end"
    ON_LLM_STREAM = "on_llm_stream"  # Token-by-token streaming

    # Tool usage
    ON_TOOL_START = "on_tool_start"
    ON_TOOL_END = "on_tool_end"

    @classmethod
    def all_types(cls) -> list[str]:
        """Get all event types."""
        return [
            cls.ON_CHAIN_START,
            cls.ON_CHAIN_END,
            cls.ON_CHAIN_ERROR,
            cls.ON_NODE_START,
            cls.ON_NODE_END,
            cls.ON_LLM_START,
            cls.ON_LLM_END,
            cls.ON_LLM_STREAM,
            cls.ON_TOOL_START,
            cls.ON_TOOL_END,
        ]

    @classmethod
    def node_events(cls) -> list[str]:
        """Get only node-related events."""
        return [cls.ON_NODE_START, cls.ON_NODE_END]

    @classmethod
    def llm_events(cls) -> list[str]:
        """Get only LLM-related events."""
        return [cls.ON_LLM_START, cls.ON_LLM_END, cls.ON_LLM_STREAM]

    @classmethod
    def progress_events(cls) -> list[str]:
        """Get events useful for progress tracking (minimal set)."""
        return [cls.ON_NODE_START, cls.ON_NODE_END, cls.ON_CHAIN_END]


def filter_stream_events(
    event: dict[str, Any],
    include_types: list[str] | None = None,
    exclude_types: list[str] | None = None,
    include_nodes: list[str] | None = None,
) -> bool:
    """Filter streaming events based on criteria.

    Args:
        event: The event to check
        include_types: If set, only include these event types
        exclude_types: If set, exclude these event types
        include_nodes: If set, only include events from these nodes

    Returns:
        True if the event should be included, False otherwise

    Example:
        # Only get node completion events
        async for event in stream_workflow(...):
            if filter_stream_events(event, include_types=["on_node_end"]):
                print(f"Node completed: {event['name']}")

        # Exclude streaming tokens (reduce noise)
        async for event in stream_workflow(...):
            if filter_stream_events(event, exclude_types=["on_llm_stream"]):
                process_event(event)
    """
    event_type = event.get("event", "")

    # Check type inclusion
    if include_types and event_type not in include_types:
        return False

    # Check type exclusion
    if exclude_types and event_type in exclude_types:
        return False

    # Check node filtering
    if include_nodes:
        event_name = event.get("name", "")
        # Check if event is related to one of the included nodes
        if not any(node in event_name for node in include_nodes):
            return False

    return True


async def invoke_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
    cancellation_token: CancellationToken | None = None,
    use_checkpointing: bool | None = None,
) -> WorkflowState:
    """Execute the complete workflow and return final state.

    This function executes the complete multi-agent workflow with optional timeout,
    cancellation, and checkpointing support. If the workflow exceeds the timeout
    or is cancelled, execution is stopped and an appropriate error state is returned.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task in the database
        thread_id: Optional thread ID for resuming checkpointed execution.
            When checkpointing is enabled, this ID is used to persist and
            resume workflow state.
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records
        cancellation_token: Optional token for cancellation support
        use_checkpointing: Whether to enable checkpointing for this workflow.
            If None, uses settings.enable_checkpointing. Requires thread_id to be set.

    Returns:
        Final workflow state with all accumulated results

    Raises:
        asyncio.TimeoutError: If workflow exceeds timeout
        WorkflowCancelledError: If workflow is cancelled

    Example:
        # Simple execution
        result = await invoke_workflow("Build auth API", task_id=123)

        # With checkpointing for resumption
        result = await invoke_workflow(
            "Build auth API",
            task_id=123,
            thread_id="task-123",
            use_checkpointing=True,
        )

        # With cancellation support
        token = get_cancellation_token(task_id)
        result = await invoke_workflow(
            "Build auth API",
            task_id=123,
            cancellation_token=token,
        )
    """
    # Import here to avoid circular imports
    from src.agents.graph import get_compiled_graph, get_compiled_graph_with_checkpointer

    # Determine if we should use checkpointing
    if use_checkpointing is None:
        use_checkpointing = getattr(settings, "enable_checkpointing", False)

    # Checkpointing requires a thread_id
    if use_checkpointing and not thread_id:
        thread_id = f"task-{task_id}"
        logger.info(
            "Auto-generated thread_id for checkpointing",
            task_id=task_id,
            thread_id=thread_id,
        )

    logger.info(
        "Invoking workflow",
        task_id=task_id,
        has_thread_id=thread_id is not None,
        timeout_seconds=timeout_seconds or WORKFLOW_TIMEOUT_SECONDS,
        tracking_enabled=db is not None,
        checkpointing_enabled=use_checkpointing,
    )

    # Get compiled graph with or without checkpointing
    if use_checkpointing:
        graph = await get_compiled_graph_with_checkpointer()
    else:
        graph = get_compiled_graph()

    timeout = timeout_seconds or WORKFLOW_TIMEOUT_SECONDS

    initial_state: WorkflowState = {
        "messages": [],
        "task_id": task_id,
        "task_description": task_description,
        "plan": "",
        "code": "",
        "code_files": {},
        "test_results": "",
        "test_analysis": {},
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {
            "workflow_started_at": datetime.now(UTC).isoformat(),
            "thread_id": thread_id,
            "timeout_seconds": timeout,
        },
        "workspace_path": None,
        "tool_calls": [],
    }

    config: dict[str, Any] = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    # Add tracking callback if database session provided
    tracker = None
    if db is not None:
        from src.agents.infrastructure.tracking import AgentRunTracker

        tracker = AgentRunTracker(db=db, task_id=task_id)
        config["callbacks"] = [tracker]

    # Get or use provided cancellation token
    token = cancellation_token or get_cancellation_token(task_id)

    # Store cancellation check in metadata for nodes to access
    initial_state["metadata"]["cancellation_token_id"] = task_id

    try:
        # Check for pre-cancellation
        token.raise_if_cancelled()

        result: WorkflowState = await asyncio.wait_for(
            graph.ainvoke(initial_state, config), timeout=timeout
        )

        # Check for cancellation after completion
        if token.is_cancelled:
            raise WorkflowCancelledError(token.cancel_reason or "Workflow cancelled")

        logger.info(
            "Workflow execution completed", task_id=task_id, final_status=result.get("status")
        )
        return result

    except WorkflowCancelledError as e:
        logger.warning(
            "Workflow cancelled",
            task_id=task_id,
            reason=str(e),
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Return state with cancellation information
        initial_state["error"] = f"Workflow cancelled: {e}"
        initial_state["status"] = "cancelled"
        initial_state["metadata"]["workflow_cancelled_at"] = datetime.now(UTC).isoformat()
        initial_state["metadata"]["cancel_reason"] = str(e)
        return initial_state

    except TimeoutError:
        logger.error(
            "Workflow execution timeout",
            task_id=task_id,
            timeout_seconds=timeout,
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Return state with error information
        initial_state["error"] = f"Workflow execution exceeded timeout of {timeout} seconds"
        initial_state["status"] = "timeout"
        initial_state["metadata"]["workflow_timeout_at"] = datetime.now(UTC).isoformat()
        return initial_state

    finally:
        # Cleanup the cancellation token
        cleanup_cancellation_token(task_id)


async def stream_workflow(
    task_description: str,
    task_id: int,
    thread_id: str | None = None,
    timeout_seconds: int | None = None,
    db: "AsyncSession | None" = None,
    event_filter: list[str] | None = None,
) -> Any:
    """Stream workflow execution with full event tracking and timeout.

    This streams detailed execution events from the graph, useful for
    sending real-time updates to the frontend via SSE. If the workflow
    exceeds the timeout, streaming stops and a timeout event is yielded.

    Args:
        task_description: Description of the coding task
        task_id: ID of the task
        thread_id: Optional thread ID for resumable execution
        timeout_seconds: Optional timeout in seconds (defaults to WORKFLOW_TIMEOUT_SECONDS)
        db: Optional database session for tracking AgentRun records
        event_filter: Optional list of event types to include. If None, yields all events.
            Use StreamEventType constants for filtering.

    Yields:
        Events from the workflow. Each event is a dict with:
        - event: Event type (see StreamEventType)
        - name: Name of the component (node name, chain name, etc.)
        - data: Event-specific data
        - run_id: UUID of the run
        - parent_ids: List of parent run IDs
        - tags: List of tags for the event

        Common event structures:
        - on_node_start: {"input": {...}, "name": "planner"}
        - on_node_end: {"output": {...}, "name": "planner"}
        - on_llm_stream: {"chunk": "token text"}
        - on_chain_end: {"output": {...}}  # Final result
        - error: {"error": "message", "task_id": int}  # On timeout/error

    Example:
        # Full streaming with all events
        async for event in stream_workflow("Build auth", task_id=123):
            if event.get("event") == "on_node_end":
                print(f"Completed: {event['name']}")

        # Only node events (less noise)
        async for event in stream_workflow(
            "Build auth", task_id=123,
            event_filter=StreamEventType.progress_events()
        ):
            update_progress_bar(event)

        # Filter with helper function
        async for event in stream_workflow("Build auth", task_id=123):
            if filter_stream_events(event, exclude_types=["on_llm_stream"]):
                process_event(event)
    """
    # Import here to avoid circular imports
    from src.agents.graph import get_compiled_graph

    logger.info(
        "Starting workflow stream",
        task_id=task_id,
        has_thread_id=thread_id is not None,
        timeout_seconds=timeout_seconds or WORKFLOW_TIMEOUT_SECONDS,
        tracking_enabled=db is not None,
    )

    graph = get_compiled_graph()
    timeout = timeout_seconds or WORKFLOW_TIMEOUT_SECONDS

    initial_state: WorkflowState = {
        "messages": [],
        "task_id": task_id,
        "task_description": task_description,
        "plan": "",
        "code": "",
        "code_files": {},
        "test_results": "",
        "test_analysis": {},
        "review_feedback": "",
        "iterations": 0,
        "status": "planning",
        "error": None,
        "metadata": {
            "workflow_started_at": datetime.now(UTC).isoformat(),
            "thread_id": thread_id,
            "timeout_seconds": timeout,
        },
        "workspace_path": None,
        "tool_calls": [],
    }

    config: dict[str, Any] = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    # Add tracking callback if database session provided
    tracker = None
    if db is not None:
        from src.agents.infrastructure.tracking import AgentRunTracker

        tracker = AgentRunTracker(db=db, task_id=task_id)
        config["callbacks"] = [tracker]

    try:
        async with asyncio.timeout(timeout):
            async for event in graph.astream_events(initial_state, config, version="v2"):
                # Apply event filtering if specified
                if event_filter is not None:
                    event_type = event.get("event", "")
                    if event_type not in event_filter:
                        continue
                yield event
    except TimeoutError:
        logger.error(
            "Workflow stream timeout",
            task_id=task_id,
            timeout_seconds=timeout,
        )
        # Cleanup any active tracking runs
        if tracker:
            await tracker.cleanup()

        # Yield a timeout error event
        yield {
            "type": "error",
            "data": {
                "error": f"Workflow execution exceeded timeout of {timeout} seconds",
                "task_id": task_id,
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }

    logger.info("Workflow stream completed", task_id=task_id)
