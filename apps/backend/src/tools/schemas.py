"""Pydantic schemas for tool inputs and outputs.

All tool input/output schemas are defined here for consistency
and easy import across the tools module.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

# =============================================================================
# File System Schemas
# =============================================================================


class ReadFileInput(BaseModel):
    """Input schema for reading a file."""

    path: str = Field(
        ...,
        description="Path to file relative to workspace root",
        examples=["src/main.py", "README.md"],
    )
    encoding: str = Field(
        default="utf-8",
        description="File encoding to use",
    )


class ReadFileOutput(BaseModel):
    """Output schema for reading a file."""

    content: str = Field(..., description="File contents")
    path: str = Field(..., description="Resolved file path")
    size: int = Field(..., description="File size in bytes")
    encoding: str = Field(default="utf-8", description="Encoding used")
    lines: int = Field(..., description="Number of lines in the file")


class WriteFileInput(BaseModel):
    """Input schema for writing a file."""

    path: str = Field(
        ...,
        description="Path to file relative to workspace root",
        examples=["src/new_file.py"],
    )
    content: str = Field(..., description="Content to write to the file")
    create_dirs: bool = Field(
        default=True,
        description="Create parent directories if they don't exist",
    )
    encoding: str = Field(default="utf-8", description="File encoding to use")


class WriteFileOutput(BaseModel):
    """Output schema for writing a file."""

    path: str = Field(..., description="Resolved file path")
    bytes_written: int = Field(..., description="Number of bytes written")
    created: bool = Field(..., description="Whether the file was created (vs updated)")


class EditFileInput(BaseModel):
    """Input schema for editing a file section."""

    path: str = Field(
        ...,
        description="Path to file relative to workspace root",
    )
    old_content: str = Field(
        ...,
        description="Exact content to find and replace",
    )
    new_content: str = Field(
        ...,
        description="Content to replace with",
    )


class EditFileOutput(BaseModel):
    """Output schema for editing a file."""

    path: str = Field(..., description="Resolved file path")
    replacements: int = Field(..., description="Number of replacements made")
    old_size: int = Field(..., description="Original file size")
    new_size: int = Field(..., description="New file size")


class DeleteFileInput(BaseModel):
    """Input schema for deleting a file."""

    path: str = Field(
        ...,
        description="Path to file relative to workspace root",
    )


class DeleteFileOutput(BaseModel):
    """Output schema for deleting a file."""

    path: str = Field(..., description="Deleted file path")
    size: int = Field(..., description="Size of deleted file in bytes")


class ListDirectoryInput(BaseModel):
    """Input schema for listing directory contents."""

    path: str = Field(
        default=".",
        description="Path to directory relative to workspace root",
    )
    recursive: bool = Field(
        default=False,
        description="Whether to list contents recursively",
    )
    include_hidden: bool = Field(
        default=False,
        description="Whether to include hidden files (starting with .)",
    )
    max_depth: int = Field(
        default=3,
        description="Maximum depth for recursive listing",
        ge=1,
        le=10,
    )


class FileInfo(BaseModel):
    """Information about a file or directory."""

    name: str = Field(..., description="File or directory name")
    path: str = Field(..., description="Relative path from workspace root")
    is_dir: bool = Field(..., description="Whether this is a directory")
    size: int = Field(default=0, description="File size in bytes (0 for directories)")
    modified: datetime | None = Field(default=None, description="Last modified time")


class ListDirectoryOutput(BaseModel):
    """Output schema for listing directory contents."""

    path: str = Field(..., description="Directory path")
    files: list[FileInfo] = Field(default_factory=list, description="List of files")
    directories: list[FileInfo] = Field(default_factory=list, description="List of directories")
    total_count: int = Field(..., description="Total number of items")


class CreateDirectoryInput(BaseModel):
    """Input schema for creating a directory."""

    path: str = Field(
        ...,
        description="Path to directory relative to workspace root",
    )
    parents: bool = Field(
        default=True,
        description="Create parent directories if needed",
    )


class CreateDirectoryOutput(BaseModel):
    """Output schema for creating a directory."""

    path: str = Field(..., description="Created directory path")
    created: bool = Field(..., description="Whether the directory was created")


class SearchFilesInput(BaseModel):
    """Input schema for searching files by pattern."""

    pattern: str = Field(
        ...,
        description="Glob pattern to match files (e.g., '*.py', 'src/**/*.ts')",
        examples=["*.py", "src/**/*.ts", "test_*.py"],
    )
    path: str = Field(
        default=".",
        description="Starting directory for search",
    )
    max_results: int = Field(
        default=100,
        description="Maximum number of results to return",
        ge=1,
        le=1000,
    )


class SearchFilesOutput(BaseModel):
    """Output schema for file search."""

    pattern: str = Field(..., description="Search pattern used")
    matches: list[str] = Field(default_factory=list, description="Matching file paths")
    count: int = Field(..., description="Number of matches found")
    truncated: bool = Field(default=False, description="Whether results were truncated")


class GrepContentInput(BaseModel):
    """Input schema for searching file contents."""

    pattern: str = Field(
        ...,
        description="Regex pattern to search for in file contents",
    )
    path: str = Field(
        default=".",
        description="Starting directory for search",
    )
    file_pattern: str = Field(
        default="*",
        description="Glob pattern for files to search in",
    )
    max_results: int = Field(
        default=50,
        description="Maximum number of results to return",
        ge=1,
        le=500,
    )
    context_lines: int = Field(
        default=2,
        description="Number of context lines before/after match",
        ge=0,
        le=10,
    )


class GrepMatch(BaseModel):
    """A single grep match result."""

    file: str = Field(..., description="File path containing the match")
    line_number: int = Field(..., description="Line number of the match")
    line: str = Field(..., description="The matching line")
    context_before: list[str] = Field(default_factory=list, description="Lines before the match")
    context_after: list[str] = Field(default_factory=list, description="Lines after the match")


class GrepContentOutput(BaseModel):
    """Output schema for content search."""

    pattern: str = Field(..., description="Search pattern used")
    matches: list[GrepMatch] = Field(default_factory=list, description="List of matches")
    count: int = Field(..., description="Total number of matches")
    files_searched: int = Field(..., description="Number of files searched")
    truncated: bool = Field(default=False, description="Whether results were truncated")


# =============================================================================
# Git Schemas
# =============================================================================


class GitStatusOutput(BaseModel):
    """Output schema for git status."""

    branch: str = Field(..., description="Current branch name")
    staged: list[str] = Field(default_factory=list, description="Files staged for commit")
    modified: list[str] = Field(default_factory=list, description="Modified but unstaged files")
    untracked: list[str] = Field(default_factory=list, description="Untracked files")
    deleted: list[str] = Field(default_factory=list, description="Deleted files")
    renamed: list[tuple[str, str]] = Field(
        default_factory=list, description="Renamed files (old, new)"
    )
    ahead: int = Field(default=0, description="Commits ahead of remote")
    behind: int = Field(default=0, description="Commits behind remote")
    is_clean: bool = Field(..., description="Whether working tree is clean")


class GitDiffInput(BaseModel):
    """Input schema for git diff."""

    staged: bool = Field(
        default=False,
        description="Show staged changes (--cached) instead of unstaged",
    )
    path: str | None = Field(
        default=None,
        description="Limit diff to specific path",
    )


class GitDiffOutput(BaseModel):
    """Output schema for git diff."""

    diff: str = Field(..., description="Diff output")
    files_changed: int = Field(..., description="Number of files changed")
    insertions: int = Field(..., description="Number of lines inserted")
    deletions: int = Field(..., description="Number of lines deleted")


class GitAddInput(BaseModel):
    """Input schema for git add."""

    paths: list[str] = Field(
        ...,
        description="Paths to stage (use ['.'] for all)",
        min_length=1,
    )


class GitAddOutput(BaseModel):
    """Output schema for git add."""

    staged: list[str] = Field(..., description="Files that were staged")
    count: int = Field(..., description="Number of files staged")


class GitResetInput(BaseModel):
    """Input schema for git reset."""

    paths: list[str] = Field(
        ...,
        description="Paths to unstage",
        min_length=1,
    )


class GitResetOutput(BaseModel):
    """Output schema for git reset."""

    unstaged: list[str] = Field(..., description="Files that were unstaged")
    count: int = Field(..., description="Number of files unstaged")


class GitCommitInput(BaseModel):
    """Input schema for git commit."""

    message: str = Field(
        ...,
        description="Commit message",
        min_length=1,
        max_length=500,
    )
    amend: bool = Field(
        default=False,
        description="Amend the previous commit",
    )


class GitCommitOutput(BaseModel):
    """Output schema for git commit."""

    hash: str = Field(..., description="Commit hash (short)")
    message: str = Field(..., description="Commit message")
    files_changed: int = Field(..., description="Number of files changed")


class GitLogInput(BaseModel):
    """Input schema for git log."""

    count: int = Field(
        default=10,
        description="Number of commits to show",
        ge=1,
        le=100,
    )
    oneline: bool = Field(
        default=True,
        description="Show commits in oneline format",
    )


class GitLogEntry(BaseModel):
    """A single git log entry."""

    hash: str = Field(..., description="Commit hash (short)")
    message: str = Field(..., description="Commit message (first line)")
    author: str = Field(..., description="Author name")
    date: datetime = Field(..., description="Commit date")


class GitLogOutput(BaseModel):
    """Output schema for git log."""

    commits: list[GitLogEntry] = Field(default_factory=list, description="List of commits")
    count: int = Field(..., description="Number of commits returned")


class GitBranchListOutput(BaseModel):
    """Output schema for listing branches."""

    current: str = Field(..., description="Current branch name")
    local: list[str] = Field(default_factory=list, description="Local branch names")
    remote: list[str] = Field(default_factory=list, description="Remote branch names")


class GitBranchCreateInput(BaseModel):
    """Input schema for creating a branch."""

    name: str = Field(
        ...,
        description="Name for the new branch",
        min_length=1,
        max_length=100,
    )
    checkout: bool = Field(
        default=True,
        description="Switch to the new branch after creating it",
    )


class GitBranchCreateOutput(BaseModel):
    """Output schema for creating a branch."""

    name: str = Field(..., description="Created branch name")
    checked_out: bool = Field(..., description="Whether the branch was checked out")


class GitCheckoutInput(BaseModel):
    """Input schema for git checkout."""

    branch: str = Field(
        ...,
        description="Branch name to checkout",
    )


class GitCheckoutOutput(BaseModel):
    """Output schema for git checkout."""

    previous_branch: str = Field(..., description="Previous branch name")
    current_branch: str = Field(..., description="Current branch name after checkout")


# =============================================================================
# Common Response Schemas
# =============================================================================


class ToolSuccess(BaseModel):
    """Generic success response."""

    success: bool = Field(default=True, description="Operation succeeded")
    message: str = Field(..., description="Success message")
    data: dict[str, Any] = Field(default_factory=dict, description="Additional data")


class ToolError(BaseModel):
    """Generic error response."""

    success: bool = Field(default=False, description="Operation failed")
    error: str = Field(..., description="Error message")
    error_type: str = Field(..., description="Error type name")
    details: dict[str, Any] = Field(default_factory=dict, description="Error details")


# =============================================================================
# Database Schemas (Phase 2 - placeholders)
# =============================================================================


class DatabaseType(str, Enum):
    """Supported database types."""

    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MSSQL = "mssql"


class ConnectionConfig(BaseModel):
    """Database connection configuration."""

    database_type: DatabaseType = Field(..., description="Type of database")
    host: str = Field(..., description="Database host")
    port: int = Field(..., description="Database port")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Database username")
    # Password handled separately for security


class QueryResult(BaseModel):
    """Result of a database query."""

    columns: list[str] = Field(default_factory=list, description="Column names")
    rows: list[list[Any]] = Field(default_factory=list, description="Result rows")
    row_count: int = Field(..., description="Number of rows returned")
    execution_time_ms: float = Field(..., description="Query execution time in ms")


class TableSchema(BaseModel):
    """Schema information for a database table."""

    name: str = Field(..., description="Table name")
    db_schema: str = Field(default="public", description="Database schema name")
    columns: list[dict[str, Any]] = Field(default_factory=list, description="Column definitions")
    primary_key: list[str] = Field(default_factory=list, description="Primary key columns")
    foreign_keys: list[dict[str, Any]] = Field(
        default_factory=list, description="Foreign key constraints"
    )


# =============================================================================
# Execution Schemas (Phase 3 - placeholders)
# =============================================================================


class ExecutionResult(BaseModel):
    """Result of code execution."""

    stdout: str = Field(default="", description="Standard output")
    stderr: str = Field(default="", description="Standard error")
    exit_code: int = Field(..., description="Process exit code")
    duration_ms: float = Field(..., description="Execution duration in ms")
    timed_out: bool = Field(default=False, description="Whether execution timed out")


class TestResult(BaseModel):
    """Result of running tests."""

    passed: int = Field(default=0, description="Number of tests passed")
    failed: int = Field(default=0, description="Number of tests failed")
    skipped: int = Field(default=0, description="Number of tests skipped")
    errors: int = Field(default=0, description="Number of test errors")
    duration_ms: float = Field(..., description="Total test duration in ms")
    output: str = Field(default="", description="Test output")
    failures: list[dict[str, Any]] = Field(
        default_factory=list, description="Details of failed tests"
    )


class LintResult(BaseModel):
    """Result of running a linter."""

    issues: list[dict[str, Any]] = Field(default_factory=list, description="Lint issues found")
    error_count: int = Field(default=0, description="Number of errors")
    warning_count: int = Field(default=0, description="Number of warnings")
    files_checked: int = Field(..., description="Number of files checked")


class TypeCheckResult(BaseModel):
    """Result of running type checker."""

    errors: list[dict[str, Any]] = Field(default_factory=list, description="Type errors found")
    error_count: int = Field(default=0, description="Number of type errors")
    files_checked: int = Field(..., description="Number of files checked")
    success: bool = Field(..., description="Whether type check passed")
