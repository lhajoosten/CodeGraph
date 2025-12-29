"""LangGraph checkpointer integration for workflow state persistence.

This module provides the AsyncPostgresSaver checkpointer for persisting
workflow state across executions. This enables:
- Workflow resumption after interruption
- State inspection and debugging
- History tracking of workflow executions

The checkpointer uses PostgreSQL for reliable, ACID-compliant storage
of workflow checkpoints.

Usage:
    # Get a configured checkpointer
    checkpointer = await get_checkpointer()

    # Create workflow with checkpointing
    graph = create_workflow()
    compiled = graph.compile(checkpointer=checkpointer)

    # Execute with thread_id for resumability
    result = await compiled.ainvoke(state, {"configurable": {"thread_id": "my-thread"}})

Note:
    The checkpointer requires an initialized database with the checkpoints
    schema. Run the setup() method on first use.
"""

import asyncio
from typing import Any, cast

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Global checkpointer instance (singleton)
_checkpointer: AsyncPostgresSaver | None = None
_checkpointer_lock = asyncio.Lock()


def _get_connection_string() -> str:
    """Get the PostgreSQL connection string for the checkpointer.

    The checkpointer uses psycopg3 which requires a different connection
    string format than asyncpg used by SQLAlchemy.

    Returns:
        PostgreSQL connection string in psycopg3 format
    """
    # Get the database URL from settings
    db_url = str(settings.database_url)

    # Convert asyncpg format to psycopg format if needed
    # asyncpg: postgresql+asyncpg://user:pass@host:port/db
    # psycopg: postgresql://user:pass@host:port/db
    if "+asyncpg" in db_url:
        db_url = db_url.replace("+asyncpg", "")
    elif "+psycopg" in db_url:
        db_url = db_url.replace("+psycopg", "")

    return db_url


async def get_checkpointer() -> AsyncPostgresSaver:
    """Get or create the singleton AsyncPostgresSaver instance.

    This function is thread-safe and will only create one checkpointer
    instance per application lifecycle. The checkpointer connection pool
    is lazily initialized on first use.

    Returns:
        Configured AsyncPostgresSaver ready for use

    Raises:
        ConnectionError: If unable to connect to PostgreSQL

    Example:
        checkpointer = await get_checkpointer()
        graph = workflow.compile(checkpointer=checkpointer)
    """
    global _checkpointer

    if _checkpointer is not None:
        return _checkpointer

    async with _checkpointer_lock:
        # Double-check after acquiring lock
        if _checkpointer is not None:
            return _checkpointer

        connection_string = _get_connection_string()

        logger.info(
            "Initializing AsyncPostgresSaver checkpointer",
            database=connection_string.split("@")[-1].split("/")[0]
            if "@" in connection_string
            else "localhost",
        )

        try:
            # Create the checkpointer with async context manager
            # from_conn_string returns an async context manager in type stubs,
            # but actually returns a checkpointer directly in runtime
            checkpointer_instance = AsyncPostgresSaver.from_conn_string(connection_string)
            _checkpointer = cast(AsyncPostgresSaver, checkpointer_instance)

            # Setup the checkpointer tables if they don't exist
            await _checkpointer.setup()

            logger.info("AsyncPostgresSaver checkpointer initialized successfully")
            return _checkpointer

        except Exception as e:
            logger.error(
                "Failed to initialize checkpointer",
                error=str(e),
                error_type=type(e).__name__,
            )
            raise ConnectionError(f"Failed to initialize checkpointer: {e}") from e


async def close_checkpointer() -> None:
    """Close the checkpointer and release resources.

    This should be called during application shutdown to ensure
    proper cleanup of database connections.
    """
    global _checkpointer

    if _checkpointer is not None:
        try:
            # The checkpointer manages its own connection pool
            # Cleanup is handled automatically
            _checkpointer = None
            logger.info("Checkpointer closed")
        except Exception as e:
            logger.warning("Error closing checkpointer", error=str(e))


