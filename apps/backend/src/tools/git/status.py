"""Git status and diff tools for agents.

Provides tools for checking repository status and viewing diffs.
"""

import asyncio
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import get_current_context
from src.tools.exceptions import GitOperationError, ToolExecutionError

logger = get_logger(__name__)


async def _run_git_command(
    args: list[str],
    cwd: str,
    capture_output: bool = True,
) -> tuple[int, str, str]:
    """Run a git command asynchronously.

    Args:
        args: Git command arguments (without 'git' prefix)
        cwd: Working directory
        capture_output: Whether to capture stdout/stderr

    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    process = await asyncio.create_subprocess_exec(
        "git",
        *args,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE if capture_output else None,
        stderr=asyncio.subprocess.PIPE if capture_output else None,
    )

    stdout, stderr = await process.communicate()

    return (
        process.returncode or 0,
        stdout.decode("utf-8") if stdout else "",
        stderr.decode("utf-8") if stderr else "",
    )


def _is_git_repo(path: str) -> bool:
    """Check if a path is inside a git repository.

    Args:
        path: Path to check

    Returns:
        True if path is in a git repo
    """
    current = Path(path).resolve()
    while current != current.parent:
        if (current / ".git").exists():
            return True
        current = current.parent
    return False


@tool
async def git_status() -> str:
    """Get the current git repository status.

    Returns information about:
    - Current branch name
    - Staged files (ready to commit)
    - Modified files (not staged)
    - Untracked files
    - Whether the working tree is clean

    Returns:
        Formatted status information about the repository.

    Raises:
        GitOperationError: If not in a git repository or git command fails
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    workspace = context.workspace_path

    # Check if workspace is a git repo
    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="status",
        )

    logger.info(
        "git_status_started",
        workspace=workspace,
        task_id=context.task_id,
    )

    try:
        # Get branch name
        returncode, branch, stderr = await _run_git_command(
            ["rev-parse", "--abbrev-ref", "HEAD"],
            workspace,
        )
        if returncode != 0:
            branch = "unknown"
        else:
            branch = branch.strip()

        # Get status
        returncode, output, stderr = await _run_git_command(
            ["status", "--porcelain", "-b"],
            workspace,
        )

        if returncode != 0:
            raise GitOperationError(
                f"Git status failed: {stderr}",
                operation="status",
                return_code=returncode,
                stderr=stderr,
            )

        # Parse status output
        lines = output.strip().split("\n") if output.strip() else []

        staged: list[str] = []
        modified: list[str] = []
        untracked: list[str] = []
        deleted: list[str] = []

        for line in lines:
            if line.startswith("##"):
                # Branch info line - extract ahead/behind
                continue

            if len(line) < 2:
                continue

            index_status = line[0]
            work_tree_status = line[1]
            file_path = line[3:].strip()

            # Staged changes (index has changes)
            if index_status in ("A", "M", "D", "R", "C"):
                if index_status == "D":
                    staged.append(f"{file_path} (deleted)")
                elif index_status == "R":
                    staged.append(f"{file_path} (renamed)")
                else:
                    staged.append(file_path)

            # Unstaged changes (work tree has changes)
            if work_tree_status == "M":
                modified.append(file_path)
            elif work_tree_status == "D":
                deleted.append(file_path)

            # Untracked files
            if index_status == "?" and work_tree_status == "?":
                untracked.append(file_path)

        # Check for ahead/behind
        returncode, ahead_behind, _ = await _run_git_command(
            ["rev-list", "--left-right", "--count", f"{branch}...origin/{branch}"],
            workspace,
        )
        ahead = 0
        behind = 0
        if returncode == 0 and ahead_behind.strip():
            parts = ahead_behind.strip().split()
            if len(parts) == 2:
                ahead = int(parts[0])
                behind = int(parts[1])

        is_clean = not (staged or modified or untracked or deleted)

        # Format output
        lines = [f"Branch: {branch}"]

        if ahead > 0:
            lines.append(f"Ahead of origin by {ahead} commit(s)")
        if behind > 0:
            lines.append(f"Behind origin by {behind} commit(s)")

        if is_clean:
            lines.append("\nWorking tree is clean")
        else:
            if staged:
                lines.append(f"\nStaged for commit ({len(staged)}):")
                for f in staged:
                    lines.append(f"  + {f}")

            if modified:
                lines.append(f"\nModified (not staged) ({len(modified)}):")
                for f in modified:
                    lines.append(f"  M {f}")

            if deleted:
                lines.append(f"\nDeleted ({len(deleted)}):")
                for f in deleted:
                    lines.append(f"  D {f}")

            if untracked:
                lines.append(f"\nUntracked ({len(untracked)}):")
                for f in untracked:
                    lines.append(f"  ? {f}")

        logger.info(
            "git_status_completed",
            branch=branch,
            staged=len(staged),
            modified=len(modified),
            untracked=len(untracked),
            is_clean=is_clean,
        )

        return "\n".join(lines)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_status_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to get git status: {e}",
            operation="status",
        ) from e


@tool
async def git_diff(staged: bool = False, path: str | None = None) -> str:
    """Show the diff of changes in the repository.

    Args:
        staged: If True, show staged changes (--cached). If False, show unstaged changes.
               Defaults to False.
        path: Optional path to limit diff to specific file or directory.

    Returns:
        The diff output showing file changes.

    Raises:
        GitOperationError: If not in a git repository or git command fails
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="diff",
        )

    logger.info(
        "git_diff_started",
        staged=staged,
        path=path,
        task_id=context.task_id,
    )

    try:
        # Build command
        cmd = ["diff"]
        if staged:
            cmd.append("--cached")
        cmd.append("--stat")  # Add stat summary
        if path:
            cmd.append("--")
            cmd.append(path)

        returncode, stat_output, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            raise GitOperationError(
                f"Git diff failed: {stderr}",
                operation="diff",
                return_code=returncode,
                stderr=stderr,
            )

        # Get full diff
        cmd = ["diff"]
        if staged:
            cmd.append("--cached")
        if path:
            cmd.append("--")
            cmd.append(path)

        returncode, diff_output, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            raise GitOperationError(
                f"Git diff failed: {stderr}",
                operation="diff",
                return_code=returncode,
                stderr=stderr,
            )

        # Parse stats
        lines = stat_output.strip().split("\n") if stat_output.strip() else []
        files_changed = 0
        insertions = 0
        deletions = 0

        for line in lines:
            if "file changed" in line or "files changed" in line:
                parts = line.split(",")
                for part in parts:
                    part = part.strip()
                    if "file" in part:
                        files_changed = int(part.split()[0])
                    elif "insertion" in part:
                        insertions = int(part.split()[0])
                    elif "deletion" in part:
                        deletions = int(part.split()[0])

        # Format output
        diff_type = "staged" if staged else "unstaged"

        if not diff_output.strip():
            return f"No {diff_type} changes" + (f" in {path}" if path else "")

        result = [f"Diff ({diff_type}):"]
        result.append(f"Files changed: {files_changed}, +{insertions}, -{deletions}")
        result.append("")
        result.append(diff_output)

        logger.info(
            "git_diff_completed",
            staged=staged,
            files_changed=files_changed,
            insertions=insertions,
            deletions=deletions,
        )

        return "\n".join(result)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_diff_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to get git diff: {e}",
            operation="diff",
        ) from e
