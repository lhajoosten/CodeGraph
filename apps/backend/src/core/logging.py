"""Structured logging configuration using structlog.

Logging Strategy:
    - INFO: Startup events, significant business operations, configuration changes
    - DEBUG: Development-only detailed information for debugging
    - ERROR: Always logged - failures, exceptions, issues that need attention
    - WARNING: Potential issues that don't prevent operation

Usage Guidelines:
    - Use logger.info() for: startup messages, successful operations that matter
    - Use logger.debug() for: detailed flow tracing, variable values, SQL queries
    - Use logger.error() for: caught exceptions, failed operations, invalid states
    - Use logger.warning() for: deprecations, unusual but valid conditions
    - Always include context: logger.info("event_name", user_id=123, action="login")
"""

import logging
import sys
from typing import Any

import structlog

from src.core.config import settings


def configure_logging() -> None:
    """
    Configure structured logging for the application.

    Sets up structlog with appropriate processors for development and production.
    Development: colored console output, DEBUG level by default
    Production: JSON format, INFO level by default
    """
    # Determine effective log level based on environment
    effective_log_level = settings.log_level.upper()

    # Determine if we should use colored output
    use_colors = settings.is_development and sys.stderr.isatty()

    # Determine log format based on environment (unless explicitly set)
    use_json = settings.log_format == "json" or (
        settings.is_production and settings.log_format != "console"
    )

    # Configure processors based on environment
    processors: list[Any] = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if use_json:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=use_colors))

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, effective_log_level),
    )

    # Reduce noise from third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a logger instance.

    Args:
        name: Name for the logger (typically __name__ of the module)

    Returns:
        Configured logger instance

    Example:
        logger = get_logger(__name__)
        logger.info("user_registered", user_id=user.id, email=user.email)
    """
    return structlog.get_logger(name)  # type: ignore[no-any-return]
