"""Error response schemas for API responses."""

from typing import Any

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Individual validation error detail."""

    loc: list[str]  # Location of error (field path)
    msg: str  # Error message
    type: str  # Error type


class ErrorResponse(BaseModel):
    """Standardized error response format."""

    error_code: str  # Machine-readable code (e.g., "INVALID_CREDENTIALS")
    message: str  # Human-readable message
    details: dict[str, Any] | None = None  # Additional context
    validation_errors: list[ErrorDetail] | None = None  # Pydantic validation errors
