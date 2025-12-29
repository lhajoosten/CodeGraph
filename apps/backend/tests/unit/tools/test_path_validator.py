"""Tests for path validation utilities."""

import tempfile
from pathlib import Path

import pytest

from src.tools.exceptions import PathValidationError
from src.tools.security.path_validator import (
    is_safe_path,
    normalize_path,
    validate_path,
)


class TestNormalizePath:
    """Tests for normalize_path function."""

    def test_empty_path_returns_dot(self) -> None:
        """Empty path should return current directory."""
        assert normalize_path("") == "."

    def test_single_dot_returns_dot(self) -> None:
        """Single dot returns dot."""
        assert normalize_path(".") == "."

    def test_removes_leading_slashes(self) -> None:
        """Leading slashes are removed to keep path relative."""
        assert normalize_path("/foo/bar") == "foo/bar"
        assert normalize_path("///foo/bar") == "foo/bar"

    def test_resolves_double_dots(self) -> None:
        """Double dots are resolved."""
        assert normalize_path("foo/../bar") == "bar"
        assert normalize_path("./foo/./bar") == "foo/bar"

    def test_simple_path_unchanged(self) -> None:
        """Simple relative paths are unchanged."""
        assert normalize_path("src/main.py") == "src/main.py"
        assert normalize_path("README.md") == "README.md"


class TestIsSafePath:
    """Tests for is_safe_path function."""

    def test_safe_path_within_workspace(self) -> None:
        """Path within workspace is safe."""
        with tempfile.TemporaryDirectory() as workspace:
            assert is_safe_path("src/main.py", workspace) is True
            assert is_safe_path("README.md", workspace) is True
            assert is_safe_path(".", workspace) is True

    def test_path_traversal_not_safe(self) -> None:
        """Path traversal attempts are not safe."""
        with tempfile.TemporaryDirectory() as workspace:
            assert is_safe_path("../etc/passwd", workspace) is False
            assert is_safe_path("../../root", workspace) is False
            assert is_safe_path("foo/../../bar", workspace) is False

    def test_blocked_paths_not_safe(self) -> None:
        """Blocked paths are not safe."""
        with tempfile.TemporaryDirectory() as workspace:
            assert is_safe_path(".env", workspace) is False
            assert is_safe_path(".git/config", workspace) is False
            assert is_safe_path("secrets/api_key", workspace) is False

    def test_tilde_not_safe(self) -> None:
        """Tilde expansion is blocked."""
        with tempfile.TemporaryDirectory() as workspace:
            assert is_safe_path("~/.ssh/id_rsa", workspace) is False


class TestValidatePath:
    """Tests for validate_path function."""

    def test_valid_path_returns_resolved_path(self) -> None:
        """Valid path returns resolved absolute path."""
        with tempfile.TemporaryDirectory() as workspace:
            # Create a file to test with
            test_file = Path(workspace) / "test.txt"
            test_file.write_text("hello")

            result = validate_path("test.txt", workspace, must_exist=True)
            assert result.is_absolute()
            assert result.exists()
            assert result.name == "test.txt"

    def test_empty_path_raises_error(self) -> None:
        """Empty path raises PathValidationError."""
        with tempfile.TemporaryDirectory() as workspace:
            with pytest.raises(PathValidationError) as exc_info:
                validate_path("", workspace)
            assert "Empty path" in str(exc_info.value)

    def test_path_traversal_raises_error(self) -> None:
        """Path traversal raises PathValidationError."""
        with tempfile.TemporaryDirectory() as workspace:
            with pytest.raises(PathValidationError) as exc_info:
                validate_path("../etc/passwd", workspace)
            assert "traversal" in str(exc_info.value).lower()

    def test_nonexistent_path_with_must_exist_raises_error(self) -> None:
        """Non-existent path with must_exist=True raises error."""
        with tempfile.TemporaryDirectory() as workspace:
            with pytest.raises(PathValidationError) as exc_info:
                validate_path("does_not_exist.txt", workspace, must_exist=True)
            assert "does not exist" in str(exc_info.value)

    def test_nonexistent_path_without_must_exist_succeeds(self) -> None:
        """Non-existent path with must_exist=False succeeds."""
        with tempfile.TemporaryDirectory() as workspace:
            result = validate_path("new_file.txt", workspace, must_exist=False)
            assert result.is_absolute()
            assert not result.exists()

    def test_directory_when_not_allowed_raises_error(self) -> None:
        """Directory path with allow_directory=False raises error."""
        with tempfile.TemporaryDirectory() as workspace:
            subdir = Path(workspace) / "subdir"
            subdir.mkdir()

            with pytest.raises(PathValidationError) as exc_info:
                validate_path("subdir", workspace, must_exist=True, allow_directory=False)
            assert "directory" in str(exc_info.value).lower()

    def test_blocked_path_raises_error(self) -> None:
        """Blocked path raises PathValidationError."""
        with tempfile.TemporaryDirectory() as workspace:
            with pytest.raises(PathValidationError) as exc_info:
                validate_path(".env", workspace)
            assert "not allowed" in str(exc_info.value)

    def test_workspace_not_found_raises_error(self) -> None:
        """Non-existent workspace raises PathValidationError."""
        with pytest.raises(PathValidationError) as exc_info:
            validate_path("test.txt", "/nonexistent/workspace")
        assert "does not exist" in str(exc_info.value)
