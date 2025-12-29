"""Content search tools for agents.

Provides tools for searching files by pattern and searching
content within files using regex patterns.
"""

import fnmatch
import re
from pathlib import Path
from typing import Any

import aiofiles
from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.base import get_current_context
from src.tools.exceptions import ToolExecutionError
from src.tools.security.path_validator import validate_path

logger = get_logger(__name__)


@tool
async def search_files(
    pattern: str,
    path: str = ".",
    max_results: int = 100,
) -> str:
    """Search for files matching a glob pattern.

    Args:
        pattern: Glob pattern to match files.
                Examples: "*.py", "src/**/*.ts", "test_*.py"
        path: Starting directory for search (relative to workspace).
              Defaults to "." (workspace root).
        max_results: Maximum number of results to return (1-1000).
                    Defaults to 100.

    Returns:
        A list of matching file paths, one per line.

    Raises:
        PathValidationError: If the path is invalid or outside workspace
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Validate the starting path
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
        "file_search_started",
        pattern=pattern,
        path=path,
        task_id=context.task_id,
    )

    try:
        matches: list[str] = []
        truncated = False

        # Handle recursive patterns
        if "**" in pattern:
            # Use rglob for recursive patterns
            glob_pattern = pattern
            for item in full_path.rglob("*"):
                if len(matches) >= max_results:
                    truncated = True
                    break

                if item.is_file():
                    rel_path = str(item.relative_to(workspace))
                    if fnmatch.fnmatch(rel_path, glob_pattern) or fnmatch.fnmatch(
                        item.name, pattern.split("/")[-1]
                    ):
                        # Skip hidden files and common ignore patterns
                        if not any(
                            part.startswith(".")
                            for part in rel_path.split("/")
                            if part not in (".", "..")
                        ):
                            matches.append(rel_path)
        else:
            # Use glob for non-recursive patterns
            for item in full_path.glob(pattern):
                if len(matches) >= max_results:
                    truncated = True
                    break

                if item.is_file():
                    rel_path = str(item.relative_to(workspace))
                    # Skip hidden files
                    if not any(
                        part.startswith(".")
                        for part in rel_path.split("/")
                        if part not in (".", "..")
                    ):
                        matches.append(rel_path)

        # Sort matches
        matches.sort()

        logger.info(
            "file_search_completed",
            pattern=pattern,
            match_count=len(matches),
            truncated=truncated,
        )

        # Format output
        if not matches:
            return f"No files found matching pattern: {pattern}"

        lines = [f"Found {len(matches)} file(s) matching '{pattern}':"]
        if truncated:
            lines[0] += f" (truncated to {max_results})"

        lines.append("")
        for match in matches:
            lines.append(match)

        return "\n".join(lines)

    except Exception as e:
        logger.error(
            "file_search_failed",
            pattern=pattern,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to search files: {e}",
            details={"pattern": pattern, "path": path},
        ) from e


@tool
async def grep_content(
    pattern: str,
    path: str = ".",
    file_pattern: str = "*",
    max_results: int = 50,
    context_lines: int = 2,
) -> str:
    """Search for content in files using a regex pattern.

    Args:
        pattern: Regex pattern to search for in file contents.
                Example: "def .*\\(", "import.*requests"
        path: Starting directory for search (relative to workspace).
              Defaults to "." (workspace root).
        file_pattern: Glob pattern for files to search in.
                     Defaults to "*" (all files).
        max_results: Maximum number of matches to return (1-500).
                    Defaults to 50.
        context_lines: Number of lines to show before/after each match (0-10).
                      Defaults to 2.

    Returns:
        Formatted search results with file paths, line numbers, and context.

    Raises:
        ToolExecutionError: If the regex pattern is invalid
    """
    context = get_current_context()
    if context is None:
        raise ToolExecutionError("No execution context available")

    # Validate the starting path
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

    # Compile regex pattern
    try:
        regex = re.compile(pattern)
    except re.error as e:
        raise ToolExecutionError(
            f"Invalid regex pattern: {e}",
            details={"pattern": pattern},
        ) from e

    logger.info(
        "grep_search_started",
        pattern=pattern,
        path=path,
        file_pattern=file_pattern,
        task_id=context.task_id,
    )

    try:
        matches: list[dict[str, Any]] = []
        files_searched = 0
        truncated = False

        # Determine file extensions to skip
        skip_extensions = {
            ".pyc",
            ".pyo",
            ".so",
            ".o",
            ".a",
            ".exe",
            ".dll",
            ".bin",
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".ico",
            ".pdf",
            ".zip",
            ".tar",
            ".gz",
            ".woff",
            ".woff2",
            ".ttf",
            ".eot",
        }

        # Get files to search
        if "**" in file_pattern:
            files_to_search = list(full_path.rglob(file_pattern.replace("**", "*")))
        else:
            files_to_search = list(full_path.rglob(file_pattern))

        for file_path in files_to_search:
            if len(matches) >= max_results:
                truncated = True
                break

            if not file_path.is_file():
                continue

            # Skip binary files
            if file_path.suffix.lower() in skip_extensions:
                continue

            # Skip hidden files and directories
            rel_path = str(file_path.relative_to(workspace))
            if any(part.startswith(".") for part in rel_path.split("/") if part not in (".", "..")):
                continue

            files_searched += 1

            try:
                async with aiofiles.open(file_path, encoding="utf-8") as f:
                    lines = await f.readlines()

                for line_num, line in enumerate(lines, 1):
                    if len(matches) >= max_results:
                        truncated = True
                        break

                    if regex.search(line):
                        # Get context lines
                        start = max(0, line_num - 1 - context_lines)
                        end = min(len(lines), line_num + context_lines)

                        context_before = [lines[i].rstrip() for i in range(start, line_num - 1)]
                        context_after = [lines[i].rstrip() for i in range(line_num, end)]

                        matches.append(
                            {
                                "file": rel_path,
                                "line_number": line_num,
                                "line": line.rstrip(),
                                "context_before": context_before,
                                "context_after": context_after,
                            }
                        )

            except (UnicodeDecodeError, PermissionError):
                # Skip files that can't be read
                continue

        logger.info(
            "grep_search_completed",
            pattern=pattern,
            match_count=len(matches),
            files_searched=files_searched,
            truncated=truncated,
        )

        # Format output
        if not matches:
            return f"No matches found for pattern: {pattern}\n(Searched {files_searched} files)"

        lines = [f"Found {len(matches)} match(es) for '{pattern}':"]
        if truncated:
            lines[0] += f" (truncated to {max_results})"
        lines.append(f"Searched {files_searched} files")
        lines.append("")

        current_file = None
        for match in matches:
            if match["file"] != current_file:
                current_file = match["file"]
                lines.append(f"\n{current_file}:")

            # Show context before
            for ctx_line in match["context_before"]:
                lines.append(f"  {ctx_line}")

            # Show matching line with line number
            lines.append(f"> {match['line_number']}: {match['line']}")

            # Show context after
            for ctx_line in match["context_after"]:
                lines.append(f"  {ctx_line}")

        return "\n".join(lines)

    except Exception as e:
        logger.error(
            "grep_search_failed",
            pattern=pattern,
            error=str(e),
            exc_info=True,
        )
        raise ToolExecutionError(
            f"Failed to search content: {e}",
            details={"pattern": pattern, "path": path},
        ) from e
