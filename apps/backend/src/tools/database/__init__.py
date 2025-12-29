"""Database tools for agents.

This module provides tools for database introspection and query execution.
Supports PostgreSQL (primary), with extensibility for MS SQL and MySQL.
"""

from src.tools.database.connection import (
    DatabaseConnection,
    DatabaseConnectionManager,
    get_connection_manager,
)
from src.tools.database.introspection import (
    get_table_columns,
    get_table_relationships,
    list_tables,
)
from src.tools.database.query import (
    execute_query,
    explain_query,
)

__all__ = [
    # Connection management
    "DatabaseConnection",
    "DatabaseConnectionManager",
    "get_connection_manager",
    # Introspection tools
    "list_tables",
    "get_table_columns",
    "get_table_relationships",
    # Query tools
    "execute_query",
    "explain_query",
]
