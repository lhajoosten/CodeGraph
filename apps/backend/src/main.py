"""Main FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api import tasks, users
from src.core.config import settings
from src.core.database import close_db
from src.core.logging import configure_logging, get_logger

# Configure logging
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None during application runtime
    """
    # Startup
    logger.info(
        "application_startup",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )

    yield

    # Shutdown
    logger.info("application_shutdown")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI coding agent platform API",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """
    Health check endpoint.

    Returns:
        Dictionary with status message
    """
    return {"status": "healthy", "version": settings.app_version}


# Include routers
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled exceptions.

    Args:
        request: The request that caused the exception
        exc: The exception that was raised

    Returns:
        JSON response with error details
    """
    logger.error(
        "unhandled_exception",
        error=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=exc,
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
