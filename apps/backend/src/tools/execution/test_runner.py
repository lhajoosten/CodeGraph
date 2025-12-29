"""Test execution tools for agents.

Provides tools for running pytest and parsing test results
to help agents verify their code changes.
"""

import asyncio
import re
import time
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, ToolExecutionError
from src.tools.schemas import TestResult

logger = get_logger(__name__)

# Default timeout for test execution
DEFAULT_TIMEOUT = 120  # Tests can take longer


def _parse_pytest_output(output: str) -> dict[str, int]:
    """Parse pytest output to extract test counts.

    Args:
        output: Raw pytest output

    Returns:
        Dictionary with passed, failed, skipped, errors counts
    """
    result = {
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "errors": 0,
    }

    # Match patterns like "5 passed", "2 failed", "1 skipped", "3 errors"
    patterns = [
        (r"(\d+)\s+passed", "passed"),
        (r"(\d+)\s+failed", "failed"),
        (r"(\d+)\s+skipped", "skipped"),
        (r"(\d+)\s+error", "errors"),
        (r"(\d+)\s+warning", "warnings"),
    ]

    for pattern, key in patterns:
        match = re.search(pattern, output)
        if match:
            result[key] = int(match.group(1))

    return result


def _extract_failures(output: str) -> list[dict[str, str]]:
    """Extract failure details from pytest output.

    Args:
        output: Raw pytest output

    Returns:
        List of failure dictionaries with test name and message
    """
    failures = []

    # Match FAILED test lines
    failed_pattern = r"FAILED\s+([^\s]+)(?:\s*-\s*(.+))?"
    for match in re.finditer(failed_pattern, output):
        test_name = match.group(1)
        message = match.group(2) or ""
        failures.append(
            {
                "test": test_name,
                "message": message.strip(),
            }
        )

    # Match ERROR test lines
    error_pattern = r"ERROR\s+([^\s]+)(?:\s*-\s*(.+))?"
    for match in re.finditer(error_pattern, output):
        test_name = match.group(1)
        message = match.group(2) or ""
        failures.append(
            {
                "test": test_name,
                "message": message.strip(),
                "type": "error",
            }
        )

    return failures


