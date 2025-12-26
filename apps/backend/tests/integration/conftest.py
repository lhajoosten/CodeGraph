"""Integration tests configuration with PostgreSQL testcontainer."""

from collections.abc import AsyncGenerator
from urllib.parse import urlparse, urlunparse

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer

from src.core.config import settings
from src.core.database import get_db
from src.main import app
from src.models import Base

# Global container instance
pg_container: PostgresContainer | None = None


def pytest_configure(config: pytest.Config) -> None:
    """Start PostgreSQL container before tests."""
    global pg_container
    pg_container = PostgresContainer("postgres:16-alpine")
    pg_container.start()


def pytest_unconfigure(config: pytest.Config) -> None:
    """Stop PostgreSQL container after tests."""
    global pg_container
    if pg_container:
        pg_container.stop()


def _get_async_db_url() -> str:
    """Get async database URL from container."""
    global pg_container
    if not pg_container:
        raise RuntimeError("PostgreSQL container not started")

    sync_url = pg_container.get_connection_url()
    parsed = urlparse(sync_url)

    # Convert to asyncpg URL
    async_url = urlunparse(
        (
            "postgresql+asyncpg",
            parsed.netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment,
        )
    )
    return async_url


@pytest_asyncio.fixture
async def db_engine():
    """Create and setup test database engine."""
    db_url = _get_async_db_url()
    engine = create_async_engine(db_url, echo=False, future=True)

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a database session for each test."""
    async_session = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create AsyncClient with overridden database dependency."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Disable 2FA mandatory by default for tests
    # Individual tests can override this if needed
    original_two_factor_mandatory = settings.two_factor_mandatory
    settings.two_factor_mandatory = False

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    # Restore original setting
    settings.two_factor_mandatory = original_two_factor_mandatory
    app.dependency_overrides.clear()


@pytest.fixture
def settings_override():
    """Override settings for testing."""

    def override(**kwargs):
        for key, value in kwargs.items():
            if hasattr(settings, key):
                setattr(settings, key, value)

    yield override

    # Reset settings after test
    # Note: This is a simple implementation; in production you might want to restore original values
    pass
