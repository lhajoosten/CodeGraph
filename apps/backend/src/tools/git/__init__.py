"""Git tools for agent operations.

This module provides git operations including:
- Repository status and diff
- Staging and unstaging files
- Committing changes
- Branch management
"""

from src.tools.git.branching import (
    git_branch_create,
    git_branch_list,
    git_checkout,
)
from src.tools.git.commits import git_commit, git_log
from src.tools.git.staging import git_add, git_reset
from src.tools.git.status import git_diff, git_status

__all__ = [
    # Status
    "git_status",
    "git_diff",
    # Staging
    "git_add",
    "git_reset",
    # Commits
    "git_commit",
    "git_log",
    # Branching
    "git_branch_list",
    "git_branch_create",
    "git_checkout",
]