@tool
async def run_pytest(
    path: str = ".",
    pattern: str | None = None,
    verbose: bool = True,
    timeout: int = DEFAULT_TIMEOUT,
    extra_args: list[str] | None = None,
) -> str:
    """Run pytest tests and return the results.

    This tool runs pytest on the specified path and returns a formatted
    summary of test results including pass/fail counts and failure details.

    Args:
        path: Path to test file or directory (default: current directory).
        pattern: Optional pattern to filter tests (e.g., "test_auth" or "-k auth").
        verbose: Whether to run in verbose mode (default: True).
        timeout: Maximum execution time in seconds (default: 120, max: 300).
        extra_args: Additional pytest arguments (e.g., ["--tb=short", "-x"]).

    Returns:
        Formatted string with test results including:
        - Summary of passed/failed/skipped tests
        - Details of any failures
        - Total execution time

    Raises:
        ToolExecutionError: If path doesn't exist or pytest fails to run
        ExecutionTimeoutError: If test execution times out

    Example:
        run_pytest("tests/unit/")
        run_pytest("tests/", pattern="test_auth")
        run_pytest("tests/test_api.py", extra_args=["--tb=short", "-x"])
    """
    test_path = Path(path)

    # Validate path exists
    if not test_path.exists():
        raise ToolExecutionError(
            f"Test path does not exist: {path}",
            details={"path": path},
        )

    # Clamp timeout
    timeout = min(max(timeout, 10), 300)

    # Build pytest command
    cmd = ["pytest", str(test_path)]

    if verbose:
        cmd.append("-v")

    if pattern:
        if pattern.startswith("-k"):
            cmd.append(pattern)
        else:
            cmd.extend(["-k", pattern])

    if extra_args:
        cmd.extend(extra_args)

    # Add color output (helps with parsing)
    cmd.append("--color=no")

    logger.info(
        "run_pytest_started",
        path=path,
        pattern=pattern,
        timeout=timeout,
    )

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,  # Merge stderr into stdout
            cwd=test_path.parent if test_path.is_file() else None,
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
            stdout = b"Test execution timed out"

        duration_ms = (time.time() - start_time) * 1000
        output = stdout.decode(errors="replace")

        # Parse results
        counts = _parse_pytest_output(output)
        failures = _extract_failures(output)

        # Build result
        result = TestResult(
            passed=counts.get("passed", 0),
            failed=counts.get("failed", 0),
            skipped=counts.get("skipped", 0),
            errors=counts.get("errors", 0),
            duration_ms=duration_ms,
            output=output,
            failures=failures,
        )

        # Format output
        lines = ["=" * 60]
        lines.append("TEST RESULTS")
        lines.append("=" * 60)
        lines.append("")

        # Summary
        total = result.passed + result.failed + result.skipped + result.errors
        lines.append(f"Total tests: {total}")
        lines.append(f"  ✓ Passed:  {result.passed}")
        lines.append(f"  ✗ Failed:  {result.failed}")
        lines.append(f"  ○ Skipped: {result.skipped}")
        lines.append(f"  ! Errors:  {result.errors}")
        lines.append("")

        # Failure details
        if failures:
            lines.append("FAILURES:")
            lines.append("-" * 40)
            for failure in failures[:10]:  # Limit to 10 failures
                lines.append(f"  • {failure['test']}")
                if failure.get("message"):
                    lines.append(f"    {failure['message']}")
            if len(failures) > 10:
                lines.append(f"  ... and {len(failures) - 10} more failures")
            lines.append("")

        lines.append(f"Duration: {duration_ms / 1000:.2f}s")

        if timed_out:
            lines.append("WARNING: Test execution timed out")

        # Status
        lines.append("")
        if result.failed == 0 and result.errors == 0:
            lines.append("✓ All tests passed!")
        else:
            lines.append("✗ Some tests failed")

        logger.info(
            "run_pytest_completed",
            path=path,
            passed=result.passed,
            failed=result.failed,
            duration_ms=duration_ms,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_pytest",
        ) from e
    except FileNotFoundError as e:
        raise ToolExecutionError(
            "pytest not found. Please ensure pytest is installed.",
            details={"path": path},
        ) from e
    except Exception as e:
        logger.error(
            "run_pytest_failed",
            path=path,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Test execution failed: {e}",
            details={"path": path},
        ) from e


async def run_pytest_json(
    path: str = ".",
    pattern: str | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> TestResult:
    """Run pytest and return structured results.

    This is a helper function (not a tool) that returns a TestResult
    object for programmatic use.

    Args:
        path: Path to test file or directory
        pattern: Optional pattern to filter tests
        timeout: Maximum execution time in seconds

    Returns:
        TestResult with structured test data
    """
    test_path = Path(path)

    if not test_path.exists():
        raise ToolExecutionError(
            f"Test path does not exist: {path}",
            details={"path": path},
        )

    # Build pytest command with JSON output
    cmd = [
        "pytest",
        str(test_path),
        "--tb=short",
        "--color=no",
        "-q",
    ]

    if pattern:
        cmd.extend(["-k", pattern])

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        stdout, _ = await asyncio.wait_for(
            process.communicate(),
            timeout=timeout,
        )

        duration_ms = (time.time() - start_time) * 1000
        output = stdout.decode(errors="replace")

        counts = _parse_pytest_output(output)
        failures = _extract_failures(output)

        return TestResult(
            passed=counts.get("passed", 0),
            failed=counts.get("failed", 0),
            skipped=counts.get("skipped", 0),
            errors=counts.get("errors", 0),
            duration_ms=duration_ms,
            output=output,
            failures=failures,
        )

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_pytest_json",
        ) from e
