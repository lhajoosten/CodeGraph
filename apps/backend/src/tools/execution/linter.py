"""Linting tools for agents.

Provides tools for running ruff and black to check and format
Python code quality.
"""

import asyncio
import re
import time
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, ToolExecutionError
from src.tools.schemas import LintResult

logger = get_logger(__name__)

# Default timeout for linting
DEFAULT_TIMEOUT = 60


def _parse_ruff_output(output: str) -> list[dict[str, str | int]]:
    """Parse ruff output to extract issues.

    Args:
        output: Raw ruff output

    Returns:
        List of issue dictionaries
    """
    issues = []

    # Ruff format: file.py:line:col: CODE message
    pattern = r"([^:]+):(\d+):(\d+):\s*([A-Z]\d+)\s+(.+)"

    for line in output.strip().split("\n"):
        match = re.match(pattern, line)
        if match:
            issues.append(
                {
                    "file": match.group(1),
                    "line": int(match.group(2)),
                    "column": int(match.group(3)),
                    "code": match.group(4),
                    "message": match.group(5),
                }
            )

    return issues


def _categorize_issues(issues: list[dict[str, str | int]]) -> tuple[int, int]:
    """Categorize issues into errors and warnings.

    Args:
        issues: List of issue dictionaries

    Returns:
        Tuple of (error_count, warning_count)
    """
    errors = 0
    warnings = 0

    for issue in issues:
        code = str(issue.get("code", ""))
        # E and F codes are errors, others are warnings
        if code.startswith(("E", "F")):
            errors += 1
        else:
            warnings += 1

    return errors, warnings