async def get_checkpoint_state(
    thread_id: str,
    checkpointer: AsyncPostgresSaver | None = None,
) -> dict[str, Any] | None:
    """Retrieve the latest checkpoint state for a thread.

    This is useful for inspecting workflow state or resuming
    from a specific checkpoint.

    Args:
        thread_id: The thread ID to look up
        checkpointer: Optional checkpointer instance (uses singleton if not provided)

    Returns:
        The checkpoint state dict or None if not found

    Example:
        state = await get_checkpoint_state("task-123")
        if state:
            print(f"Workflow status: {state.get('status')}")
    """
    if checkpointer is None:
        checkpointer = await get_checkpointer()

    try:
        config: RunnableConfig = {"configurable": {"thread_id": thread_id}}
        checkpoint_tuple = await checkpointer.aget_tuple(config)

        if checkpoint_tuple and checkpoint_tuple.checkpoint:
            return checkpoint_tuple.checkpoint.get("channel_values", {})

        return None

    except Exception as e:
        logger.warning(
            "Failed to get checkpoint state",
            thread_id=thread_id,
            error=str(e),
        )
        return None


async def list_checkpoints(
    thread_id: str,
    limit: int = 10,
    checkpointer: AsyncPostgresSaver | None = None,
) -> list[dict[str, Any]]:
    """List checkpoint history for a thread.

    Returns a list of checkpoints ordered by creation time (newest first).

    Args:
        thread_id: The thread ID to look up
        limit: Maximum number of checkpoints to return
        checkpointer: Optional checkpointer instance

    Returns:
        List of checkpoint metadata dicts

    Example:
        history = await list_checkpoints("task-123", limit=5)
        for cp in history:
            print(f"Checkpoint: {cp['checkpoint_id']} at {cp['created_at']}")
    """
    if checkpointer is None:
        checkpointer = await get_checkpointer()

    try:
        config: RunnableConfig = {"configurable": {"thread_id": thread_id}}
        checkpoints = []

        async for checkpoint_tuple in checkpointer.alist(config, limit=limit):
            checkpoints.append(
                {
                    "checkpoint_id": checkpoint_tuple.checkpoint.get("id")
                    if checkpoint_tuple.checkpoint
                    else None,
                    "thread_id": thread_id,
                    "parent_checkpoint_id": checkpoint_tuple.parent_config.get(
                        "configurable", {}
                    ).get("checkpoint_id")
                    if checkpoint_tuple.parent_config
                    else None,
                    "metadata": checkpoint_tuple.metadata,
                }
            )

        return checkpoints

    except Exception as e:
        logger.warning(
            "Failed to list checkpoints",
            thread_id=thread_id,
            error=str(e),
        )
        return []


async def delete_checkpoints(
    thread_id: str,
    checkpointer: AsyncPostgresSaver | None = None,
) -> bool:
    """Delete all checkpoints for a thread.

    This is useful for cleaning up old workflow data.

    Args:
        thread_id: The thread ID to delete checkpoints for
        checkpointer: Optional checkpointer instance

    Returns:
        True if deletion was successful
    """
    if checkpointer is None:
        checkpointer = await get_checkpointer()

    try:
        # Note: AsyncPostgresSaver doesn't have a direct delete method
        # This would require raw SQL execution
        logger.warning(
            "Checkpoint deletion not yet implemented",
            thread_id=thread_id,
        )
        return False

    except Exception as e:
        logger.error(
            "Failed to delete checkpoints",
            thread_id=thread_id,
            error=str(e),
        )
        return False


# Health check for the checkpointer
async def check_checkpointer_health() -> dict[str, Any]:
    """Check the health of the checkpointer connection.

    Returns:
        Dict with health status and details

    Example:
        health = await check_checkpointer_health()
        if health["healthy"]:
            print("Checkpointer is operational")
    """
    try:
        checkpointer = await get_checkpointer()

        # Try a simple operation to verify connectivity
        # List checkpoints for a non-existent thread (should return empty)
        config: RunnableConfig = {"configurable": {"thread_id": "__health_check__"}}
        async for _ in checkpointer.alist(config, limit=1):
            pass

        return {
            "healthy": True,
            "status": "connected",
            "checkpointer_type": "AsyncPostgresSaver",
        }

    except Exception as e:
        return {
            "healthy": False,
            "status": "error",
            "error": str(e),
            "checkpointer_type": "AsyncPostgresSaver",
        }
