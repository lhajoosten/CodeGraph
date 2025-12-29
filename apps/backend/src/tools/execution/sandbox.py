"""Docker sandbox manager for secure code execution.

Provides isolated Docker containers for running untrusted code
with resource limits and security constraints.
"""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from src.core.logging import get_logger
from src.tools.exceptions import ExecutionTimeoutError, SandboxError
from src.tools.schemas import (
    ExecutionResult,
    ResourceLimits,
    SandboxConfig,
    SandboxInfo,
    SandboxStatus,
)

logger = get_logger(__name__)

# Default Docker images for different execution contexts
DEFAULT_IMAGES = {
    "python": "python:3.12-slim",
    "node": "node:20-slim",
    "shell": "ubuntu:22.04",
}


@dataclass
class Sandbox:
    """Represents an active sandbox container."""

    sandbox_id: str
    config: SandboxConfig
    status: SandboxStatus = SandboxStatus.CREATING
    container_id: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    last_used: datetime = field(default_factory=datetime.now)

    def to_info(self) -> SandboxInfo:
        """Convert to SandboxInfo schema."""
        return SandboxInfo(
            sandbox_id=self.sandbox_id,
            status=self.status,
            image=self.config.image,
            created_at=self.created_at,
            workspace_path=self.config.workspace_path,
        )


