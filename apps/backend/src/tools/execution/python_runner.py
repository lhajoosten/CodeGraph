"""Python code execution tools for agents.

Provides tools for running Python code either directly or
in a sandboxed Docker container for security.
"""

import asyncio
import os
import tempfile
import time
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, ToolExecutionError
from src.tools.schemas import ExecutionResult, ResourceLimits

logger = get_logger(__name__)

# Maximum code length to prevent resource exhaustion
MAX_CODE_LENGTH = 100_000  # 100KB

# Default timeout for Python execution
DEFAULT_TIMEOUT = 30


def _validate_code(code: str) -> None:
    """Validate Python code before execution.

    Args:
        code: Python code to validate

    Raises:
        ToolExecutionError: If code is invalid or too long
    """
    if not code or not code.strip():
        raise ToolExecutionError(
            "Empty code provided",
            details={"reason": "code_empty"},
        )

    if len(code) > MAX_CODE_LENGTH:
        raise ToolExecutionError(
            f"Code exceeds maximum length of {MAX_CODE_LENGTH} characters",
            details={"code_length": len(code), "max_length": MAX_CODE_LENGTH},
        )


async def _run_python_subprocess(
    code: str,
    working_dir: str | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    env: dict[str, str] | None = None,
) -> ExecutionResult:
    """Run Python code in a subprocess.

    Args:
        code: Python code to execute
        working_dir: Working directory for execution
        timeout: Maximum execution time in seconds
        env: Environment variables to set

    Returns:
        ExecutionResult with stdout, stderr, exit code

    Raises:
        ExecutionTimeoutError: If execution times out
    """
    start_time = time.time()

    # Prepare environment
    process_env = os.environ.copy()
    if env:
        process_env.update(env)

    # Create a temporary file for the code
    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".py",
        delete=False,
    ) as f:
        f.write(code)
        temp_file = f.name

    try:
        # Run Python with the temp file
        process = await asyncio.create_subprocess_exec(
            "python",
            temp_file,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=working_dir,
            env=process_env,
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
            stderr = b"Execution timed out"

        duration_ms = (time.time() - start_time) * 1000

        return ExecutionResult(
            stdout=stdout.decode(errors="replace"),
            stderr=stderr.decode(errors="replace"),
            exit_code=process.returncode or 0,
            duration_ms=duration_ms,
            timed_out=timed_out,
        )

    finally:
        # Clean up temp file
        try:
            os.unlink(temp_file)
        except OSError:
            pass


@tool
async def run_python(
    code: str,
    timeout: int = DEFAULT_TIMEOUT,
    working_dir: str | None = None,
) -> str:
    """Execute Python code and return the output.

    This tool runs Python code in a subprocess with the specified timeout.
    Use for running small code snippets, testing logic, or data processing.

    Args:
        code: Python code to execute. Must be valid Python 3.12 syntax.
        timeout: Maximum execution time in seconds (default: 30, max: 120).
        working_dir: Optional working directory for execution.

    Returns:
        Formatted string with execution results including stdout, stderr,
        exit code, and execution time.

    Raises:
        ToolExecutionError: If code is empty or too long
        ExecutionTimeoutError: If execution times out

    Example:
        run_python('''
        import math
        print(f"Pi is approximately {math.pi:.4f}")
        for i in range(3):
            print(f"Square of {i}: {i**2}")
        ''')
    """
    _validate_code(code)

    # Clamp timeout
    timeout = min(max(timeout, 1), 120)

    logger.info(
        "run_python_started",
        code_length=len(code),
        timeout=timeout,
    )

    try:
        result = await _run_python_subprocess(
            code=code,
            working_dir=working_dir,
            timeout=timeout,
        )

        # Format output
        lines = []

        if result.stdout:
            lines.append("=== STDOUT ===")
            lines.append(result.stdout.rstrip())
            lines.append("")

        if result.stderr:
            lines.append("=== STDERR ===")
            lines.append(result.stderr.rstrip())
            lines.append("")

        lines.append(f"Exit code: {result.exit_code}")
        lines.append(f"Duration: {result.duration_ms:.0f}ms")

        if result.timed_out:
            lines.append("WARNING: Execution timed out")

        logger.info(
            "run_python_completed",
            exit_code=result.exit_code,
            duration_ms=result.duration_ms,
            timed_out=result.timed_out,
        )

        return "\n".join(lines)

    except ExecutionTimeoutError:
        raise
    except Exception as e:
        logger.error(
            "run_python_failed",
            error=str(e),
        )
        raise ToolExecutionError(
            f"Python execution failed: {e}",
            details={"code_preview": code[:200]},
        ) from e


@tool
async def run_python_file(
    file_path: str,
    timeout: int = DEFAULT_TIMEOUT,
    args: list[str] | None = None,
) -> str:
    """Execute a Python file and return the output.

    This tool runs an existing Python file with optional arguments.

    Args:
        file_path: Path to the Python file to execute.
        timeout: Maximum execution time in seconds (default: 30, max: 120).
        args: Optional command-line arguments to pass to the script.

    Returns:
        Formatted string with execution results including stdout, stderr,
        exit code, and execution time.

    Raises:
        ToolExecutionError: If file doesn't exist or isn't a Python file
        ExecutionTimeoutError: If execution times out

    Example:
        run_python_file("scripts/process_data.py", args=["--input", "data.csv"])
    """
    path = Path(file_path)

    if not path.exists():
        raise ToolExecutionError(
            f"File not found: {file_path}",
            details={"file_path": file_path},
        )

    if not path.suffix == ".py":
        raise ToolExecutionError(
            f"Not a Python file: {file_path}",
            details={"file_path": file_path, "suffix": path.suffix},
        )

    # Clamp timeout
    timeout = min(max(timeout, 1), 120)

    logger.info(
        "run_python_file_started",
        file_path=file_path,
        timeout=timeout,
        args=args,
    )

    start_time = time.time()

    try:
        # Build command
        cmd = ["python", str(path)]
        if args:
            cmd.extend(args)

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=path.parent,
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
            stderr = b"Execution timed out"

        duration_ms = (time.time() - start_time) * 1000

        # Format output
        lines = [f"File: {file_path}"]
        if args:
            lines.append(f"Args: {' '.join(args)}")
        lines.append("")

        stdout_str = stdout.decode(errors="replace")
        stderr_str = stderr.decode(errors="replace")

        if stdout_str:
            lines.append("=== STDOUT ===")
            lines.append(stdout_str.rstrip())
            lines.append("")

        if stderr_str:
            lines.append("=== STDERR ===")
            lines.append(stderr_str.rstrip())
            lines.append("")

        lines.append(f"Exit code: {process.returncode}")
        lines.append(f"Duration: {duration_ms:.0f}ms")

        if timed_out:
            lines.append("WARNING: Execution timed out")

        logger.info(
            "run_python_file_completed",
            file_path=file_path,
            exit_code=process.returncode,
            duration_ms=duration_ms,
            timed_out=timed_out,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_python_file",
        ) from e
    except Exception as e:
        logger.error(
            "run_python_file_failed",
            file_path=file_path,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Python file execution failed: {e}",
            details={"file_path": file_path},
        ) from e


async def run_python_sandboxed(
    code: str,
    workspace_path: str,
    timeout: int = DEFAULT_TIMEOUT,
    limits: ResourceLimits | None = None,
) -> ExecutionResult:
    """Run Python code in a sandboxed Docker container.

    This is a helper function (not a tool) for running untrusted code
    in complete isolation.

    Args:
        code: Python code to execute
        workspace_path: Path to mount as workspace
        timeout: Maximum execution time in seconds
        limits: Resource limits for the sandbox

    Returns:
        ExecutionResult with stdout, stderr, exit code

    Raises:
        SandboxError: If sandbox creation or execution fails
        ExecutionTimeoutError: If execution times out
    """
    from src.tools.execution.sandbox import execute_with_sandbox

    # Write code to a temp file in the workspace
    code_file = Path(workspace_path) / "_temp_code.py"
    code_file.write_text(code)

    try:
        result = await execute_with_sandbox(
            workspace_path=workspace_path,
            command=["python", "/workspace/_temp_code.py"],
            image="python:3.12-slim",
            timeout=timeout,
            limits=limits,
        )
        return result

    finally:
        # Clean up temp file
        try:
            code_file.unlink()
        except OSError:
            pass