@tool
async def run_ruff(
    path: str = ".",
    fix: bool = False,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """Run ruff linter on Python code.

    This tool runs ruff to check Python code for linting issues,
    style violations, and potential bugs.

    Args:
        path: Path to file or directory to lint (default: current directory).
        fix: Whether to automatically fix issues (default: False).
        timeout: Maximum execution time in seconds (default: 60, max: 120).

    Returns:
        Formatted string with lint results including:
        - Summary of errors and warnings
        - List of issues found with file, line, and message
        - Total files checked

    Raises:
        ToolExecutionError: If path doesn't exist or ruff fails to run
        ExecutionTimeoutError: If linting times out

    Example:
        run_ruff("src/")
        run_ruff("src/api/", fix=True)
        run_ruff("src/main.py")
    """
    lint_path = Path(path)

    if not lint_path.exists():
        raise ToolExecutionError(
            f"Path does not exist: {path}",
            details={"path": path},
        )

    # Clamp timeout
    timeout = min(max(timeout, 5), 120)

    # Build ruff command
    cmd = ["ruff", "check", str(lint_path)]

    if fix:
        cmd.append("--fix")

    # Add format for better parsing
    cmd.extend(["--output-format", "text"])

    logger.info(
        "run_ruff_started",
        path=path,
        fix=fix,
        timeout=timeout,
    )

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
            timed_out = False

        except TimeoutError:
            process.kill()
            await process.wait()
            timed_out = True
            stdout = b""
            stderr = b"Linting timed out"

        duration_ms = (time.time() - start_time) * 1000
        output = stdout.decode(errors="replace")
        error_output = stderr.decode(errors="replace")

        # Parse issues
        issues = _parse_ruff_output(output)
        error_count, warning_count = _categorize_issues(issues)

        # Count unique files
        files_checked = len({i.get("file", "") for i in issues})
        if not issues:
            # If no issues, estimate files from path
            if lint_path.is_file():
                files_checked = 1
            else:
                files_checked = len(list(lint_path.rglob("*.py")))

        # Format output
        lines = ["=" * 60]
        lines.append("RUFF LINT RESULTS")
        lines.append("=" * 60)
        lines.append("")

        if not issues:
            lines.append("✓ No issues found!")
        else:
            lines.append(f"Found {len(issues)} issue(s):")
            lines.append(f"  • Errors:   {error_count}")
            lines.append(f"  • Warnings: {warning_count}")
            lines.append("")

            # Group by file
            by_file: dict[str, list[dict[str, str | int]]] = {}
            for issue in issues:
                file = str(issue.get("file", "unknown"))
                if file not in by_file:
                    by_file[file] = []
                by_file[file].append(issue)

            for file, file_issues in list(by_file.items())[:10]:  # Limit files shown
                lines.append(f"{file}:")
                for issue in file_issues[:5]:  # Limit issues per file
                    line_num = issue.get("line", 0)
                    code = issue.get("code", "")
                    msg = issue.get("message", "")
                    lines.append(f"  {line_num}: {code} {msg}")
                if len(file_issues) > 5:
                    lines.append(f"  ... and {len(file_issues) - 5} more issues")
                lines.append("")

            if len(by_file) > 10:
                lines.append(f"... and {len(by_file) - 10} more files with issues")

        lines.append("")
        lines.append(f"Files checked: {files_checked}")
        lines.append(f"Duration: {duration_ms:.0f}ms")

        if fix:
            lines.append("")
            lines.append("Note: --fix was applied, some issues may have been auto-fixed")

        if timed_out:
            lines.append("WARNING: Linting timed out")

        if error_output and "error" in error_output.lower():
            lines.append("")
            lines.append(f"Errors: {error_output[:200]}")

        logger.info(
            "run_ruff_completed",
            path=path,
            issues=len(issues),
            duration_ms=duration_ms,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_ruff",
        ) from e
    except FileNotFoundError as e:
        raise ToolExecutionError(
            "ruff not found. Please ensure ruff is installed: pip install ruff",
            details={"path": path},
        ) from e
    except Exception as e:
        logger.error(
            "run_ruff_failed",
            path=path,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Ruff linting failed: {e}",
            details={"path": path},
        ) from e


@tool
async def run_black_check(
    path: str = ".",
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """Check Python code formatting with black.

    This tool runs black in check mode to verify if Python code
    is properly formatted without making changes.

    Args:
        path: Path to file or directory to check (default: current directory).
        timeout: Maximum execution time in seconds (default: 60, max: 120).

    Returns:
        Formatted string with format check results including:
        - List of files that would be reformatted
        - Count of files checked
        - Whether all files are properly formatted

    Raises:
        ToolExecutionError: If path doesn't exist or black fails to run
        ExecutionTimeoutError: If formatting check times out

    Example:
        run_black_check("src/")
        run_black_check("src/main.py")
    """
    check_path = Path(path)

    if not check_path.exists():
        raise ToolExecutionError(
            f"Path does not exist: {path}",
            details={"path": path},
        )

    # Clamp timeout
    timeout = min(max(timeout, 5), 120)

    # Build black command (check mode)
    cmd = ["black", "--check", "--diff", str(check_path)]

    logger.info(
        "run_black_check_started",
        path=path,
        timeout=timeout,
    )

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
            timed_out = False

        except TimeoutError:
            process.kill()
            await process.wait()
            timed_out = True
            stdout = b""
            stderr = b"Format check timed out"

        duration_ms = (time.time() - start_time) * 1000
        output = stdout.decode(errors="replace")
        error_output = stderr.decode(errors="replace")

        # Parse which files would be changed
        would_change = []
        pattern = r"would reformat ([^\n]+)"
        for match in re.finditer(pattern, error_output):
            would_change.append(match.group(1))

        # Count files unchanged
        unchanged_match = re.search(r"(\d+) files? would be left unchanged", error_output)
        files_unchanged = int(unchanged_match.group(1)) if unchanged_match else 0

        # Check if all files are formatted
        success = process.returncode == 0

        # Format output
        lines = ["=" * 60]
        lines.append("BLACK FORMAT CHECK")
        lines.append("=" * 60)
        lines.append("")

        if success:
            lines.append("✓ All files are properly formatted!")
        else:
            lines.append(f"✗ {len(would_change)} file(s) would be reformatted:")
            lines.append("")
            for file in would_change[:20]:  # Limit files shown
                lines.append(f"  • {file}")
            if len(would_change) > 20:
                lines.append(f"  ... and {len(would_change) - 20} more files")

        lines.append("")
        if files_unchanged:
            lines.append(f"Files unchanged: {files_unchanged}")
        lines.append(f"Duration: {duration_ms:.0f}ms")

        if timed_out:
            lines.append("WARNING: Format check timed out")

        # Show diff preview if available
        if output and not success:
            lines.append("")
            lines.append("Diff preview (first 500 chars):")
            lines.append("-" * 40)
            lines.append(output[:500])
            if len(output) > 500:
                lines.append("... (truncated)")

        logger.info(
            "run_black_check_completed",
            path=path,
            would_change=len(would_change),
            success=success,
            duration_ms=duration_ms,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_black_check",
        ) from e
    except FileNotFoundError as e:
        raise ToolExecutionError(
            "black not found. Please ensure black is installed: pip install black",
            details={"path": path},
        ) from e
    except Exception as e:
        logger.error(
            "run_black_check_failed",
            path=path,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Black format check failed: {e}",
            details={"path": path},
        ) from e


async def get_lint_result(path: str, timeout: int = DEFAULT_TIMEOUT) -> LintResult:
    """Get structured lint results.

    Helper function (not a tool) that returns a LintResult object
    for programmatic use.

    Args:
        path: Path to lint
        timeout: Maximum execution time

    Returns:
        LintResult with structured data
    """
    lint_path = Path(path)

    if not lint_path.exists():
        raise ToolExecutionError(
            f"Path does not exist: {path}",
            details={"path": path},
        )

    cmd = ["ruff", "check", str(lint_path), "--output-format", "text"]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, _ = await asyncio.wait_for(
        process.communicate(),
        timeout=timeout,
    )

    output = stdout.decode(errors="replace")
    issues = _parse_ruff_output(output)
    error_count, warning_count = _categorize_issues(issues)

    files_checked = len({i.get("file", "") for i in issues})
    if not issues and lint_path.is_file():
        files_checked = 1

    return LintResult(
        issues=issues,
        error_count=error_count,
        warning_count=warning_count,
        files_checked=files_checked,
    )
