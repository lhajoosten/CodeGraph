"""Shell command execution tools for agents.

Provides safe shell command execution with a whitelist of allowed commands
and argument validation for security.
"""

import asyncio
import shlex
import time
from pathlib import Path

from langchain_core.tools import tool

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, PermissionDeniedError, ToolExecutionError

logger = get_logger(__name__)

# Whitelist of allowed shell commands
# These are safe commands that don't modify system state
ALLOWED_COMMANDS = {
    # File and directory inspection
    "ls",
    "cat",
    "head",
    "tail",
    "wc",
    "file",
    "stat",
    "find",
    "tree",
    "du",
    "df",
    # Text processing
    "grep",
    "awk",
    "sed",
    "sort",
    "uniq",
    "cut",
    "tr",
    "diff",
    # Python/Node tools
    "python",
    "python3",
    "pip",
    "pip3",
    "node",
    "npm",
    "npx",
    # Development tools
    "git",
    "make",
    "poetry",
    "pytest",
    "ruff",
    "black",
    "mypy",
    "cargo",
    "rustc",
    # System info (read-only)
    "which",
    "whereis",
    "env",
    "printenv",
    "echo",
    "date",
    "whoami",
    "pwd",
    "hostname",
    "uname",
    # Archive tools (read operations)
    "tar",
    "unzip",
    "zip",
    "gzip",
    "gunzip",
}

# Commands that are always blocked (dangerous)
BLOCKED_COMMANDS = {
    "rm",
    "rmdir",
    "mv",
    "cp",
    "chmod",
    "chown",
    "chgrp",
    "sudo",
    "su",
    "kill",
    "killall",
    "pkill",
    "reboot",
    "shutdown",
    "init",
    "systemctl",
    "service",
    "apt",
    "apt-get",
    "yum",
    "dnf",
    "pacman",
    "brew",
    "dd",
    "mkfs",
    "fdisk",
    "mount",
    "umount",
    "iptables",
    "curl",
    "wget",
    "nc",
    "netcat",
    "ssh",
    "scp",
    "rsync",
}

# Dangerous shell operators
DANGEROUS_OPERATORS = [
    "&&",
    "||",
    ";",
    "|",
    ">",
    ">>",
    "<",
    "<<",
    "`",
    "$(",
    "${",
]

# Default timeout
DEFAULT_TIMEOUT = 30


def _validate_command(command: str) -> tuple[str, list[str]]:
    """Validate and parse a shell command.

    Args:
        command: Shell command string

    Returns:
        Tuple of (base_command, arguments)

    Raises:
        PermissionDeniedError: If command is blocked or contains dangerous operators
        ToolExecutionError: If command is empty or invalid
    """
    if not command or not command.strip():
        raise ToolExecutionError(
            "Empty command provided",
            details={"reason": "command_empty"},
        )

    # Check for dangerous shell operators
    for operator in DANGEROUS_OPERATORS:
        if operator in command:
            raise PermissionDeniedError(
                f"Shell operator '{operator}' is not allowed for security reasons. "
                "Please execute commands one at a time.",
                operation="shell_execute",
                resource=command[:100],
            )

    # Parse the command
    try:
        parts = shlex.split(command)
    except ValueError as e:
        raise ToolExecutionError(
            f"Invalid command syntax: {e}",
            details={"command": command[:100]},
        ) from e

    if not parts:
        raise ToolExecutionError(
            "Empty command after parsing",
            details={"command": command[:100]},
        )

    base_cmd = parts[0]
    args = parts[1:]

    # Check if command is blocked
    if base_cmd in BLOCKED_COMMANDS:
        raise PermissionDeniedError(
            f"Command '{base_cmd}' is blocked for security reasons",
            operation="shell_execute",
            resource=base_cmd,
        )

    # Check if command is allowed
    if base_cmd not in ALLOWED_COMMANDS:
        raise PermissionDeniedError(
            f"Command '{base_cmd}' is not in the whitelist of allowed commands. "
            f"Allowed commands include: {', '.join(sorted(list(ALLOWED_COMMANDS)[:10]))}...",
            operation="shell_execute",
            resource=base_cmd,
        )

    return base_cmd, args


