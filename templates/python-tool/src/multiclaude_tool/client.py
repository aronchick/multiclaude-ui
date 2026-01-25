"""
DaemonClient for communicating with multiclaude daemon via Unix socket.

The daemon exposes a Unix socket at ~/.multiclaude/daemon.sock for
programmatic control using JSON request/response protocol.
"""

import asyncio
import json
import socket
from pathlib import Path
from typing import Any, TypeVar

from pydantic import BaseModel

from multiclaude_tool.types import (
    DaemonStatus,
    Repository,
    SocketRequest,
    SocketResponse,
    State,
    TaskHistoryEntry,
)

T = TypeVar("T", bound=BaseModel)


class DaemonError(Exception):
    """Raised when daemon communication fails."""

    pass


class DaemonClient:
    """
    Client for communicating with the multiclaude daemon.

    Uses Unix socket at ~/.multiclaude/daemon.sock for JSON-based
    request/response communication.

    Example:
        client = DaemonClient()
        if client.ping():
            status = client.status()
            print(f"Tracking {status.repos} repos with {status.agents} agents")
    """

    def __init__(self, socket_path: str | Path | None = None) -> None:
        """
        Initialize daemon client.

        Args:
            socket_path: Path to Unix socket. Defaults to ~/.multiclaude/daemon.sock
        """
        if socket_path is None:
            socket_path = Path.home() / ".multiclaude" / "daemon.sock"
        self.socket_path = Path(socket_path)

    def _send_request(self, command: str, args: dict[str, Any] | None = None) -> SocketResponse:
        """Send a request to the daemon and return the response."""
        if not self.socket_path.exists():
            raise DaemonError(f"Socket not found: {self.socket_path}")

        request = SocketRequest(command=command, args=args)

        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(30.0)
            sock.connect(str(self.socket_path))

            # Send request as newline-terminated JSON
            request_data = request.model_dump_json() + "\n"
            sock.sendall(request_data.encode())

            # Read response (may come in chunks)
            chunks: list[bytes] = []
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                chunks.append(chunk)
                if b"\n" in chunk:
                    break

            sock.close()

            response_data = b"".join(chunks).decode().strip()
            if not response_data:
                raise DaemonError("Empty response from daemon")

            return SocketResponse.model_validate_json(response_data)

        except OSError as e:
            raise DaemonError(f"Socket error: {e}") from e
        except json.JSONDecodeError as e:
            raise DaemonError(f"Invalid JSON response: {e}") from e

    def _require_success(self, response: SocketResponse) -> Any:
        """Raise error if response indicates failure."""
        if not response.success:
            raise DaemonError(response.error or "Unknown error")
        return response.data

    # --- Core commands ---

    def ping(self) -> bool:
        """Check if daemon is alive."""
        try:
            response = self._send_request("ping")
            return response.success
        except DaemonError:
            return False

    def status(self) -> DaemonStatus:
        """Get daemon status."""
        response = self._send_request("status")
        data = self._require_success(response)
        return DaemonStatus.model_validate(data)

    def get_state(self) -> State:
        """Get the entire daemon state."""
        response = self._send_request("get_state")
        data = self._require_success(response)
        return State.model_validate(data)

    # --- Repository commands ---

    def list_repos(self) -> list[str]:
        """List tracked repository names."""
        response = self._send_request("list_repos")
        data = self._require_success(response)
        return list(data) if data else []

    def get_repo(self, name: str) -> Repository:
        """Get a specific repository's state."""
        response = self._send_request("get_repo", {"name": name})
        data = self._require_success(response)
        return Repository.model_validate(data)

    # --- Agent commands ---

    def list_agents(self, repo: str | None = None) -> dict[str, dict[str, Any]]:
        """
        List agents, optionally filtered by repository.

        Returns dict mapping agent name to agent info.
        """
        args = {"repo": repo} if repo else None
        response = self._send_request("list_agents", args)
        data = self._require_success(response)
        return dict(data) if data else {}

    def spawn_worker(
        self,
        task: str,
        repo: str | None = None,
        branch: str | None = None,
        push_to: str | None = None,
    ) -> str:
        """
        Spawn a new worker agent.

        Args:
            task: Task description for the worker
            repo: Repository name (uses current if not specified)
            branch: Base branch (defaults to main)
            push_to: Target branch for PR (defaults to main)

        Returns:
            Worker name (e.g., "clever-fox")
        """
        args: dict[str, Any] = {"task": task}
        if repo:
            args["repo"] = repo
        if branch:
            args["branch"] = branch
        if push_to:
            args["push_to"] = push_to

        response = self._send_request("spawn_worker", args)
        data = self._require_success(response)
        return str(data.get("name", ""))

    def remove_agent(self, name: str, repo: str | None = None) -> bool:
        """Remove/kill an agent."""
        args: dict[str, Any] = {"name": name}
        if repo:
            args["repo"] = repo
        response = self._send_request("remove_agent", args)
        return response.success

    # --- Task history ---

    def task_history(
        self,
        repo: str | None = None,
        limit: int | None = None,
        status: str | None = None,
    ) -> list[TaskHistoryEntry]:
        """
        Get task history.

        Args:
            repo: Repository name (uses current if not specified)
            limit: Max number of entries to return
            status: Filter by status ("open", "merged", "closed", etc.)
        """
        args: dict[str, Any] = {}
        if repo:
            args["repo"] = repo
        if limit:
            args["limit"] = limit
        if status:
            args["status"] = status

        response = self._send_request("task_history", args or None)
        data = self._require_success(response)
        return [TaskHistoryEntry.model_validate(entry) for entry in (data or [])]

    # --- Message commands ---

    def send_message(self, to: str, body: str, from_agent: str = "external") -> str:
        """
        Send a message to an agent.

        Args:
            to: Target agent name or type
            body: Message content
            from_agent: Sender identifier

        Returns:
            Message ID
        """
        response = self._send_request(
            "send_message",
            {"to": to, "body": body, "from": from_agent},
        )
        data = self._require_success(response)
        return str(data.get("id", ""))

    def list_messages(self, agent: str | None = None) -> list[dict[str, Any]]:
        """List pending messages, optionally for a specific agent."""
        args = {"agent": agent} if agent else None
        response = self._send_request("list_messages", args)
        data = self._require_success(response)
        return list(data) if data else []


