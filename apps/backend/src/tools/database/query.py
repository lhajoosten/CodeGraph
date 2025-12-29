"""Database query execution tools for agents.

Provides safe query execution with validation, parameter binding,
and result formatting. Includes safeguards against destructive operations.
"""

import re
from collections.abc import Sequence
from typing import Any

from langchain_core.tools import tool
from sqlalchemy import text

from src.core.logging import get_logger
from src.tools.database.connection import DatabaseType, get_connection_manager
from src.tools.exceptions import DatabaseToolError

logger = get_logger(__name__)

# Patterns for detecting potentially dangerous operations
DANGEROUS_PATTERNS = [
    r"\bDROP\s+(?:TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b",
    r"\bTRUNCATE\s+TABLE\b",
    r"\bDELETE\s+FROM\b(?!\s+.*\bWHERE\b)",  # DELETE without WHERE
    r"\bALTER\s+(?:TABLE|DATABASE)\b",
    r"\bCREATE\s+(?:TABLE|DATABASE|SCHEMA)\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r";\s*(?:DROP|DELETE|TRUNCATE|ALTER|CREATE)",  # SQL injection attempts
]

# Patterns that indicate a SELECT query
SELECT_PATTERNS = [
    r"^\s*SELECT\b",
    r"^\s*WITH\b.*\bSELECT\b",  # CTEs
]


def _is_read_only_query(query: str) -> bool:
    """Check if a query is read-only (SELECT).

    Args:
        query: SQL query string

    Returns:
        True if query appears to be read-only
    """
    query_upper = query.upper().strip()
    return any(
        re.match(pattern, query_upper, re.IGNORECASE | re.DOTALL) for pattern in SELECT_PATTERNS
    )


def _contains_dangerous_patterns(query: str) -> list[str]:
    """Check if query contains potentially dangerous patterns.

    Args:
        query: SQL query string

    Returns:
        List of matched dangerous patterns
    """
    query_upper = query.upper()
    matches = []

    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, query_upper, re.IGNORECASE):
            matches.append(pattern)

    return matches


def _format_query_results(
    rows: Sequence[Any],
    columns: list[str],
    max_column_width: int = 50,
) -> str:
    """Format query results as a readable table.

    Args:
        rows: List of result rows
        columns: Column names
        max_column_width: Maximum width for any column

    Returns:
        Formatted table string
    """
    if not rows:
        return "Query returned no results."

    # Calculate column widths
    col_widths = []
    for i, col in enumerate(columns):
        max_width = len(col)
        for row in rows[:100]:  # Sample first 100 rows for width calculation
            val_str = str(row[i]) if row[i] is not None else "NULL"
            max_width = max(max_width, min(len(val_str), max_column_width))
        col_widths.append(max_width)

    # Build header
    header = " | ".join(col.ljust(col_widths[i]) for i, col in enumerate(columns))
    separator = "-+-".join("-" * w for w in col_widths)

    # Build rows
    lines = [header, separator]

    for row in rows:
        row_values = []
        for i, val in enumerate(row):
            if val is None:
                val_str = "NULL"
            else:
                val_str = str(val)
                if len(val_str) > max_column_width:
                    val_str = val_str[: max_column_width - 3] + "..."
            row_values.append(val_str.ljust(col_widths[i]))
        lines.append(" | ".join(row_values))

    return "\n".join(lines)