@tool
async def run_shell(
    command: str,
    working_dir: str | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """Execute a whitelisted shell command and return the output.

    This tool runs shell commands with safety restrictions. Only commands
    in the whitelist are allowed, and shell operators like pipes and
    redirects are blocked.

    Args:
        command: Shell command to execute (must be a single command, no pipes).
        working_dir: Optional working directory for execution.
        timeout: Maximum execution time in seconds (default: 30, max: 120).

    Returns:
        Formatted string with command output including stdout, stderr,
        exit code, and execution time.

    Raises:
        PermissionDeniedError: If command is not whitelisted or contains
            dangerous operators
        ToolExecutionError: If command is invalid
        ExecutionTimeoutError: If execution times out

    Allowed commands include:
        - File inspection: ls, cat, head, tail, find, tree
        - Text processing: grep, awk, sed, sort, diff
        - Development: git, make, pytest, ruff, black, mypy
        - Package managers: pip, npm, poetry, cargo

    Example:
        run_shell("ls -la src/")
        run_shell("git status")
        run_shell("pytest tests/ -v")
    """
    base_cmd, args = _validate_command(command)

    # Clamp timeout
    timeout = min(max(timeout, 1), 120)

    # Validate working directory
    cwd = None
    if working_dir:
        cwd_path = Path(working_dir)
        if not cwd_path.exists():
            raise ToolExecutionError(
                f"Working directory does not exist: {working_dir}",
                details={"working_dir": working_dir},
            )
        cwd = str(cwd_path)

    logger.info(
        "run_shell_started",
        command=base_cmd,
        args=args[:5],  # Log first 5 args
        working_dir=working_dir,
        timeout=timeout,
    )

    start_time = time.time()

    try:
        process = await asyncio.create_subprocess_exec(
            base_cmd,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
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
        lines = [f"$ {command}"]
        lines.append("")

        stdout_str = stdout.decode(errors="replace")
        stderr_str = stderr.decode(errors="replace")

        if stdout_str:
            lines.append(stdout_str.rstrip())

        if stderr_str:
            if stdout_str:
                lines.append("")
            lines.append("=== STDERR ===")
            lines.append(stderr_str.rstrip())

        lines.append("")
        lines.append(f"Exit code: {process.returncode}")
        lines.append(f"Duration: {duration_ms:.0f}ms")

        if timed_out:
            lines.append("WARNING: Execution timed out")

        logger.info(
            "run_shell_completed",
            command=base_cmd,
            exit_code=process.returncode,
            duration_ms=duration_ms,
            timed_out=timed_out,
        )

        return "\n".join(lines)

    except TimeoutError as e:
        raise ExecutionTimeoutError(
            timeout_seconds=timeout,
            operation="run_shell",
        ) from e
    except PermissionDeniedError:
        raise
    except ToolExecutionError:
        raise
    except FileNotFoundError as e:
        raise ToolExecutionError(
            f"Command not found: {base_cmd}",
            details={"command": base_cmd},
        ) from e
    except Exception as e:
        logger.error(
            "run_shell_failed",
            command=base_cmd,
            error=str(e),
        )
        raise ToolExecutionError(
            f"Shell command failed: {e}",
            details={"command": command[:100]},
        ) from e


def get_allowed_commands() -> list[str]:
    """Get list of allowed shell commands.

    Returns:
        Sorted list of whitelisted commands
    """
    return sorted(ALLOWED_COMMANDS)


def is_command_allowed(command: str) -> bool:
    """Check if a command is allowed.

    Args:
        command: Command to check (can be full command or just base command)

    Returns:
        True if the command is allowed
    """
    try:
        parts = shlex.split(command)
        if not parts:
            return False
        base_cmd = parts[0]
        return base_cmd in ALLOWED_COMMANDS and base_cmd not in BLOCKED_COMMANDS
    except ValueError:
        return False
