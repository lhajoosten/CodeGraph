"""Workspace management for isolated task execution.

This module provides workspace isolation, ensuring each task
executes within its own sandboxed directory structure.
"""

import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger
from src.tools.exceptions import WorkspaceNotFoundError

logger = get_logger(__name__)


class WorkspaceManager:
    """Manages isolated workspaces for task execution.

    Each task gets its own workspace directory where all file
    operations are sandboxed.
    """

    def __init__(self, base_path: str | None = None) -> None:
        """Initialize the workspace manager.

        Args:
            base_path: Base directory for workspaces.
                      Defaults to system temp directory.
        """
        if base_path:
            self._base_path = Path(base_path)
        else:
            # Use a subdirectory of temp for workspaces
            self._base_path = Path(tempfile.gettempdir()) / "codegraph_workspaces"

        # Ensure base path exists
        self._base_path.mkdir(parents=True, exist_ok=True)

        # Track active workspaces
        self._workspaces: dict[int, Path] = {}

        logger.info(
            "workspace_manager_initialized",
            base_path=str(self._base_path),
        )

    @property
    def base_path(self) -> Path:
        """Get the base path for all workspaces."""
        return self._base_path

    def create_workspace(
        self,
        task_id: int,
        source_path: str | None = None,
    ) -> Path:
        """Create a new workspace for a task.

        If source_path is provided, the contents will be copied
        to the new workspace.

        Args:
            task_id: ID of the task
            source_path: Optional path to copy contents from

        Returns:
            Path to the created workspace

        Raises:
            OSError: If workspace creation fails
        """
        # Create unique workspace directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        workspace_name = f"task_{task_id}_{timestamp}"
        workspace_path = self._base_path / workspace_name

        try:
            if source_path:
                # Copy source to workspace
                source = Path(source_path)
                if not source.exists():
                    raise WorkspaceNotFoundError(source_path)

                if source.is_dir():
                    shutil.copytree(
                        source,
                        workspace_path,
                        ignore=shutil.ignore_patterns(
                            ".git",
                            "__pycache__",
                            "*.pyc",
                            "node_modules",
                            ".venv",
                            "venv",
                        ),
                    )
                else:
                    workspace_path.mkdir(parents=True)
                    shutil.copy2(source, workspace_path / source.name)
            else:
                workspace_path.mkdir(parents=True)

            # Track the workspace
            self._workspaces[task_id] = workspace_path

            logger.info(
                "workspace_created",
                task_id=task_id,
                workspace_path=str(workspace_path),
                copied_from=source_path,
            )

            return workspace_path

        except Exception as e:
            logger.error(
                "workspace_creation_failed",
                task_id=task_id,
                error=str(e),
                exc_info=True,
            )
            raise

    def get_workspace(self, task_id: int) -> Path:
        """Get the workspace path for a task.

        Args:
            task_id: ID of the task

        Returns:
            Path to the workspace

        Raises:
            WorkspaceNotFoundError: If workspace doesn't exist
        """
        workspace_path = self._workspaces.get(task_id)

        if workspace_path is None or not workspace_path.exists():
            raise WorkspaceNotFoundError(f"Workspace for task {task_id}")

        return workspace_path

    def workspace_exists(self, task_id: int) -> bool:
        """Check if a workspace exists for a task.

        Args:
            task_id: ID of the task

        Returns:
            True if workspace exists
        """
        workspace_path = self._workspaces.get(task_id)
        return workspace_path is not None and workspace_path.exists()

    def cleanup_workspace(self, task_id: int) -> None:
        """Remove a workspace and its contents.

        Args:
            task_id: ID of the task
        """
        workspace_path = self._workspaces.pop(task_id, None)

        if workspace_path and workspace_path.exists():
            try:
                shutil.rmtree(workspace_path)
                logger.info(
                    "workspace_cleaned_up",
                    task_id=task_id,
                    workspace_path=str(workspace_path),
                )
            except Exception as e:
                logger.error(
                    "workspace_cleanup_failed",
                    task_id=task_id,
                    error=str(e),
                    exc_info=True,
                )

    def cleanup_all(self) -> None:
        """Remove all workspaces."""
        task_ids = list(self._workspaces.keys())
        for task_id in task_ids:
            self.cleanup_workspace(task_id)

    def get_workspace_stats(self, task_id: int) -> dict[str, Any]:
        """Get statistics about a workspace.

        Args:
            task_id: ID of the task

        Returns:
            Dictionary with workspace statistics
        """
        workspace_path = self.get_workspace(task_id)

        file_count = 0
        dir_count = 0
        total_size = 0

        for item in workspace_path.rglob("*"):
            if item.is_file():
                file_count += 1
                total_size += item.stat().st_size
            elif item.is_dir():
                dir_count += 1

        return {
            "path": str(workspace_path),
            "file_count": file_count,
            "directory_count": dir_count,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
        }

    def register_existing_workspace(self, task_id: int, workspace_path: str) -> Path:
        """Register an existing directory as a workspace.

        Useful when working with existing repositories.

        Args:
            task_id: ID of the task
            workspace_path: Path to the existing directory

        Returns:
            Path to the workspace

        Raises:
            WorkspaceNotFoundError: If path doesn't exist
        """
        path = Path(workspace_path).resolve()

        if not path.exists():
            raise WorkspaceNotFoundError(workspace_path)

        self._workspaces[task_id] = path

        logger.info(
            "workspace_registered",
            task_id=task_id,
            workspace_path=str(path),
        )

        return path


# Global workspace manager instance
_workspace_manager: WorkspaceManager | None = None


def get_workspace_manager() -> WorkspaceManager:
    """Get the global workspace manager instance.

    Returns:
        The global WorkspaceManager singleton
    """
    global _workspace_manager
    if _workspace_manager is None:
        # Use configured base path if available
        base_path = getattr(settings, "WORKSPACE_BASE_PATH", None)
        _workspace_manager = WorkspaceManager(base_path)
    return _workspace_manager


def get_workspace_path(task_id: int) -> str:
    """Get the workspace path for a task.

    Convenience function using the global manager.

    Args:
        task_id: ID of the task

    Returns:
        Workspace path as string
    """
    return str(get_workspace_manager().get_workspace(task_id))
