"""Agent tools for CodeGraph.

This module provides all tools available to agents including:
- File system operations (read, write, edit, delete, search)
- Git operations (status, commit, branch management)
- Directory operations (list, create)
- Database operations (introspection, query execution)

Tools are registered with the ToolRegistry and can be bound to
agents using the registry's get_tools_for_agent() function.
"""

from src.tools.base import (
    ToolContext,
    ToolPermission,
    ToolResult,
    execute_tool,
    get_current_context,
    set_current_context,
)

# Import tools for registration
from src.tools.database import (
    execute_query,
    explain_query,
    get_table_columns,
    get_table_relationships,
    list_tables,
)
from src.tools.exceptions import (
    DatabaseToolError,
    ExecutionTimeoutError,
    FileNotFoundInWorkspaceError,
    GitOperationError,
    PathValidationError,
    PermissionDeniedError,
    SandboxError,
    ToolError,
    ToolExecutionError,
    WorkspaceNotFoundError,
)
from src.tools.filesystem import (
    create_directory,
    delete_file,
    edit_file,
    file_exists,
    grep_content,
    list_directory,
    read_file,
    search_files,
    write_file,
)
from src.tools.git import (
    git_add,
    git_branch_create,
    git_branch_list,
    git_checkout,
    git_commit,
    git_diff,
    git_log,
    git_reset,
    git_status,
)
from src.tools.registry import (
    AgentType,
    ToolCategory,
    ToolRegistry,
    bind_tools_to_model,
    get_registry,
    get_tools_for_agent,
    register_tool,
    register_tools,
)


def register_all_tools() -> None:
    """Register all available tools with the global registry.

    Call this function during application startup to make all
    tools available for agent binding.
    """
    registry = get_registry()

    # Register filesystem tools
    registry.register_many(
        [
            read_file,
            write_file,
            edit_file,
            delete_file,
            file_exists,
            list_directory,
            create_directory,
        ],
        ToolCategory.FILESYSTEM,
    )

    # Register search tools
    registry.register_many(
        [
            search_files,
            grep_content,
        ],
        ToolCategory.SEARCH,
    )

    # Register git tools
    registry.register_many(
        [
            git_status,
            git_diff,
            git_add,
            git_reset,
            git_commit,
            git_log,
            git_branch_list,
            git_branch_create,
            git_checkout,
        ],
        ToolCategory.GIT,
    )

    # Register database tools
    registry.register_many(
        [
            list_tables,
            get_table_columns,
            get_table_relationships,
            execute_query,
            explain_query,
        ],
        ToolCategory.DATABASE,
    )


__all__ = [
    # Base classes
    "ToolContext",
    "ToolPermission",
    "ToolResult",
    "execute_tool",
    "get_current_context",
    "set_current_context",
    # Registry
    "AgentType",
    "ToolCategory",
    "ToolRegistry",
    "get_registry",
    "get_tools_for_agent",
    "bind_tools_to_model",
    "register_tool",
    "register_tools",
    "register_all_tools",
    # Exceptions
    "ToolError",
    "ToolExecutionError",
    "PathValidationError",
    "PermissionDeniedError",
    "WorkspaceNotFoundError",
    "FileNotFoundInWorkspaceError",
    "GitOperationError",
    "DatabaseToolError",
    "ExecutionTimeoutError",
    "SandboxError",
    # Filesystem tools
    "read_file",
    "write_file",
    "edit_file",
    "delete_file",
    "file_exists",
    "list_directory",
    "create_directory",
    "search_files",
    "grep_content",
    # Git tools
    "git_status",
    "git_diff",
    "git_add",
    "git_reset",
    "git_commit",
    "git_log",
    "git_branch_list",
    "git_branch_create",
    "git_checkout",
    # Database tools
    "list_tables",
    "get_table_columns",
    "get_table_relationships",
    "execute_query",
    "explain_query",
]
