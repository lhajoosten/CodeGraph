"""Tests for database tools."""

import pytest

from src.tools.database.connection import (
    DatabaseConnection,
    DatabaseConnectionManager,
    DatabaseType,
)
from src.tools.database.query import (
    _contains_dangerous_patterns,
    _is_read_only_query,
)
from src.tools.exceptions import DatabaseToolError


class TestDatabaseConnection:
    """Tests for DatabaseConnection class."""

    def test_postgresql_connection_url(self) -> None:
        """PostgreSQL connection URL is generated correctly."""
        conn = DatabaseConnection(
            database_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user",
            password="pass",
        )
        url = conn.get_connection_url()
        assert "postgresql+asyncpg://" in url
        assert "localhost:5432" in url
        assert "testdb" in url

    def test_mysql_connection_url(self) -> None:
        """MySQL connection URL is generated correctly."""
        conn = DatabaseConnection(
            database_type=DatabaseType.MYSQL,
            host="localhost",
            port=3306,
            database="testdb",
            username="user",
            password="pass",
        )
        url = conn.get_connection_url()
        assert "mysql+aiomysql://" in url
        assert "localhost:3306" in url

    def test_safe_description_hides_password(self) -> None:
        """Safe description does not expose password."""
        conn = DatabaseConnection(
            database_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user",
            password="supersecret",
        )
        desc = conn.get_safe_description()
        assert "supersecret" not in desc
        assert "user@localhost" in desc

    def test_password_not_in_repr(self) -> None:
        """Password is hidden in repr."""
        conn = DatabaseConnection(
            database_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user",
            password="supersecret",
        )
        repr_str = repr(conn)
        assert "supersecret" not in repr_str

    def test_url_encodes_special_characters(self) -> None:
        """Special characters in credentials are URL encoded."""
        conn = DatabaseConnection(
            database_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user@domain",
            password="p@ss:word/special",
        )
        url = conn.get_connection_url()
        # Special characters should be encoded
        assert "@domain" not in url or "%40domain" in url


class TestDatabaseConnectionManager:
    """Tests for DatabaseConnectionManager class."""

    def test_register_connection(self) -> None:
        """Connection can be registered."""
        manager = DatabaseConnectionManager()
        conn = DatabaseConnection(
            database_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user",
            password="pass",
        )
        manager.register_connection("test", conn)
        assert "test" in manager.list_connections()

    def test_list_connections_empty(self) -> None:
        """Empty manager returns empty list."""
        manager = DatabaseConnectionManager()
        assert manager.list_connections() == []

    def test_get_nonexistent_connection_raises_error(self) -> None:
        """Getting non-existent connection raises error."""
        manager = DatabaseConnectionManager()
        with pytest.raises(DatabaseToolError) as exc_info:
            manager.get_connection_config("nonexistent")
        assert "not found" in str(exc_info.value).lower()


class TestQueryValidation:
    """Tests for query validation functions."""

    def test_select_is_read_only(self) -> None:
        """SELECT queries are identified as read-only."""
        assert _is_read_only_query("SELECT * FROM users") is True
        assert _is_read_only_query("select id from users") is True
        assert _is_read_only_query("  SELECT id FROM users  ") is True

    def test_cte_select_is_read_only(self) -> None:
        """WITH/CTE SELECT queries are identified as read-only."""
        query = "WITH active_users AS (SELECT * FROM users WHERE active = true) SELECT * FROM active_users"
        assert _is_read_only_query(query) is True

    def test_insert_not_read_only(self) -> None:
        """INSERT queries are not read-only."""
        assert _is_read_only_query("INSERT INTO users (name) VALUES ('test')") is False

    def test_update_not_read_only(self) -> None:
        """UPDATE queries are not read-only."""
        assert _is_read_only_query("UPDATE users SET name = 'test'") is False

    def test_delete_not_read_only(self) -> None:
        """DELETE queries are not read-only."""
        assert _is_read_only_query("DELETE FROM users WHERE id = 1") is False

    def test_drop_is_dangerous(self) -> None:
        """DROP statements are detected as dangerous."""
        patterns = _contains_dangerous_patterns("DROP TABLE users")
        assert len(patterns) > 0

    def test_truncate_is_dangerous(self) -> None:
        """TRUNCATE statements are detected as dangerous."""
        patterns = _contains_dangerous_patterns("TRUNCATE TABLE users")
        assert len(patterns) > 0

    def test_delete_without_where_is_dangerous(self) -> None:
        """DELETE without WHERE is detected as dangerous."""
        patterns = _contains_dangerous_patterns("DELETE FROM users")
        assert len(patterns) > 0

    def test_delete_with_where_not_dangerous(self) -> None:
        """DELETE with WHERE is not flagged as dangerous."""
        # Note: this test checks the pattern detection, DELETE is still
        # blocked by read-only check
        patterns = _contains_dangerous_patterns("DELETE FROM users WHERE id = 1")
        # Should not match the "DELETE without WHERE" pattern
        dangerous_delete_count = sum(1 for p in patterns if "DELETE" in p and "WHERE" in p)
        assert dangerous_delete_count == 0

    def test_select_is_not_dangerous(self) -> None:
        """SELECT statements are not flagged as dangerous."""
        patterns = _contains_dangerous_patterns("SELECT * FROM users")
        assert len(patterns) == 0

    def test_sql_injection_attempt_detected(self) -> None:
        """SQL injection attempts are detected."""
        patterns = _contains_dangerous_patterns("SELECT * FROM users; DROP TABLE users")
        assert len(patterns) > 0
