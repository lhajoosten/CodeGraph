"""Git branching tools for agents.

Provides tools for managing branches.
"""

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import ToolPermission, get_current_context
from src.tools.exceptions import GitOperationError, PermissionDeniedError, ToolExecutionError
from src.tools.git.status import _is_git_repo, _run_git_command

logger = get_logger(__name__)


@tool
async def git_branch_list() -> str:
    """List all branches in the repository.

    Returns:
        A list of local and remote branches, with the current branch marked.

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
            operation="branch",
        )

    logger.info(
        "git_branch_list_started",
        task_id=context.task_id,
    )

    try:
        # Get current branch
        returncode, current, _ = await _run_git_command(
            ["rev-parse", "--abbrev-ref", "HEAD"],
            workspace,
        )
        current_branch = current.strip() if returncode == 0 else ""

        # Get local branches
        returncode, local_output, stderr = await _run_git_command(
            ["branch", "--list"],
            workspace,
        )

        if returncode != 0:
            raise GitOperationError(
                f"Git branch failed: {stderr}",
                operation="branch",
                return_code=returncode,
                stderr=stderr,
            )

        local_branches = []
        for line in local_output.strip().split("\n"):
            if line.strip():
                # Remove leading * and whitespace
                branch = line.strip().lstrip("* ").strip()
                local_branches.append(branch)

        # Get remote branches
        returncode, remote_output, _ = await _run_git_command(
            ["branch", "-r", "--list"],
            workspace,
        )

        remote_branches = []
        if returncode == 0 and remote_output.strip():
            for line in remote_output.strip().split("\n"):
                if line.strip() and "->" not in line:  # Skip HEAD pointers
                    branch = line.strip()
                    remote_branches.append(branch)

        # Format output
        lines = [f"Current branch: {current_branch}"]
        lines.append("")

        if local_branches:
            lines.append(f"Local branches ({len(local_branches)}):")
            for branch in sorted(local_branches):
                marker = "* " if branch == current_branch else "  "
                lines.append(f"{marker}{branch}")

        if remote_branches:
            lines.append(f"\nRemote branches ({len(remote_branches)}):")
            for branch in sorted(remote_branches):
                lines.append(f"  {branch}")

        logger.info(
            "git_branch_list_completed",
            current=current_branch,
            local_count=len(local_branches),
            remote_count=len(remote_branches),
        )

        return "\n".join(lines)

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_branch_list_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to list branches: {e}",
            operation="branch",
        ) from e


@tool
async def git_branch_create(name: str, checkout: bool = True) -> str:
    """Create a new branch.

    Args:
        name: Name for the new branch. Should follow naming conventions
              (e.g., "feature/add-login", "bugfix/fix-typo").
        checkout: Whether to switch to the new branch after creating it.
                 Defaults to True.

    Returns:
        A message confirming the branch was created.

    Raises:
        GitOperationError: If not in a git repository, branch exists, or command fails
        PermissionDeniedError: If write permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required for git branch create",
            operation="git_branch_create",
        )

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="branch",
        )

    if not name or not name.strip():
        raise GitOperationError(
            "Branch name cannot be empty",
            operation="branch",
        )

    # Validate branch name (basic validation)
    if " " in name or ".." in name or name.startswith("-"):
        raise GitOperationError(
            f"Invalid branch name: {name}",
            operation="branch",
        )

    logger.info(
        "git_branch_create_started",
        name=name,
        checkout=checkout,
        task_id=context.task_id,
    )

    try:
        if checkout:
            # Create and checkout in one command
            cmd = ["checkout", "-b", name]
        else:
            cmd = ["branch", name]

        returncode, stdout, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            if "already exists" in stderr:
                raise GitOperationError(
                    f"Branch '{name}' already exists",
                    operation="branch",
                    stderr=stderr,
                )
            raise GitOperationError(
                f"Git branch failed: {stderr}",
                operation="branch",
                return_code=returncode,
                stderr=stderr,
            )

        logger.info(
            "git_branch_create_completed",
            name=name,
            checked_out=checkout,
        )

        if checkout:
            return f"Created and switched to branch: {name}"
        else:
            return f"Created branch: {name}"

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_branch_create_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to create branch: {e}",
            operation="branch",
        ) from e


@tool
async def git_checkout(branch: str) -> str:
    """Switch to a different branch.

    Args:
        branch: Name of the branch to switch to.

    Returns:
        A message confirming the branch switch.

    Raises:
        GitOperationError: If not in a git repository, branch doesn't exist,
                          or there are uncommitted changes that conflict
        PermissionDeniedError: If write permission is not granted
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Check write permission
    if not context.has_permission(ToolPermission.WRITE):
        raise PermissionDeniedError(
            "Write permission required for git checkout",
            operation="git_checkout",
        )

    workspace = context.workspace_path

    if not _is_git_repo(workspace):
        raise GitOperationError(
            "Not a git repository",
            operation="checkout",
        )

    if not branch or not branch.strip():
        raise GitOperationError(
            "Branch name cannot be empty",
            operation="checkout",
        )

    logger.info(
        "git_checkout_started",
        branch=branch,
        task_id=context.task_id,
    )

    try:
        # Get current branch
        returncode, current, _ = await _run_git_command(
            ["rev-parse", "--abbrev-ref", "HEAD"],
            workspace,
        )
        previous_branch = current.strip() if returncode == 0 else "unknown"

        if previous_branch == branch:
            return f"Already on branch: {branch}"

        # Checkout branch
        cmd = ["checkout", branch]
        returncode, stdout, stderr = await _run_git_command(cmd, workspace)

        if returncode != 0:
            if "did not match any file" in stderr or "not a git repository" in stderr:
                raise GitOperationError(
                    f"Branch '{branch}' not found",
                    operation="checkout",
                    stderr=stderr,
                )
            if "would be overwritten" in stderr or "uncommitted changes" in stderr:
                raise GitOperationError(
                    "Cannot checkout: uncommitted changes would be overwritten. "
                    "Commit or stash your changes first.",
                    operation="checkout",
                    stderr=stderr,
                )
            raise GitOperationError(
                f"Git checkout failed: {stderr}",
                operation="checkout",
                return_code=returncode,
                stderr=stderr,
            )

        logger.info(
            "git_checkout_completed",
            previous=previous_branch,
            current=branch,
        )

        return f"Switched from '{previous_branch}' to '{branch}'"

    except GitOperationError:
        raise
    except Exception as e:
        logger.error(
            "git_checkout_failed",
            error=str(e),
            exc_info=True,
        )
        raise GitOperationError(
            f"Failed to checkout: {e}",
            operation="checkout",
        ) from e
