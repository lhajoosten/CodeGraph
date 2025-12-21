"""Integration tests configuration with PostgreSQL testcontainer."""

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer

from src.core.database import Base, get_db
from src.main import app

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


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each integration test."""
    global pg_container

    if not pg_container:
        raise RuntimeError("PostgreSQL container not started")

    # Build asyncpg connection string from container
    # testcontainers returns postgresql://user:password@host:port/dbname
    # We need to explicitly use asyncpg driver
    from urllib.parse import urlparse, urlunparse

    sync_url = pg_container.get_connection_url()
    parsed = urlparse(sync_url)

    # Rebuild URL with asyncpg scheme
    async_db_url = urlunparse(
        (
            "postgresql+asyncpg",  # scheme
            parsed.netloc,  # network location (user:password@host:port)
            parsed.path,  # path (database name)
            parsed.params,
            parsed.query,
            parsed.fragment,
        )
    )

    try:
        # Create engine with asyncpg
        test_engine = create_async_engine(
            async_db_url,
            echo=False,
            future=True,
        )
    except Exception as e:
        raise RuntimeError(f"Failed to create async engine with {async_db_url}: {e}") from e

    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session factory
    TestSessionLocal = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    session = TestSessionLocal()
    try:
        yield session
    finally:
        await session.close()

    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.fixture
def client(db_session: AsyncSession) -> TestClient:
    """Create test client with overridden database dependency."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client

    app.dependency_overrides.clear()