# --- Async client (optional) ---


class AsyncDaemonClient:
    """
    Async version of DaemonClient using asyncio.

    Example:
        async with AsyncDaemonClient() as client:
            if await client.ping():
                status = await client.status()
    """

    def __init__(self, socket_path: str | Path | None = None) -> None:
        if socket_path is None:
            socket_path = Path.home() / ".multiclaude" / "daemon.sock"
        self.socket_path = Path(socket_path)

    async def __aenter__(self) -> "AsyncDaemonClient":
        return self

    async def __aexit__(self, *args: Any) -> None:
        pass

    async def _send_request(
        self, command: str, args: dict[str, Any] | None = None
    ) -> SocketResponse:
        """Send an async request to the daemon."""
        if not self.socket_path.exists():
            raise DaemonError(f"Socket not found: {self.socket_path}")

        request = SocketRequest(command=command, args=args)

        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_unix_connection(str(self.socket_path)),
                timeout=30.0,
            )

            request_data = request.model_dump_json() + "\n"
            writer.write(request_data.encode())
            await writer.drain()

            response_data = await asyncio.wait_for(reader.readline(), timeout=30.0)
            writer.close()
            await writer.wait_closed()

            if not response_data:
                raise DaemonError("Empty response from daemon")

            return SocketResponse.model_validate_json(response_data.decode().strip())

        except asyncio.TimeoutError as e:
            raise DaemonError("Request timed out") from e
        except OSError as e:
            raise DaemonError(f"Socket error: {e}") from e

    def _require_success(self, response: SocketResponse) -> Any:
        if not response.success:
            raise DaemonError(response.error or "Unknown error")
        return response.data

    async def ping(self) -> bool:
        try:
            response = await self._send_request("ping")
            return response.success
        except DaemonError:
            return False

    async def status(self) -> DaemonStatus:
        response = await self._send_request("status")
        data = self._require_success(response)
        return DaemonStatus.model_validate(data)

    async def get_state(self) -> State:
        response = await self._send_request("get_state")
        data = self._require_success(response)
        return State.model_validate(data)

    async def list_repos(self) -> list[str]:
        response = await self._send_request("list_repos")
        data = self._require_success(response)
        return list(data) if data else []

    async def spawn_worker(
        self,
        task: str,
        repo: str | None = None,
    ) -> str:
        args: dict[str, Any] = {"task": task}
        if repo:
            args["repo"] = repo
        response = await self._send_request("spawn_worker", args)
        data = self._require_success(response)
        return str(data.get("name", ""))
