"""Structured logging configuration using structlog."""

import logging
import sys
from typing import Any

import structlog

from src.core.config import settings


def configure_logging() -> None:
    """
    Configure structured logging for the application.

    Sets up structlog with appropriate processors for development and production.
    In development, uses colored console output. In production, uses JSON format.
    """
    # Determine if we should use colored output
    use_colors = settings.is_development and sys.stderr.isatty()

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

    if settings.log_format == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        if use_colors:
            processors.append(structlog.dev.ConsoleRenderer(colors=True))
        else:
            processors.append(structlog.dev.ConsoleRenderer(colors=False))

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
        level=getattr(logging, settings.log_level.upper()),
    )


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
