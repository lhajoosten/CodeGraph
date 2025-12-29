"""LangSmith tracing configuration for agent workflows.

This module configures LangSmith tracing for LangChain/LangGraph operations.
LangSmith provides observability into LLM calls, including:
- Token usage and costs
- Latency metrics
- Full conversation traces
- Error tracking

IMPORTANT: Tracing is DISABLED by default to conserve free-tier trace quotas.
Enable only when needed for debugging specific workflow runs.

Environment Variables (set in .env):
    LANGCHAIN_TRACING_V2: Set to 'true' to enable tracing (default: false)
    LANGCHAIN_API_KEY: Your LangSmith API key
    LANGCHAIN_PROJECT: Project name in LangSmith (default: 'codegraph')
    LANGCHAIN_ENDPOINT: LangSmith API endpoint (default: https://api.smith.langchain.com)

Usage:
    from src.agents.infrastructure.tracing import configure_tracing, is_tracing_enabled

    # Call early in application startup
    configure_tracing()

    # Check if tracing is active
    if is_tracing_enabled():
        print("LangSmith tracing is active")

    # Temporarily enable tracing for specific debugging
    with tracing_context(enabled=True):
        result = await workflow.ainvoke(state)
"""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager
from typing import TYPE_CHECKING

from src.core.config import settings
from src.core.logging import get_logger

if TYPE_CHECKING:
    from langchain_core.runnables import RunnableConfig

logger = get_logger(__name__)

_tracing_configured = False
_original_tracing_state: dict[str, str | None] = {}


def configure_tracing() -> bool:
    """Configure LangSmith tracing from application settings.

    Sets up environment variables that LangChain reads for tracing.
    Should be called early in application startup (e.g., in main.py).

    Tracing is DISABLED by default. To enable:
    1. Set LANGCHAIN_TRACING_V2=true in .env
    2. Set LANGCHAIN_API_KEY to your LangSmith API key

    Returns:
        True if tracing was enabled, False otherwise
    """
    global _tracing_configured

    if _tracing_configured:
        return is_tracing_enabled()

    # Check if tracing should be enabled - DISABLED by default
    if not settings.langchain_tracing_v2:
        logger.info("LangSmith tracing is disabled (LANGCHAIN_TRACING_V2=false)")
        _tracing_configured = True
        return False

    if not settings.langchain_api_key:
        logger.warning(
            "LangSmith tracing requested but LANGCHAIN_API_KEY not set. Tracing will be disabled."
        )
        _tracing_configured = True
        return False

    # Set environment variables for LangChain
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint

    logger.info(
        "LangSmith tracing configured",
        project=settings.langchain_project,
        endpoint=settings.langchain_endpoint,
    )

    _tracing_configured = True
    return True


def is_tracing_enabled() -> bool:
    """Check if LangSmith tracing is currently enabled.

    Returns:
        True if tracing is enabled and configured
    """
    return os.environ.get("LANGCHAIN_TRACING_V2", "").lower() == "true" and bool(
        os.environ.get("LANGCHAIN_API_KEY")
    )


def disable_tracing() -> None:
    """Explicitly disable tracing.

    Useful for tests to ensure no traces are sent accidentally.
    """
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    if "LANGCHAIN_API_KEY" in os.environ:
        del os.environ["LANGCHAIN_API_KEY"]


@contextmanager
def tracing_context(enabled: bool = True) -> Generator[None, None, None]:
    """Context manager for temporarily enabling/disabling tracing.

    Use this for debugging specific workflow executions without
    enabling tracing globally.

    Args:
        enabled: Whether to enable tracing in this context

    Yields:
        None

    Example:
        # Debug a specific workflow run
        with tracing_context(enabled=True):
            result = await workflow.ainvoke(state)
    """
    global _original_tracing_state

    # Save current state
    _original_tracing_state = {
        "LANGCHAIN_TRACING_V2": os.environ.get("LANGCHAIN_TRACING_V2"),
        "LANGCHAIN_API_KEY": os.environ.get("LANGCHAIN_API_KEY"),
        "LANGCHAIN_PROJECT": os.environ.get("LANGCHAIN_PROJECT"),
        "LANGCHAIN_ENDPOINT": os.environ.get("LANGCHAIN_ENDPOINT"),
    }

    try:
        if enabled and settings.langchain_api_key:
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
            os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
            os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint
            logger.debug("Tracing temporarily enabled for this context")
        elif not enabled:
            os.environ["LANGCHAIN_TRACING_V2"] = "false"
            logger.debug("Tracing temporarily disabled for this context")

        yield
    finally:
        # Restore original state
        for key, value in _original_tracing_state.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def get_tracing_status() -> dict[str, str | bool]:
    """Get current tracing configuration status.

    Returns:
        Dictionary with tracing configuration details
    """
    return {
        "enabled": is_tracing_enabled(),
        "project": os.environ.get("LANGCHAIN_PROJECT", settings.langchain_project),
        "endpoint": os.environ.get("LANGCHAIN_ENDPOINT", settings.langchain_endpoint),
        "api_key_set": bool(os.environ.get("LANGCHAIN_API_KEY")),
    }


def get_tracing_config(
    run_name: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, str] | None = None,
) -> RunnableConfig | None:
    """Get a RunnableConfig for tracing if tracing is enabled.

    Use this to pass tracing configuration to LangChain/LangGraph operations.

    Args:
        run_name: Optional name for this run in LangSmith
        tags: Optional tags for filtering runs
        metadata: Optional metadata to attach to the run

    Returns:
        RunnableConfig with tracing callbacks if enabled, None otherwise

    Example:
        config = get_tracing_config(
            run_name="task_123_planning",
            tags=["planning", "user_456"],
            metadata={"task_id": "123"}
        )
        if config:
            result = await model.ainvoke(messages, config=config)
    """
    if not is_tracing_enabled():
        return None

    config: RunnableConfig = {}

    if run_name:
        config["run_name"] = run_name

    if tags:
        config["tags"] = tags

    if metadata:
        config["metadata"] = metadata

    return config if config else None
