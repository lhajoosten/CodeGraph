"""LangSmith tracing configuration for agent workflows.

This module configures LangSmith tracing for LangChain/LangGraph operations.
LangSmith provides observability into LLM calls, including:
- Token usage and costs
- Latency metrics
- Full conversation traces
- Error tracking

Environment Variables (set in .env):
    LANGCHAIN_TRACING_V2: Set to 'true' to enable tracing
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
"""

import os

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

_tracing_configured = False


def configure_tracing() -> bool:
    """Configure LangSmith tracing from application settings.

    Sets up environment variables that LangChain reads for tracing.
    Should be called early in application startup (e.g., in main.py).

    Returns:
        True if tracing was enabled, False otherwise
    """
    global _tracing_configured

    if _tracing_configured:
        return is_tracing_enabled()

    # Check if tracing should be enabled
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
