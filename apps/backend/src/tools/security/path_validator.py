"""Path validation utilities for preventing traversal attacks.

This module ensures all file paths stay within the designated workspace,
preventing malicious path traversal attacks (e.g., ../../etc/passwd).
"""

import os
from pathlib import Path

from src.core.logging import get_logger
from src.tools.exceptions import PathValidationError

logger = get_logger(__name__)

# Patterns that indicate potential path traversal
DANGEROUS_PATTERNS = [
    "..",
    "~",
    "$",
    "%",
    "\\",
]

# Files/directories that should never be accessed
BLOCKED_PATHS = [
    ".git/config",
    ".git/credentials",
    ".env",
    ".env.local",
    ".env.production",
    "secrets",
    "credentials",
    ".ssh",
    ".aws",
    ".kube",
    "id_rsa",
    "id_ed25519",
]


def normalize_path(path: str) -> str:
    """Normalize a path by resolving . and .. components.

    This function normalizes paths without resolving symlinks,
    making it safe for validation before file access.

    Args:
        path: The path to normalize

    Returns:
        Normalized path string
    """
    # Handle empty path
    if not path:
        return "."

    # Use os.path.normpath to handle . and .. safely
    normalized = os.path.normpath(path)

    # Remove any leading slashes to keep it relative
    normalized = normalized.lstrip("/")

    # Handle empty result
    if not normalized:
        return "."

    return normalized


def is_safe_path(path: str, workspace: str) -> bool:
    """Check if a path is safe (within workspace, no traversal).

    Args:
        path: The path to check (relative or absolute)
        workspace: The workspace root directory

    Returns:
        True if the path is safe, False otherwise
    """
    try:
        # Normalize both paths
        workspace_path = Path(workspace).resolve()
        normalized = normalize_path(path)

        # Construct full path
        if Path(path).is_absolute():
            full_path = Path(path).resolve()
        else:
            full_path = (workspace_path / normalized).resolve()

        # Check if path is within workspace
        try:
            full_path.relative_to(workspace_path)
        except ValueError:
            # Path is outside workspace
            return False

        # Check for dangerous patterns in the original path
        for pattern in DANGEROUS_PATTERNS:
            if pattern in path and pattern != ".":
                # Allow single dots but block double dots
                if pattern == ".." and ".." in path:
                    return False

        # Check against blocked paths
        path_lower = path.lower()
        for blocked in BLOCKED_PATHS:
            if blocked.lower() in path_lower:
                return False

        return True

    except (OSError, ValueError):
        return False


def validate_path(
    path: str,
    workspace: str,
    must_exist: bool = False,
    allow_directory: bool = True,
) -> Path:
    """Validate a path and return the resolved absolute path.

    This function performs comprehensive path validation including:
    - Checking for path traversal attempts
    - Verifying the path is within the workspace
    - Optionally checking if the path exists
    - Checking against blocked paths

    Args:
        path: The path to validate (relative to workspace)
        workspace: The workspace root directory
        must_exist: If True, raise error if path doesn't exist
        allow_directory: If False, raise error if path is a directory

    Returns:
        Resolved absolute Path object

    Raises:
        PathValidationError: If path validation fails
    """
    logger.debug(
        "validating_path",
        path=path,
        workspace=workspace,
        must_exist=must_exist,
    )

    # Handle empty path
    if not path:
        raise PathValidationError(
            "Empty path provided",
            path=path,
            workspace=workspace,
        )

    # Normalize the path
    normalized = normalize_path(path)

    # Check for dangerous patterns first
    for pattern in DANGEROUS_PATTERNS:
        if pattern in path:
            if pattern == ".." or pattern == "~":
                raise PathValidationError(
                    f"Path traversal detected: '{pattern}' in path",
                    path=path,
                    workspace=workspace,
                )

    # Resolve workspace
    try:
        workspace_path = Path(workspace).resolve()
    except (OSError, ValueError) as e:
        raise PathValidationError(
            f"Invalid workspace path: {e}",
            path=path,
            workspace=workspace,
        ) from e

    # Check if workspace exists
    if not workspace_path.exists():
        raise PathValidationError(
            f"Workspace does not exist: {workspace}",
            path=path,
            workspace=workspace,
        )

    # Construct and resolve the full path
    try:
        if Path(path).is_absolute():
            full_path = Path(path).resolve()
        else:
            full_path = (workspace_path / normalized).resolve()
    except (OSError, ValueError) as e:
        raise PathValidationError(
            f"Invalid path: {e}",
            path=path,
            workspace=workspace,
        ) from e

    # Verify path is within workspace
    try:
        full_path.relative_to(workspace_path)
    except ValueError:
        raise PathValidationError(
            "Path is outside of workspace",
            path=path,
            workspace=workspace,
        ) from None

    # Check against blocked paths
    relative_path = str(full_path.relative_to(workspace_path)).lower()

    for blocked in BLOCKED_PATHS:
        if blocked.lower() in relative_path:
            raise PathValidationError(
                f"Access to '{blocked}' is not allowed",
                path=path,
                workspace=workspace,
            )

    # Check if path exists (if required)
    if must_exist and not full_path.exists():
        raise PathValidationError(
            f"Path does not exist: {path}",
            path=path,
            workspace=workspace,
        )

    # Check if path is a directory (if not allowed)
    if not allow_directory and full_path.is_dir():
        raise PathValidationError(
            f"Path is a directory, expected a file: {path}",
            path=path,
            workspace=workspace,
        )

    logger.debug(
        "path_validated",
        original_path=path,
        resolved_path=str(full_path),
    )

    return full_path


def get_relative_path(absolute_path: Path, workspace: str) -> str:
    """Get the relative path from an absolute path within workspace.

    Args:
        absolute_path: The absolute path
        workspace: The workspace root directory

    Returns:
        Relative path string

    Raises:
        PathValidationError: If path is outside workspace
    """
    workspace_path = Path(workspace).resolve()

    try:
        return str(absolute_path.relative_to(workspace_path))
    except ValueError:
        raise PathValidationError(
            "Path is outside of workspace",
            path=str(absolute_path),
            workspace=workspace,
        ) from None
