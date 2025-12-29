"""Database introspection tools for agents.

Provides tools for discovering database schema information
including tables, columns, and relationships.
"""

from typing import Any

from langchain_core.tools import tool
from sqlalchemy import text

from src.core.logging import get_logger
from src.tools.database.connection import DatabaseType, get_connection_manager
from src.tools.exceptions import DatabaseToolError

logger = get_logger(__name__)


# PostgreSQL introspection queries
POSTGRES_LIST_TABLES = """
SELECT
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND table_schema = COALESCE(:schema, table_schema)
ORDER BY table_schema, table_name
"""

POSTGRES_TABLE_COLUMNS = """
SELECT
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = :schema
    AND table_name = :table_name
ORDER BY ordinal_position
"""

POSTGRES_TABLE_CONSTRAINTS = """
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = :schema
    AND tc.table_name = :table_name
ORDER BY tc.constraint_type, tc.constraint_name
"""

POSTGRES_FOREIGN_KEYS = """
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = :schema
    AND tc.table_name = :table_name
"""


def _get_introspection_query(
    database_type: DatabaseType,
    query_type: str,
) -> str:
    """Get the appropriate introspection query for the database type.

    Args:
        database_type: Type of database
        query_type: Type of query (list_tables, columns, etc.)

    Returns:
        SQL query string

    Raises:
        DatabaseToolError: If query type not supported
    """
    queries = {
        DatabaseType.POSTGRESQL: {
            "list_tables": POSTGRES_LIST_TABLES,
            "columns": POSTGRES_TABLE_COLUMNS,
            "constraints": POSTGRES_TABLE_CONSTRAINTS,
            "foreign_keys": POSTGRES_FOREIGN_KEYS,
        },
        # MySQL and MSSQL queries can be added here
    }

    if database_type not in queries:
        raise DatabaseToolError(
            f"Introspection not supported for {database_type}",
            details={"database_type": database_type.value},
        )

    if query_type not in queries[database_type]:
        raise DatabaseToolError(
            f"Query type '{query_type}' not supported for {database_type}",
            details={"database_type": database_type.value, "query_type": query_type},
        )

    return queries[database_type][query_type]


@tool
async def list_tables(
    connection_name: str,
    db_schema: str = "public",
) -> str:
    """List all tables in a database schema.

    Args:
        connection_name: Name of the registered database connection.
        db_schema: Database schema to list tables from. Defaults to "public".

    Returns:
        Formatted list of tables with their types.

    Raises:
        DatabaseToolError: If connection not found or query fails
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)

    logger.info(
        "list_tables_started",
        connection=connection_name,
        db_schema=db_schema,
    )

    try:
        query = _get_introspection_query(config.database_type, "list_tables")
        engine = await manager.get_engine(connection_name)

        async with engine.connect() as conn:
            result = await conn.execute(
                text(query),
                {"schema": db_schema},
            )
            rows = result.fetchall()

        if not rows:
            return f"No tables found in schema '{db_schema}'"

        # Format output
        lines = [f"Tables in schema '{db_schema}':"]
        lines.append("")

        for row in rows:
            table_schema, table_name, table_type = row
            type_indicator = "VIEW" if "VIEW" in table_type.upper() else "TABLE"
            lines.append(f"  {table_schema}.{table_name} ({type_indicator})")

        lines.append("")
        lines.append(f"Total: {len(rows)} table(s)")

        logger.info(
            "list_tables_completed",
            connection=connection_name,
            db_schema=db_schema,
            count=len(rows),
        )

        return "\n".join(lines)

    except DatabaseToolError:
        raise
    except Exception as e:
        logger.error(
            "list_tables_failed",
            connection=connection_name,
            db_schema=db_schema,
            error=str(e),
        )
        raise DatabaseToolError(
            f"Failed to list tables: {e}",
            details={"connection": connection_name, "db_schema": db_schema},
        ) from e


@tool
async def get_table_columns(
    connection_name: str,
    table_name: str,
    db_schema: str = "public",
) -> str:
    """Get column information for a database table.

    Args:
        connection_name: Name of the registered database connection.
        table_name: Name of the table to inspect.
        db_schema: Database schema. Defaults to "public".

    Returns:
        Formatted table showing column details including name, type,
        nullability, and default values.

    Raises:
        DatabaseToolError: If connection not found or query fails
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)

    logger.info(
        "get_table_columns_started",
        connection=connection_name,
        table=table_name,
        db_schema=db_schema,
    )

    try:
        query = _get_introspection_query(config.database_type, "columns")
        engine = await manager.get_engine(connection_name)

        async with engine.connect() as conn:
            result = await conn.execute(
                text(query),
                {"schema": db_schema, "table_name": table_name},
            )
            rows = result.fetchall()

        if not rows:
            return f"Table '{db_schema}.{table_name}' not found or has no columns"

        # Format output
        lines = [f"Columns in '{db_schema}.{table_name}':"]
        lines.append("")
        lines.append(f"{'Column':<30} {'Type':<20} {'Nullable':<10} {'Default':<30}")
        lines.append("-" * 90)

        for row in rows:
            col_name = row[0]
            data_type = row[1]
            char_len = row[2]
            num_precision = row[3]
            num_scale = row[4]
            nullable = "YES" if row[5] == "YES" else "NO"
            default = str(row[6])[:28] if row[6] else ""

            # Build type string with precision
            type_str = data_type
            if char_len:
                type_str = f"{data_type}({char_len})"
            elif num_precision:
                if num_scale:
                    type_str = f"{data_type}({num_precision},{num_scale})"
                else:
                    type_str = f"{data_type}({num_precision})"

            lines.append(f"{col_name:<30} {type_str:<20} {nullable:<10} {default:<30}")

        lines.append("")
        lines.append(f"Total: {len(rows)} column(s)")

        logger.info(
            "get_table_columns_completed",
            connection=connection_name,
            table=table_name,
            column_count=len(rows),
        )

        return "\n".join(lines)

    except DatabaseToolError:
        raise
    except Exception as e:
        logger.error(
            "get_table_columns_failed",
            connection=connection_name,
            table=table_name,
            error=str(e),
        )
        raise DatabaseToolError(
            f"Failed to get table columns: {e}",
            details={"connection": connection_name, "table": table_name},
        ) from e