class SandboxManager:
    """Manages Docker sandbox containers for code execution.

    Provides container lifecycle management with resource limits
    and security isolation for running untrusted code.
    """

    def __init__(self) -> None:
        """Initialize the sandbox manager."""
        self._sandboxes: dict[str, Sandbox] = {}
        self._docker_available: bool | None = None

    async def _check_docker(self) -> bool:
        """Check if Docker is available.

        Returns:
            True if Docker daemon is accessible
        """
        if self._docker_available is not None:
            return self._docker_available

        try:
            process = await asyncio.create_subprocess_exec(
                "docker",
                "info",
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await process.wait()
            self._docker_available = process.returncode == 0

            if self._docker_available:
                logger.info("docker_available")
            else:
                logger.warning("docker_not_available")

            return self._docker_available

        except FileNotFoundError:
            logger.warning("docker_not_installed")
            self._docker_available = False
            return False

    async def create_sandbox(
        self,
        workspace_path: str,
        image: str = "python:3.12-slim",
        limits: ResourceLimits | None = None,
    ) -> str:
        """Create a new sandbox container.

        Args:
            workspace_path: Path to mount as workspace
            image: Docker image to use
            limits: Resource limits for the container

        Returns:
            Sandbox ID

        Raises:
            SandboxError: If Docker is not available or container creation fails
        """
        if not await self._check_docker():
            raise SandboxError(
                "Docker is not available. Please ensure Docker is installed and running.",
                sandbox_id=None,
            )

        sandbox_id = str(uuid.uuid4())[:8]
        config = SandboxConfig(
            workspace_path=workspace_path,
            image=image,
            limits=limits or ResourceLimits(),
        )

        sandbox = Sandbox(
            sandbox_id=sandbox_id,
            config=config,
        )

        logger.info(
            "sandbox_creating",
            sandbox_id=sandbox_id,
            image=image,
            workspace=workspace_path,
        )

        try:
            # Build docker run command with resource limits
            cmd = self._build_docker_create_command(sandbox)

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                raise SandboxError(
                    f"Failed to create container: {error_msg}",
                    sandbox_id=sandbox_id,
                )

            container_id = stdout.decode().strip()
            sandbox.container_id = container_id
            sandbox.status = SandboxStatus.READY

            self._sandboxes[sandbox_id] = sandbox

            logger.info(
                "sandbox_created",
                sandbox_id=sandbox_id,
                container_id=container_id[:12],
            )

            return sandbox_id

        except SandboxError:
            raise
        except Exception as e:
            logger.error(
                "sandbox_create_failed",
                sandbox_id=sandbox_id,
                error=str(e),
            )
            raise SandboxError(
                f"Failed to create sandbox: {e}",
                sandbox_id=sandbox_id,
            ) from e

    def _build_docker_create_command(self, sandbox: Sandbox) -> list[str]:
        """Build the docker create command with all options.

        Args:
            sandbox: Sandbox configuration

        Returns:
            List of command arguments
        """
        config = sandbox.config
        limits = config.limits

        cmd = [
            "docker",
            "create",
            "--name",
            f"codegraph-sandbox-{sandbox.sandbox_id}",
            # Resource limits
            f"--memory={limits.memory_mb}m",
            f"--cpus={limits.cpu_count}",
            # Security options
            "--security-opt=no-new-privileges:true",
            "--cap-drop=ALL",
            "--read-only",
            # Temporary filesystem for /tmp
            "--tmpfs=/tmp:rw,noexec,nosuid,size=64m",
            # Mount workspace as read-write
            "-v",
            f"{config.workspace_path}:{config.working_dir}:rw",
            "-w",
            config.working_dir,
        ]

        # Network isolation (unless explicitly enabled)
        if not limits.network_enabled:
            cmd.append("--network=none")

        # Environment variables
        for key, value in config.environment.items():
            cmd.extend(["-e", f"{key}={value}"])

        # Add the image
        cmd.append(config.image)

        # Keep container running
        cmd.extend(["tail", "-f", "/dev/null"])

        return cmd

    async def execute_in_sandbox(
        self,
        sandbox_id: str,
        command: list[str],
        timeout: int | None = None,
    ) -> ExecutionResult:
        """Execute a command in a sandbox container.

        Args:
            sandbox_id: Sandbox identifier
            command: Command to execute
            timeout: Override default timeout (seconds)

        Returns:
            ExecutionResult with stdout, stderr, exit code

        Raises:
            SandboxError: If sandbox not found or execution fails
            ExecutionTimeoutError: If execution times out
        """
        if sandbox_id not in self._sandboxes:
            raise SandboxError(
                f"Sandbox not found: {sandbox_id}",
                sandbox_id=sandbox_id,
            )

        sandbox = self._sandboxes[sandbox_id]

        if sandbox.status not in (SandboxStatus.READY, SandboxStatus.RUNNING):
            raise SandboxError(
                f"Sandbox is not ready: status={sandbox.status}",
                sandbox_id=sandbox_id,
            )

        timeout_seconds = timeout or sandbox.config.limits.timeout_seconds
        sandbox.status = SandboxStatus.RUNNING
        sandbox.last_used = datetime.now()

        logger.info(
            "sandbox_execute_started",
            sandbox_id=sandbox_id,
            command=command[:3],  # Log first 3 args
            timeout=timeout_seconds,
        )

        start_time = time.time()

        try:
            # Start the container if not running
            await self._ensure_container_running(sandbox)

            # Execute command in container
            exec_cmd = [
                "docker",
                "exec",
                f"codegraph-sandbox-{sandbox_id}",
                *command,
            ]

            process = await asyncio.create_subprocess_exec(
                *exec_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout_seconds,
                )
                timed_out = False

            except TimeoutError:
                process.kill()
                await process.wait()
                timed_out = True
                stdout = b""
                stderr = b"Execution timed out"

            duration_ms = (time.time() - start_time) * 1000

            sandbox.status = SandboxStatus.READY

            result = ExecutionResult(
                stdout=stdout.decode(errors="replace"),
                stderr=stderr.decode(errors="replace"),
                exit_code=process.returncode or 0,
                duration_ms=duration_ms,
                timed_out=timed_out,
            )

            logger.info(
                "sandbox_execute_completed",
                sandbox_id=sandbox_id,
                exit_code=result.exit_code,
                duration_ms=duration_ms,
                timed_out=timed_out,
            )

            if timed_out:
                raise ExecutionTimeoutError(
                    timeout_seconds=timeout_seconds,
                    operation="execute_in_sandbox",
                )

            return result

        except ExecutionTimeoutError:
            raise
        except SandboxError:
            raise
        except Exception as e:
            sandbox.status = SandboxStatus.ERROR
            logger.error(
                "sandbox_execute_failed",
                sandbox_id=sandbox_id,
                error=str(e),
            )
            raise SandboxError(
                f"Execution failed: {e}",
                sandbox_id=sandbox_id,
            ) from e

    async def _ensure_container_running(self, sandbox: Sandbox) -> None:
        """Ensure the container is running.

        Args:
            sandbox: Sandbox to start

        Raises:
            SandboxError: If container cannot be started
        """
        if not sandbox.container_id:
            raise SandboxError(
                "Container not created",
                sandbox_id=sandbox.sandbox_id,
            )

        # Check if container is running
        check_cmd = [
            "docker",
            "inspect",
            "-f",
            "{{.State.Running}}",
            sandbox.container_id,
        ]

        process = await asyncio.create_subprocess_exec(
            *check_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await process.communicate()

        is_running = stdout.decode().strip().lower() == "true"

        if not is_running:
            # Start the container
            start_cmd = ["docker", "start", sandbox.container_id]
            process = await asyncio.create_subprocess_exec(
                *start_cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await process.communicate()

            if process.returncode != 0:
                raise SandboxError(
                    f"Failed to start container: {stderr.decode()}",
                    sandbox_id=sandbox.sandbox_id,
                )

    async def cleanup_sandbox(self, sandbox_id: str) -> None:
        """Remove a sandbox container and clean up resources.

        Args:
            sandbox_id: Sandbox identifier

        Raises:
            SandboxError: If cleanup fails
        """
        if sandbox_id not in self._sandboxes:
            logger.warning("sandbox_cleanup_not_found", sandbox_id=sandbox_id)
            return

        sandbox = self._sandboxes[sandbox_id]

        logger.info("sandbox_cleanup_started", sandbox_id=sandbox_id)

        try:
            # Remove the container
            container_name = f"codegraph-sandbox-{sandbox_id}"
            cmd = ["docker", "rm", "-f", container_name]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await process.wait()

            sandbox.status = SandboxStatus.STOPPED
            del self._sandboxes[sandbox_id]

            logger.info("sandbox_cleanup_completed", sandbox_id=sandbox_id)

        except Exception as e:
            logger.error(
                "sandbox_cleanup_failed",
                sandbox_id=sandbox_id,
                error=str(e),
            )
            raise SandboxError(
                f"Failed to cleanup sandbox: {e}",
                sandbox_id=sandbox_id,
            ) from e

    async def cleanup_all(self) -> None:
        """Clean up all sandbox containers."""
        sandbox_ids = list(self._sandboxes.keys())

        for sandbox_id in sandbox_ids:
            try:
                await self.cleanup_sandbox(sandbox_id)
            except SandboxError as e:
                logger.warning(
                    "sandbox_cleanup_individual_failed",
                    sandbox_id=sandbox_id,
                    error=str(e),
                )

    def get_sandbox(self, sandbox_id: str) -> SandboxInfo | None:
        """Get information about a sandbox.

        Args:
            sandbox_id: Sandbox identifier

        Returns:
            SandboxInfo or None if not found
        """
        sandbox = self._sandboxes.get(sandbox_id)
        return sandbox.to_info() if sandbox else None

    def list_sandboxes(self) -> list[SandboxInfo]:
        """List all active sandboxes.

        Returns:
            List of SandboxInfo for all sandboxes
        """
        return [s.to_info() for s in self._sandboxes.values()]


# Global sandbox manager instance
_sandbox_manager: SandboxManager | None = None


def get_sandbox_manager() -> SandboxManager:
    """Get the global sandbox manager instance.

    Returns:
        Singleton SandboxManager instance
    """
    global _sandbox_manager
    if _sandbox_manager is None:
        _sandbox_manager = SandboxManager()
    return _sandbox_manager


async def execute_with_sandbox(
    workspace_path: str,
    command: list[str],
    image: str = "python:3.12-slim",
    timeout: int = 30,
    limits: ResourceLimits | None = None,
) -> ExecutionResult:
    """Execute a command in a temporary sandbox.

    Convenience function that creates a sandbox, executes the command,
    and cleans up in one operation.

    Args:
        workspace_path: Path to mount as workspace
        command: Command to execute
        image: Docker image to use
        timeout: Execution timeout in seconds
        limits: Resource limits

    Returns:
        ExecutionResult with stdout, stderr, exit code

    Raises:
        SandboxError: If execution fails
        ExecutionTimeoutError: If execution times out
    """
    manager = get_sandbox_manager()

    sandbox_id = await manager.create_sandbox(
        workspace_path=workspace_path,
        image=image,
        limits=limits,
    )

    try:
        return await manager.execute_in_sandbox(
            sandbox_id=sandbox_id,
            command=command,
            timeout=timeout,
        )
    finally:
        await manager.cleanup_sandbox(sandbox_id)
