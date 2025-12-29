"""File operation tools for agents.

Provides tools for reading, writing, editing, and deleting files
within the workspace context.
"""

import aiofiles
from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import ToolPermission, get_current_context
from src.tools.exceptions import (
    FileNotFoundInWorkspaceError,
    PermissionDeniedError,
    ToolExecutionError,
)
from src.tools.security.path_validator import validate_path

logger = get_logger(__name__)


@tool
async def read_file(path: str) -> str:
    """Read the contents of a file.

    Args:
        path: Path to the file relative to workspace root.
              Example: "src/main.py" or "README.md"

    Returns:
        The file contents as a string.

    Raises:
        FileNotFoundInWorkspaceError: If the file doesn't exist
        PathValidationError: If the path is invalid or outside workspace
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Validate the path
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=True,
        allow_directory=False,
    )

    logger.info(
        "file_read_started",
        path=path,
        full_path=str(full_path),
        task_id=context.task_id,
    )

    try:
        async with aiofiles.open(full_path, encoding="utf-8") as f:
            content = await f.read()

        logger.info(
            "file_read_completed",
            path=path,
            size=len(content),
            lines=content.count("\n") + 1,
        )

        return content

    except UnicodeDecodeError:
        # Try with latin-1 encoding as fallback
        try:
            async with aiofiles.open(full_path, encoding="latin-1") as f:
                content = await f.read()
            return content
        except Exception as e:
            raise ToolExecutionError(
                f"Failed to decode file: {e}",
                details={"path": path},
            ) from e

    except FileNotFoundError:
        raise FileNotFoundInWorkspaceError(path, context.workspace_path) from None

    except Exception as e:
        logger.error(
            "file_read_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to read file: {e}",
            details={"path": path},
        ) from e


@tool
async def write_file(path: str, content: str, create_dirs: bool = True) -> str:
    """Write content to a file, creating it if it doesn't exist.

    Args:
        path: Path to the file relative to workspace root.
              Example: "src/new_file.py"
        content: The content to write to the file.
        create_dirs: Whether to create parent directories if they don't exist.
                    Defaults to True.

    Returns:
        A message confirming the write operation with the number of bytes written.

    Raises:
        PermissionDeniedError: If write permission is not granted
        PathValidationError: If the path is invalid or outside workspace
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required",
            operation="write_file",
            resource=path,
        )

    # Validate the path (doesn't need to exist yet)
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=False,
        allow_directory=False,
    )

    logger.info(
        "file_write_started",
        path=path,
        full_path=str(full_path),
        size=len(content),
        task_id=context.task_id,
    )

    try:
        # Create parent directories if needed
        if create_dirs:
            full_path.parent.mkdir(parents=True, exist_ok=True)

        # Check if file exists (for logging)
        existed = full_path.exists()

        # Write the file
        async with aiofiles.open(full_path, mode="w", encoding="utf-8") as f:
            await f.write(content)

        action = "Updated" if existed else "Created"
        logger.info(
            "file_write_completed",
            path=path,
            bytes_written=len(content.encode("utf-8")),
            created=not existed,
        )

        return f"{action} file: {path} ({len(content.encode('utf-8'))} bytes)"

    except Exception as e:
        logger.error(
            "file_write_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to write file: {e}",
            details={"path": path},
        ) from e


@tool
async def edit_file(path: str, old_content: str, new_content: str) -> str:
    """Edit a file by replacing a specific section of content.

    This tool finds the exact old_content in the file and replaces it
    with new_content. The old_content must match exactly (including whitespace).

    Args:
        path: Path to the file relative to workspace root.
        old_content: The exact content to find and replace.
                    Must be unique in the file.
        new_content: The content to replace it with.

    Returns:
        A message confirming the edit with the number of replacements.

    Raises:
        FileNotFoundInWorkspaceError: If the file doesn't exist
        ToolExecutionError: If old_content is not found or not unique
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required",
            operation="edit_file",
            resource=path,
        )

    # Validate the path
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=True,
        allow_directory=False,
    )

    logger.info(
        "file_edit_started",
        path=path,
        old_content_length=len(old_content),
        new_content_length=len(new_content),
        task_id=context.task_id,
    )

    try:
        # Read current content
        async with aiofiles.open(full_path, encoding="utf-8") as f:
            current_content = await f.read()

        # Count occurrences
        occurrences = current_content.count(old_content)

        if occurrences == 0:
            # Try to provide helpful context
            preview = old_content[:100] + "..." if len(old_content) > 100 else old_content
            raise ToolExecutionError(
                f"Content not found in file. Looking for:\n{preview}",
                details={"path": path, "searched_for": old_content[:200]},
            )

        if occurrences > 1:
            raise ToolExecutionError(
                f"Content appears {occurrences} times. Please provide more context to make it unique.",
                details={"path": path, "occurrences": occurrences},
            )

        # Perform the replacement
        new_file_content = current_content.replace(old_content, new_content, 1)

        # Write the modified content
        async with aiofiles.open(full_path, mode="w", encoding="utf-8") as f:
            await f.write(new_file_content)

        old_size = len(current_content)
        new_size = len(new_file_content)

        logger.info(
            "file_edit_completed",
            path=path,
            old_size=old_size,
            new_size=new_size,
            size_diff=new_size - old_size,
        )

        return (
            f"Edited file: {path} (replaced {len(old_content)} chars with {len(new_content)} chars)"
        )

    except ToolExecutionError:
        raise

    except Exception as e:
        logger.error(
            "file_edit_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to edit file: {e}",
            details={"path": path},
        ) from e


@tool
async def delete_file(path: str) -> str:
    """Delete a file from the workspace.

    Args:
        path: Path to the file relative to workspace root.

    Returns:
        A message confirming the deletion.

    Raises:
        FileNotFoundInWorkspaceError: If the file doesn't exist
        PermissionDeniedError: If delete permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check delete permission
    if not context.has_permission(ToolPermission.DELETE):
        raise PermissionDeniedError(
            "Delete permission required",
            operation="delete_file",
            resource=path,
        )

    # Validate the path
    full_path = validate_path(
        path,
        context.workspace_path,
        must_exist=True,
        allow_directory=False,
    )

    logger.info(
        "file_delete_started",
        path=path,
        full_path=str(full_path),
        task_id=context.task_id,
    )

    try:
        # Get file size before deleting
        size = full_path.stat().st_size

        # Delete the file
        full_path.unlink()

        logger.info(
            "file_delete_completed",
            path=path,
            size=size,
        )

        return f"Deleted file: {path} ({size} bytes)"

    except FileNotFoundError:
        raise FileNotFoundInWorkspaceError(path, context.workspace_path) from None

    except Exception as e:
        logger.error(
            "file_delete_failed",
            path=path,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to delete file: {e}",
            details={"path": path},
        ) from e


@tool
async def file_exists(path: str) -> str:
    """Check if a file exists in the workspace.

    Args:
        path: Path to the file relative to workspace root.

    Returns:
        "true" if the file exists, "false" otherwise.
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    try:
        full_path = validate_path(
            path,
            context.workspace_path,
            must_exist=False,
            allow_directory=True,
        )

        exists = full_path.exists()
        is_file = full_path.is_file() if exists else False

        if exists and is_file:
            return "true"
        elif exists:
            return "false (path exists but is a directory)"
        else:
            return "false"

    except Exception:
        return "false"