@tool
async def get_table_relationships(
    connection_name: str,
    table_name: str,
    db_schema: str = "public",
) -> str:
    """Get foreign key relationships for a database table.

    Args:
        connection_name: Name of the registered database connection.
        table_name: Name of the table to inspect.
        db_schema: Database schema. Defaults to "public".

    Returns:
        Formatted list of foreign key relationships showing
        which columns reference other tables.

    Raises:
        DatabaseToolError: If connection not found or query fails
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)

    logger.info(
        "get_table_relationships_started",
        connection=connection_name,
        table=table_name,
        db_schema=db_schema,
    )

    try:
        query = _get_introspection_query(config.database_type, "foreign_keys")
        engine = await manager.get_engine(connection_name)

        async with engine.connect() as conn:
            result = await conn.execute(
                text(query),
                {"schema": db_schema, "table_name": table_name},
            )
            rows = result.fetchall()

        if not rows:
            return f"No foreign key relationships found for '{db_schema}.{table_name}'"

        # Format output
        lines = [f"Foreign key relationships for '{db_schema}.{table_name}':"]
        lines.append("")

        for row in rows:
            constraint_name, column, fk_schema, fk_table, fk_column = row
            lines.append(f"  {column} -> {fk_schema}.{fk_table}.{fk_column}")
            lines.append(f"    (constraint: {constraint_name})")
            lines.append("")

        lines.append(f"Total: {len(rows)} relationship(s)")

        logger.info(
            "get_table_relationships_completed",
            connection=connection_name,
            table=table_name,
            relationship_count=len(rows),
        )

        return "\n".join(lines)

    except DatabaseToolError:
        raise
    except Exception as e:
        logger.error(
            "get_table_relationships_failed",
            connection=connection_name,
            table=table_name,
            error=str(e),
        )
        raise DatabaseToolError(
            f"Failed to get table relationships: {e}",
            details={"connection": connection_name, "table": table_name},
        ) from e


async def get_full_table_schema(
    connection_name: str,
    table_name: str,
    db_schema: str = "public",
) -> dict[str, Any]:
    """Get complete schema information for a table.

    This is a helper function (not a tool) that combines
    columns and relationships into a single result.

    Args:
        connection_name: Name of the registered database connection
        table_name: Name of the table
        db_schema: Database schema

    Returns:
        Dictionary with table schema information
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)
    engine = await manager.get_engine(connection_name)

    async with engine.connect() as conn:
        # Get columns
        columns_query = _get_introspection_query(config.database_type, "columns")
        columns_result = await conn.execute(
            text(columns_query),
            {"schema": db_schema, "table_name": table_name},
        )
        columns = [
            {
                "name": row[0],
                "type": row[1],
                "max_length": row[2],
                "precision": row[3],
                "scale": row[4],
                "nullable": row[5] == "YES",
                "default": row[6],
            }
            for row in columns_result.fetchall()
        ]

        # Get constraints
        constraints_query = _get_introspection_query(config.database_type, "constraints")
        constraints_result = await conn.execute(
            text(constraints_query),
            {"schema": db_schema, "table_name": table_name},
        )

        primary_key: list[str] = []
        foreign_keys: list[dict[str, str]] = []

        for row in constraints_result.fetchall():
            constraint_name, constraint_type, column, fk_schema, fk_table, fk_column = row

            if constraint_type == "PRIMARY KEY":
                primary_key.append(column)
            elif constraint_type == "FOREIGN KEY":
                foreign_keys.append(
                    {
                        "column": column,
                        "references_schema": fk_schema,
                        "references_table": fk_table,
                        "references_column": fk_column,
                    }
                )

    return {
        "db_schema": db_schema,
        "table_name": table_name,
        "columns": columns,
        "primary_key": primary_key,
        "foreign_keys": foreign_keys,
    }