@tool
async def execute_query(
    connection_name: str,
    query: str,
    params: dict[str, Any] | None = None,
) -> str:
    """Execute a SELECT query and return formatted results.

    This tool only allows read-only SELECT queries for safety.
    For data modifications, use specialized mutation tools.

    Args:
        connection_name: Name of the registered database connection.
        query: SQL SELECT query to execute. Must be a SELECT statement.
        params: Optional dictionary of query parameters for safe binding.
               Use :param_name in query and {"param_name": value} in params.

    Returns:
        Formatted table of query results with column headers.

    Raises:
        DatabaseToolError: If query is not a SELECT or execution fails

    Example:
        execute_query(
            "main_db",
            "SELECT * FROM users WHERE status = :status LIMIT 10",
            {"status": "active"}
        )
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)

    logger.info(
        "execute_query_started",
        connection=connection_name,
        query_preview=query[:100],
    )

    # Validate query is read-only
    if not _is_read_only_query(query):
        raise DatabaseToolError(
            "Only SELECT queries are allowed. Use mutation tools for modifications.",
            details={"query_preview": query[:200]},
        )

    # Check for dangerous patterns (extra safety)
    dangerous = _contains_dangerous_patterns(query)
    if dangerous:
        raise DatabaseToolError(
            "Query contains potentially dangerous patterns",
            details={"patterns": dangerous, "query_preview": query[:200]},
        )

    try:
        engine = await manager.get_engine(connection_name)

        async with engine.connect() as conn:
            result = await conn.execute(
                text(query),
                params or {},
            )

            columns = list(result.keys())
            rows = result.fetchmany(config.max_rows)

            # Check if more rows available
            has_more = len(rows) >= config.max_rows

        # Format results
        output_lines = [_format_query_results(rows, columns)]

        output_lines.append("")
        output_lines.append(f"Rows returned: {len(rows)}")
        if has_more:
            output_lines.append(f"(Results truncated to {config.max_rows} rows)")

        logger.info(
            "execute_query_completed",
            connection=connection_name,
            row_count=len(rows),
            truncated=has_more,
        )

        return "\n".join(output_lines)

    except DatabaseToolError:
        raise
    except Exception as e:
        logger.error(
            "execute_query_failed",
            connection=connection_name,
            query_preview=query[:100],
            error=str(e),
        )
        raise DatabaseToolError(
            f"Query execution failed: {e}",
            details={"query_preview": query[:200]},
        ) from e


@tool
async def explain_query(
    connection_name: str,
    query: str,
) -> str:
    """Get the execution plan for a query.

    Useful for understanding query performance and optimization.

    Args:
        connection_name: Name of the registered database connection.
        query: SQL query to analyze (typically a SELECT).

    Returns:
        Query execution plan showing how the database will execute the query.

    Raises:
        DatabaseToolError: If connection not found or analysis fails
    """
    manager = get_connection_manager()
    config = manager.get_connection_config(connection_name)

    logger.info(
        "explain_query_started",
        connection=connection_name,
        query_preview=query[:100],
    )

    # Build EXPLAIN query based on database type
    if config.database_type == DatabaseType.POSTGRESQL:
        explain_query_str = f"EXPLAIN (ANALYZE false, COSTS true, FORMAT text) {query}"
    elif config.database_type == DatabaseType.MYSQL:
        explain_query_str = f"EXPLAIN {query}"
    elif config.database_type == DatabaseType.MSSQL:
        # MSSQL uses SET SHOWPLAN_TEXT ON, but we'll use simpler approach
        explain_query_str = f"SET SHOWPLAN_ALL ON; {query}"
    else:
        raise DatabaseToolError(
            f"EXPLAIN not supported for {config.database_type}",
            details={"database_type": config.database_type.value},
        )

    try:
        engine = await manager.get_engine(connection_name)

        async with engine.connect() as conn:
            result = await conn.execute(text(explain_query_str))
            rows = result.fetchall()

        # Format execution plan
        lines = ["Query Execution Plan:", "=" * 60, ""]

        for row in rows:
            # EXPLAIN typically returns a single column with plan text
            plan_line = str(row[0]) if row else ""
            lines.append(plan_line)

        lines.append("")
        lines.append("=" * 60)

        logger.info(
            "explain_query_completed",
            connection=connection_name,
        )

        return "\n".join(lines)

    except DatabaseToolError:
        raise
    except Exception as e:
        logger.error(
            "explain_query_failed",
            connection=connection_name,
            query_preview=query[:100],
            error=str(e),
        )
        raise DatabaseToolError(
            f"Failed to explain query: {e}",
            details={"query_preview": query[:200]},
        ) from e


async def execute_mutation(
    connection_name: str,
    query: str,
    params: dict[str, Any] | None = None,
    dry_run: bool = True,
) -> dict[str, Any]:
    """Execute a data modification query (INSERT, UPDATE, DELETE).

    This is a helper function (not a tool) for controlled mutations.
    Should only be used by authorized agents with proper permissions.

    Args:
        connection_name: Name of the registered database connection
        query: SQL mutation query
        params: Query parameters
        dry_run: If True, wraps in transaction and rolls back

    Returns:
        Dictionary with affected row count and status
    """
    manager = get_connection_manager()
    engine = await manager.get_engine(connection_name)

    logger.info(
        "execute_mutation_started",
        connection=connection_name,
        query_preview=query[:100],
        dry_run=dry_run,
    )

    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text(query),
                params or {},
            )

            affected_rows = result.rowcount

            if dry_run:
                # Rollback the transaction for dry run
                await conn.rollback()
                logger.info(
                    "execute_mutation_dry_run",
                    connection=connection_name,
                    affected_rows=affected_rows,
                )
                return {
                    "status": "dry_run",
                    "affected_rows": affected_rows,
                    "committed": False,
                }

            # Transaction commits automatically with begin()
            logger.info(
                "execute_mutation_committed",
                connection=connection_name,
                affected_rows=affected_rows,
            )
            return {
                "status": "success",
                "affected_rows": affected_rows,
                "committed": True,
            }

    except Exception as e:
        logger.error(
            "execute_mutation_failed",
            connection=connection_name,
            query_preview=query[:100],
            error=str(e),
        )
        raise DatabaseToolError(
            f"Mutation failed: {e}",
            details={"query_preview": query[:200]},
        ) from e
