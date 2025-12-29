"""Git commit tools for agents.

Provides tools for creating commits and viewing commit history.
"""

from datetime import datetime

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import ToolPermission, get_current_context
from src.tools.exceptions import GitOperationError, PermissionDeniedError, ToolExecutionError
from src.tools.git.status import _is_git_repo, _run_git_command

logger = get_logger(__name__)


@tool
async def git_commit(message: str, amend: bool = False) -> str:
    """Create a new commit with staged changes.

    Args:
        message: Commit message. Should be descriptive and follow conventional
                commit format when possible (e.g., "feat: add user login").
        amend: If True, amend the previous commit instead of creating a new one.
               Defaults to False.

    Returns:
        A message with the commit hash and summary.

    Raises:
        GitOperationError: If not in a git repository, nothing to commit, or command fails
        PermissionDeniedError: If write permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required for git commit",
            operation="git_commit",
        )

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="commit",
        )

    if not message or not message.strip():
        raise GitOperationError(
            "Commit message cannot be empty",
            operation="commit",
        )

    logger.info(
        "git_commit_started",
        message_length=len(message),
        amend=amend,
        task_id=context.task_id,
    )

    try:
        # Check if there are staged changes (unless amending)
        if not amend:
            returncode, staged, _ = await _run_git_command(
                ["diff", "--cached", "--name-only"],
                workspace,
            )
            if not staged.strip():
                raise GitOperationError(
                    "Nothing to commit - no changes staged. Use git_add first.",
                    operation="commit",
                )

        # Build commit command
        cmd = ["commit", "-m", message]
        if amend:
            cmd.append("--amend")

        returncode, stdout, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            raise GitOperationError(
                f"Git commit failed: {stderr}",
                operation="commit",
                return_code=returncode,
                stderr=stderr,
            )

        # Get commit info
        returncode, commit_hash, _ = await _run_git_command(
            ["rev-parse", "--short", "HEAD"],
            workspace,
        )
        commit_hash = commit_hash.strip() if returncode == 0 else "unknown"

        # Get files changed count
        returncode, stat_output, _ = await _run_git_command(
            ["diff", "--stat", "HEAD~1..HEAD"],
            workspace,
        )

        files_changed = 0
        if stat_output.strip():
            lines = stat_output.strip().split("\n")
            if lines:
                last_line = lines[-1]
                if "file changed" in last_line or "files changed" in last_line:
                    parts = last_line.split(",")
                    for part in parts:
                        if "file" in part:
                            files_changed = int(part.strip().split()[0])
                            break

        logger.info(
            "git_commit_completed",
            hash=commit_hash,
            files_changed=files_changed,
            amend=amend,
        )

        action = "Amended commit" if amend else "Created commit"
        first_line = message.split("\n")[0][:50]
        if len(message.split("\n")[0]) > 50:
            first_line += "..."

        return f"{action} [{commit_hash}]: {first_line}\n({files_changed} file(s) changed)"

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_commit_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to commit: {e}",
            operation="commit",
        ) from e


@tool
async def git_log(count: int = 10, oneline: bool = True) -> str:
    """Show recent commit history.

    Args:
        count: Number of commits to show (1-100). Defaults to 10.
        oneline: Show commits in compact one-line format. Defaults to True.

    Returns:
        Formatted commit history.

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
            operation="log",
        )

    # Clamp count
    count = max(1, min(100, count))

    logger.info(
        "git_log_started",
        count=count,
        oneline=oneline,
        task_id=context.task_id,
    )

    try:
        if oneline:
            # Use oneline format
            cmd = ["log", f"-{count}", "--oneline"]
        else:
            # Use detailed format
            cmd = [
                "log",
                f"-{count}",
                "--format=%H|%h|%s|%an|%ai",
            ]

        returncode, output, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            # Check if it's an empty repo
            if "does not have any commits yet" in stderr:
                return "No commits yet in this repository"
            raise GitOperationError(
                f"Git log failed: {stderr}",
                operation="log",
                return_code=returncode,
                stderr=stderr,
            )

        if not output.strip():
            return "No commits yet in this repository"

        if oneline:
            lines = output.strip().split("\n")
            result = [f"Recent commits ({len(lines)}):"]
            result.append("")
            for line in lines:
                result.append(f"  {line}")
        else:
            # Parse detailed format
            lines = output.strip().split("\n")
            result = [f"Recent commits ({len(lines)}):"]
            result.append("")

            for line in lines:
                parts = line.split("|")
                if len(parts) >= 5:
                    full_hash, short_hash, subject, author, date_str = parts[:5]
                    try:
                        date = datetime.fromisoformat(date_str.replace(" ", "T"))
                        date_formatted = date.strftime("%Y-%m-%d %H:%M")
                    except ValueError:
                        date_formatted = date_str
                    result.append(f"  [{short_hash}] {subject}")
                    result.append(f"          by {author} on {date_formatted}")
                    result.append("")

        logger.info(
            "git_log_completed",
            count=len(lines) if output.strip() else 0,
        )

        return "\n".join(result)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_log_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to get git log: {e}",
            operation="log",
        ) from e
