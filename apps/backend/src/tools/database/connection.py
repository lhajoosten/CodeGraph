"""Database connection management for agent tools.

Provides async connection management for multiple database types,
with connection pooling and safe credential handling.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from src.core.logging import get_logger
from src.tools.exceptions import DatabaseToolError

logger = get_logger(__name__)


class DatabaseType(str, Enum):
    """Supported database types."""

    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MSSQL = "mssql"


@dataclass
class DatabaseConnection:
    """Configuration for a database connection.

    Stores connection parameters without exposing credentials in logs.
    """

    database_type: DatabaseType
    host: str
    port: int
    database: str
    username: str
    password: str = field(repr=False)  # Don't show password in repr
    db_schema: str = "public"

    # Connection pool settings
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: float = 30.0

    # Query settings
    query_timeout: float = 30.0
    max_rows: int = 1000

    def get_connection_url(self) -> str:
        """Build async connection URL for SQLAlchemy.

        Returns:
            Async database URL string
        """
        # URL-encode credentials to handle special characters
        encoded_user = quote_plus(self.username)
        encoded_pass = quote_plus(self.password)

        if self.database_type == DatabaseType.POSTGRESQL:
            return (
                f"postgresql+asyncpg://{encoded_user}:{encoded_pass}"
                f"@{self.host}:{self.port}/{self.database}"
            )
        elif self.database_type == DatabaseType.MYSQL:
            return (
                f"mysql+aiomysql://{encoded_user}:{encoded_pass}"
                f"@{self.host}:{self.port}/{self.database}"
            )
        elif self.database_type == DatabaseType.MSSQL:
            return (
                f"mssql+aioodbc://{encoded_user}:{encoded_pass}"
                f"@{self.host}:{self.port}/{self.database}"
                "?driver=ODBC+Driver+17+for+SQL+Server"
            )
        else:
            raise DatabaseToolError(
                f"Unsupported database type: {self.database_type}",
                details={"database_type": self.database_type},
            )

    def get_safe_description(self) -> str:
        """Get a safe description without credentials.

        Returns:
            Description string without password
        """
        return (
            f"{self.database_type.value}://{self.username}@{self.host}:{self.port}/{self.database}"
        )


class DatabaseConnectionManager:
    """Manages database connections with pooling.

    Provides connection pooling and engine management for
    multiple database connections.
    """

    def __init__(self) -> None:
        """Initialize the connection manager."""
        self._engines: dict[str, AsyncEngine] = {}
        self._connections: dict[str, DatabaseConnection] = {}

    def register_connection(
        self,
        name: str,
        connection: DatabaseConnection,
    ) -> None:
        """Register a database connection configuration.

        Args:
            name: Unique name for this connection
            connection: Database connection configuration
        """
        if name in self._connections:
            logger.warning(
                "connection_already_registered",
                name=name,
                existing=self._connections[name].get_safe_description(),
            )

        self._connections[name] = connection
        logger.info(
            "database_connection_registered",
            name=name,
            description=connection.get_safe_description(),
        )

    async def get_engine(self, name: str) -> AsyncEngine:
        """Get or create an async engine for a named connection.

        Args:
            name: Connection name

        Returns:
            Async SQLAlchemy engine

        Raises:
            DatabaseToolError: If connection not found
        """
        if name not in self._connections:
            raise DatabaseToolError(
                f"Database connection not found: {name}",
                details={"available": list(self._connections.keys())},
            )

        if name not in self._engines:
            connection = self._connections[name]
            self._engines[name] = create_async_engine(
                connection.get_connection_url(),
                pool_size=connection.pool_size,
                max_overflow=connection.max_overflow,
                pool_timeout=connection.pool_timeout,
                echo=False,
            )
            logger.info(
                "database_engine_created",
                name=name,
                description=connection.get_safe_description(),
            )

        return self._engines[name]

    def get_connection_config(self, name: str) -> DatabaseConnection:
        """Get connection configuration by name.

        Args:
            name: Connection name

        Returns:
            Database connection configuration

        Raises:
            DatabaseToolError: If connection not found
        """
        if name not in self._connections:
            raise DatabaseToolError(
                f"Database connection not found: {name}",
                details={"available": list(self._connections.keys())},
            )
        return self._connections[name]

    def list_connections(self) -> list[str]:
        """List all registered connection names.

        Returns:
            List of connection names
        """
        return list(self._connections.keys())

    async def test_connection(self, name: str) -> bool:
        """Test if a connection is working.

        Args:
            name: Connection name

        Returns:
            True if connection successful
        """
        try:
            engine = await self.get_engine(name)
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("database_connection_test_passed", name=name)
            return True
        except Exception as e:
            logger.error(
                "database_connection_test_failed",
                name=name,
                error=str(e),
            )
            return False

    async def close_all(self) -> None:
        """Close all database connections."""
        for name, engine in self._engines.items():
            await engine.dispose()
            logger.info("database_engine_closed", name=name)
        self._engines.clear()

    async def execute_raw(
        self,
        name: str,
        query: str,
        params: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Execute a raw SQL query and return results.

        Args:
            name: Connection name
            query: SQL query string
            params: Query parameters

        Returns:
            List of row dictionaries

        Raises:
            DatabaseToolError: If query fails
        """
        connection = self.get_connection_config(name)
        engine = await self.get_engine(name)

        try:
            async with engine.connect() as conn:
                result = await conn.execute(
                    text(query),
                    params or {},
                )

                # Fetch results
                rows = result.fetchmany(connection.max_rows)
                columns = result.keys()

                return [dict(zip(columns, row, strict=False)) for row in rows]

        except Exception as e:
            logger.error(
                "database_query_failed",
                name=name,
                query=query[:200],  # Truncate for logging
                error=str(e),
            )
            raise DatabaseToolError(
                f"Query execution failed: {e}",
                details={"query": query[:500]},
            ) from e


# Global connection manager instance
_connection_manager: DatabaseConnectionManager | None = None


def get_connection_manager() -> DatabaseConnectionManager:
    """Get the global database connection manager.

    Returns:
        Singleton DatabaseConnectionManager instance
    """
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = DatabaseConnectionManager()
    return _connection_manager
