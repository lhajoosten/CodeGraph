"""Exception handlers for converting exceptions to structured error responses."""

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.core.exceptions import CodeGraphException
from src.core.logging import get_logger
from src.schemas.error import ErrorDetail, ErrorResponse

logger = get_logger(__name__)


async def codegraph_exception_handler(
    request: Request,
    exc: CodeGraphException,
) -> JSONResponse:
    """Handle custom CodeGraph exceptions and convert to standardized error response.

    Args:
        request: The request object
        exc: The exception to handle

    Returns:
        JSONResponse with structured error format
    """
    logger.warning(
        "codegraph_exception",
        error_code=exc.error_code,
        message=exc.message,
        path=request.url.path,
        status_code=exc.status_code,
        details=exc.details,
    )

    error_response = ErrorResponse(
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details if exc.details else None,
    )

    # Build response content with both new format and legacy "detail" field
    response_data = error_response.model_dump(exclude_none=True)
    response_data["detail"] = exc.message  # Add legacy "detail" field for backward compatibility

    response = JSONResponse(
        status_code=exc.status_code,
        content=response_data,
    )

    # Add special headers for OAuth reauthentication errors
    if exc.error_code == "OAUTH_REAUTHENTICATION_REQUIRED":
        response.headers["X-Auth-Method"] = "oauth"

    return response


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Handle Pydantic validation errors and convert to standardized format.

    Args:
        request: The request object
        exc: The validation error

    Returns:
        JSONResponse with structured validation error format
    """
    logger.warning(
        "validation_error",
        path=request.url.path,
        error_count=len(exc.errors()),
    )

    # Convert Pydantic errors to our format
    validation_errors = [
        ErrorDetail(
            loc=[str(loc) for loc in error["loc"]],
            msg=error["msg"],
            type=error["type"],
        )
        for error in exc.errors()
    ]

    error_response = ErrorResponse(
        error_code="VALIDATION_ERROR",
        message="Validation failed. Please check your input.",
        validation_errors=validation_errors,
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(exclude_none=True),
    )
