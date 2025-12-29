"""Directory operation tools for agents.

Provides tools for listing and creating directories
within the workspace context.
"""

from datetime import datetime
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import ToolPermission, get_current_context
from src.tools.exceptions import (
    PermissionDeniedError,
    ToolExecutionError,
)
from src.tools.schemas import FileInfo
from src.tools.security.path_validator import validate_path

logger = get_logger(__name__)


def _get_file_info(path: Path, workspace: Path) -> FileInfo:
    """Get FileInfo for a path.

    Args:
        path: Absolute path to file/directory
        workspace: Workspace root path

    Returns:
        FileInfo object
    """
    try:
        stat = path.stat()
        return FileInfo(
            name=path.name,
            path=str(path.relative_to(workspace)),
            is_dir=path.is_dir(),
            size=stat.st_size if path.is_file() else 0,
            modified=datetime.fromtimestamp(stat.st_mtime),
        )
    except (OSError, ValueError):
        return FileInfo(
            name=path.name,
            path=str(path.relative_to(workspace)) if workspace in path.parents else path.name,
            is_dir=path.is_dir(),
            size=0,
            modified=None,
        )


@tool
async def list_directory(
    path: str = ".",
    recursive: bool = False,
    include_hidden: bool = False,
    max_depth: int = 3,
) -> str:
    """List the contents of a directory.

    Args:
        path: Path to directory relative to workspace root. Defaults to "." (root).
        recursive: Whether to list contents recursively. Defaults to False.
        include_hidden: Whether to include hidden files (starting with .). Defaults to False.
        max_depth: Maximum depth for recursive listing (1-10). Defaults to 3.

    Returns:
        A formatted string listing the directory contents with file sizes.

    Raises:
        PathValidationError: If the path is invalid or outside workspace
        ToolExecutionError: If the path is not a directory
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Validate the path
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=True,
        allow_directory=True,
    )

    if not full_path.is_dir():
        raise ToolExecutionError(
            f"Path is not a directory: {path}",
            details={"path": path},
        )

    workspace = Path(context.workspace_path).resolve()

    logger.info(
        "directory_list_started",
        path=path,
        recursive=recursive,
        task_id=context.task_id,
    )

    try:
        files: list[FileInfo] = []
        directories: list[FileInfo] = []

        def should_include(item_path: Path) -> bool:
            """Check if an item should be included."""
            if not include_hidden and item_path.name.startswith("."):
                return False
            return True

        def list_items(dir_path: Path, current_depth: int = 0) -> None:
            """Recursively list items."""
            if current_depth > max_depth:
                return

            try:
                for item in sorted(dir_path.iterdir()):
                    if not should_include(item):
                        continue

                    info = _get_file_info(item, workspace)

                    if item.is_dir():
                        directories.append(info)
                        if recursive and current_depth < max_depth:
                            list_items(item, current_depth + 1)
                    else:
                        files.append(info)

            except PermissionError:
                pass  # Skip directories we can't access

        list_items(full_path)

        # Format output
        lines = [f"Directory: {path}"]
        lines.append(f"Total: {len(directories)} directories, {len(files)} files")
        lines.append("")

        if directories:
            lines.append("Directories:")
            for d in directories:
                lines.append(f"  {d.path}/")

        if files:
            lines.append("\nFiles:")
            for f in files:
                size_str = _format_size(f.size)
                lines.append(f"  {f.path} ({size_str})")

        logger.info(
            "directory_list_completed",
            path=path,
            file_count=len(files),
            dir_count=len(directories),
        )

        return "\n".join(lines)

    except Exception as e:
        logger.error(
            "directory_list_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to list directory: {e}",
            details={"path": path},
        ) from e


def _format_size(size: int) -> str:
    """Format file size in human-readable format."""
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    elif size < 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    else:
        return f"{size / (1024 * 1024 * 1024):.1f} GB"


@tool
async def create_directory(path: str, parents: bool = True) -> str:
    """Create a new directory.

    Args:
        path: Path to the directory relative to workspace root.
              Example: "src/new_module"
        parents: Whether to create parent directories if they don't exist.
                Defaults to True.

    Returns:
        A message confirming the directory creation.

    Raises:
        PermissionDeniedError: If write permission is not granted
        ToolExecutionError: If directory creation fails
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required",
            operation="create_directory",
            resource=path,
        )

    # Validate the path (doesn't need to exist yet)
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=False,
        allow_directory=True,
    )

    logger.info(
        "directory_create_started",
        path=path,
        parents=parents,
        task_id=context.task_id,
    )

    try:
        # Check if already exists
        if full_path.exists():
            if full_path.is_dir():
                return f"Directory already exists: {path}"
            else:
                raise ToolExecutionError(
                    f"Path exists but is not a directory: {path}",
                    details={"path": path},
                )

        # Create the directory
        full_path.mkdir(parents=parents, exist_ok=True)

        logger.info(
            "directory_create_completed",
            path=path,
        )

        return f"Created directory: {path}"

    except Exception as e:
        logger.error(
            "directory_create_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to create directory: {e}",
            details={"path": path},
        ) from e
