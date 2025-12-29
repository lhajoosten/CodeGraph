"""Type checking tools for agents.

Provides tools for running mypy to check Python type annotations
and catch type-related bugs.
"""

import asyncio
import re
import time
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, ToolExecutionError
from src.tools.schemas import TypeCheckResult

logger = get_logger(__name__)

# Default timeout for type checking
DEFAULT_TIMEOUT = 120  # Type checking can be slow


def _parse_mypy_output(output: str) -> list[dict[str, str | int]]:
    """Parse mypy output to extract type errors.

    Args:
        output: Raw mypy output

    Returns:
        List of error dictionaries
    """
    errors = []

    # Mypy format: file.py:line: error: message [error-code]
    # or: file.py:line:col: error: message [error-code]
    pattern = r"([^:]+):(\d+)(?::(\d+))?: (error|note|warning): (.+?)(?:\s+\[([^\]]+)\])?$"

    for line in output.strip().split("\n"):
        match = re.match(pattern, line)
        if match:
            error = {
                "file": match.group(1),
                "line": int(match.group(2)),
                "severity": match.group(4),
                "message": match.group(5),
            }
            if match.group(3):
                error["column"] = int(match.group(3))
            if match.group(6):
                error["code"] = match.group(6)
            errors.append(error)

    return errors


def _count_errors(errors: list[dict[str, str | int]]) -> int:
    """Count actual errors (not notes or warnings).

    Args:
        errors: List of error dictionaries

    Returns:
        Count of errors
    """
    return sum(1 for e in errors if e.get("severity") == "error")


@tool
async def run_mypy(
    path: str = ".",
    strict: bool = False,
    timeout: int = DEFAULT_TIMEOUT,
    extra_args: list[str] | None = None,
) -> str:
    """Run mypy type checker on Python code.

    This tool runs mypy to check Python type annotations and catch
    type-related bugs before runtime.

    Args:
        path: Path to file or directory to check (default: current directory).
        strict: Whether to run in strict mode (default: False).
        timeout: Maximum execution time in seconds (default: 120, max: 300).
        extra_args: Additional mypy arguments (e.g., ["--ignore-missing-imports"]).

    Returns:
        Formatted string with type check results including:
        - Summary of errors found
        - List of type errors with file, line, and message
        - Success/failure status

    Raises:
        ToolExecutionError: If path doesn't exist or mypy fails to run
        ExecutionTimeoutError: If type checking times out

    Example:
        run_mypy("src/")
        run_mypy("src/main.py", strict=True)
        run_mypy("src/", extra_args=["--ignore-missing-imports"])
    """
    check_path = Path(path)

    if not check_path.exists():
        raise ToolExecutionError(
            f"Path does not exist: {path}",
            details={"path": path},
        )

    # Clamp timeout
    timeout = min(max(timeout, 10), 300)

    # Build mypy command
    cmd = ["mypy", str(check_path)]

    if strict:
        cmd.append("--strict")

    # Add useful defaults
    cmd.extend(
        [
            "--no-error-summary",  # We'll generate our own summary
            "--show-column-numbers",
            "--show-error-codes",
        ]
    )

    if extra_args:
        cmd.extend(extra_args)

    logger.info(
        "run_mypy_started",
        path=path,
        strict=strict,
        timeout=timeout,
    )

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,  # Merge stderr
        )

        try:
            stdout, _ = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
            timed_out = False

        except TimeoutError:
            process.kill()
            await process.wait()
            timed_out = True
            stdout = b"Type checking timed out"

        duration_ms = (time.time() - start_time) * 1000
        output = stdout.decode(errors="replace")

        # Parse errors
        errors = _parse_mypy_output(output)
        error_count = _count_errors(errors)

        # Count files (from "Found X source files" or estimate)
        files_match = re.search(r"Found (\d+) source files?", output)
        files_checked = (
            int(files_match.group(1)) if files_match else len({e.get("file", "") for e in errors})
        )
        if not files_checked and check_path.is_file():
            files_checked = 1

        # Success if exit code is 0 or no errors found
        success = process.returncode == 0 or error_count == 0

        # Format output
        lines = ["=" * 60]
        lines.append("MYPY TYPE CHECK RESULTS")
        lines.append("=" * 60)
        lines.append("")

        if success and error_count == 0:
            lines.append("✓ No type errors found!")
            if "Success" in output:
                lines.append(output.strip())
        else:
            lines.append(f"✗ Found {error_count} type error(s)")
            lines.append("")

            # Group errors by file
            by_file: dict[str, list[dict[str, str | int]]] = {}
            for error in errors:
                if error.get("severity") != "error":
                    continue
                file = str(error.get("file", "unknown"))
                if file not in by_file:
                    by_file[file] = []
                by_file[file].append(error)

            for file, file_errors in list(by_file.items())[:10]:  # Limit files
                lines.append(f"{file}:")
                for error in file_errors[:5]:  # Limit errors per file
                    line_num = error.get("line", 0)
                    col = error.get("column", "")
                    col_str = f":{col}" if col else ""
                    code = error.get("code", "")
                    code_str = f" [{code}]" if code else ""
                    msg = error.get("message", "")
                    lines.append(f"  {line_num}{col_str}: {msg}{code_str}")
                if len(file_errors) > 5:
                    lines.append(f"  ... and {len(file_errors) - 5} more errors")
                lines.append("")

            if len(by_file) > 10:
                lines.append(f"... and {len(by_file) - 10} more files with errors")

        lines.append("")
        lines.append(f"Files checked: {files_checked}")
        lines.append(f"Duration: {duration_ms / 1000:.2f}s")

        if strict:
            lines.append("Mode: strict")

        if timed_out:
            lines.append("WARNING: Type checking timed out")

        logger.info(
            "run_mypy_completed",
            path=path,
            error_count=error_count,
            success=success,
            duration_ms=duration_ms,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_mypy",
        ) from e
    except FileNotFoundError as e:
        raise ToolExecutionError(
            "mypy not found. Please ensure mypy is installed: pip install mypy",
            details={"path": path},
        ) from e
    except Exception as e:
        logger.error(
            "run_mypy_failed",
            path=path,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Type checking failed: {e}",
            details={"path": path},
        ) from e


async def get_type_check_result(
    path: str,
    strict: bool = False,
    timeout: int = DEFAULT_TIMEOUT,
) -> TypeCheckResult:
    """Get structured type check results.

    Helper function (not a tool) that returns a TypeCheckResult object
    for programmatic use.

    Args:
        path: Path to check
        strict: Whether to use strict mode
        timeout: Maximum execution time

    Returns:
        TypeCheckResult with structured data
    """
    check_path = Path(path)

    if not check_path.exists():
        raise ToolExecutionError(
            f"Path does not exist: {path}",
            details={"path": path},
        )

    cmd = [
        "mypy",
        str(check_path),
        "--no-error-summary",
        "--show-column-numbers",
        "--show-error-codes",
    ]

    if strict:
        cmd.append("--strict")

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )

    stdout, _ = await asyncio.wait_for(
        process.communicate(),
        timeout=timeout,
    )

    output = stdout.decode(errors="replace")
    errors = _parse_mypy_output(output)
    error_count = _count_errors(errors)

    files_match = re.search(r"Found (\d+) source files?", output)
    files_checked = (
        int(files_match.group(1)) if files_match else len({e.get("file", "") for e in errors})
    )

    success = process.returncode == 0 or error_count == 0

    return TypeCheckResult(
        errors=errors,
        error_count=error_count,
        files_checked=files_checked,
        success=success,
    )
