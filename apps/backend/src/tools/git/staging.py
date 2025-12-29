"""Git staging tools for agents.

Provides tools for staging and unstaging files.
"""

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import ToolPermission, get_current_context
from src.tools.exceptions import GitOperationError, PermissionDeniedError, ToolExecutionError
from src.tools.git.status import _is_git_repo, _run_git_command

logger = get_logger(__name__)


@tool
async def git_add(paths: list[str]) -> str:
    """Stage files for the next commit.

    Args:
        paths: List of file paths to stage. Use ["."] to stage all changes.
               Examples: ["src/main.py"], [".", "!test/"], ["*.py"]

    Returns:
        A message listing the files that were staged.

    Raises:
        GitOperationError: If not in a git repository or git command fails
        PermissionDeniedError: If write permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required for git add",
            operation="git_add",
        )

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="add",
        )

    if not paths:
        raise GitOperationError(
            "No paths specified",
            operation="add",
        )

    logger.info(
        "git_add_started",
        paths=paths,
        task_id=context.task_id,
    )

    try:
        # Run git add
        cmd = ["add"] + paths
        returncode, stdout, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            raise GitOperationError(
                f"Git add failed: {stderr}",
                operation="add",
                return_code=returncode,
                stderr=stderr,
            )

        # Get list of what was staged
        returncode, status_output, _ = await _run_git_command(
            ["diff", "--cached", "--name-only"],
            workspace,
        )

        staged_files = status_output.strip().split("\n") if status_output.strip() else []

        logger.info(
            "git_add_completed",
            staged_count=len(staged_files),
        )

        if not staged_files:
            return "No changes were staged (files may already be staged or unchanged)"

        lines = [f"Staged {len(staged_files)} file(s):"]
        for f in staged_files[:20]:  # Limit display
            lines.append(f"  + {f}")
        if len(staged_files) > 20:
            lines.append(f"  ... and {len(staged_files) - 20} more")

        return "\n".join(lines)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_add_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to stage files: {e}",
            operation="add",
        ) from e


@tool
async def git_reset(paths: list[str]) -> str:
    """Unstage files (remove from staging area).

    Args:
        paths: List of file paths to unstage.
               Examples: ["src/main.py"], ["."] to unstage all

    Returns:
        A message listing the files that were unstaged.

    Raises:
        GitOperationError: If not in a git repository or git command fails
        PermissionDeniedError: If write permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required for git reset",
            operation="git_reset",
        )

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="reset",
        )

    if not paths:
        raise GitOperationError(
            "No paths specified",
            operation="reset",
        )

    logger.info(
        "git_reset_started",
        paths=paths,
        task_id=context.task_id,
    )

    try:
        # Get list of currently staged files (before reset)
        returncode, before_output, _ = await _run_git_command(
            ["diff", "--cached", "--name-only"],
            workspace,
        )
        staged_before = set(before_output.strip().split("\n")) if before_output.strip() else set()

        # Run git reset
        cmd = ["reset", "HEAD", "--"] + paths
        returncode, stdout, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            # git reset returns non-zero for some valid cases, check stderr
            if "does not have any commits yet" in stderr:
                # For initial commit, use rm --cached
                cmd = ["rm", "--cached", "-r"] + paths
                returncode, stdout, stderr = await _run_git_command(cmd, workspace)
                if returncode != 0:
                    raise GitOperationError(
                        f"Git reset failed: {stderr}",
                        operation="reset",
                        return_code=returncode,
                        stderr=stderr,
                    )

        # Get list of currently staged files (after reset)
        returncode, after_output, _ = await _run_git_command(
            ["diff", "--cached", "--name-only"],
            workspace,
        )
        staged_after = set(after_output.strip().split("\n")) if after_output.strip() else set()

        # Calculate what was unstaged
        unstaged_files = list(staged_before - staged_after)

        logger.info(
            "git_reset_completed",
            unstaged_count=len(unstaged_files),
        )

        if not unstaged_files:
            return "No files were unstaged (files may not have been staged)"

        lines = [f"Unstaged {len(unstaged_files)} file(s):"]
        for f in unstaged_files[:20]:  # Limit display
            lines.append(f"  - {f}")
        if len(unstaged_files) > 20:
            lines.append(f"  ... and {len(unstaged_files) - 20} more")

        return "\n".join(lines)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_reset_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to unstage files: {e}",
            operation="reset",
        ) from e
