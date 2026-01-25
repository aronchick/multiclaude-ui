"""
StateReader for watching multiclaude state.json changes.

The daemon maintains state at ~/.multiclaude/state.json which is updated
whenever agents, repositories, or tasks change.
"""

import asyncio
import json
from collections.abc import AsyncIterator, Callable
from pathlib import Path
from typing import Any

from multiclaude_tool.types import State


class StateError(Exception):
    """Raised when state reading fails."""

    pass


class StateReader:
    """
    Reader for multiclaude state.json with file watching support.

    Example (sync):
        reader = StateReader()
        state = reader.read()
        for repo_name, repo in state.repos.items():
            print(f"{repo_name}: {len(repo.agents)} agents")

    Example (watching):
        reader = StateReader()
        for state in reader.watch():
            print(f"State updated: {len(state.repos)} repos")
    """

    def __init__(self, state_path: str | Path | None = None) -> None:
        """
        Initialize state reader.

        Args:
            state_path: Path to state.json. Defaults to ~/.multiclaude/state.json
        """
        if state_path is None:
            state_path = Path.home() / ".multiclaude" / "state.json"
        self.state_path = Path(state_path)

    def exists(self) -> bool:
        """Check if state file exists."""
        return self.state_path.exists()

    def read(self) -> State:
        """
        Read and parse current state.

        Returns:
            Parsed State object

        Raises:
            StateError: If file doesn't exist or is invalid
        """
        if not self.state_path.exists():
            raise StateError(f"State file not found: {self.state_path}")

        try:
            content = self.state_path.read_text()
            data = json.loads(content)
            return State.model_validate(data)
        except json.JSONDecodeError as e:
            raise StateError(f"Invalid JSON in state file: {e}") from e
        except Exception as e:
            raise StateError(f"Failed to parse state: {e}") from e

    def read_or_empty(self) -> State:
        """Read state, returning empty state if file doesn't exist."""
        if not self.exists():
            return State()
        return self.read()

    def watch(
        self,
        debounce_ms: int = 100,
        callback: Callable[[State], None] | None = None,
    ) -> "StateWatcher":
        """
        Create a watcher for state changes.

        Args:
            debounce_ms: Debounce rapid changes (milliseconds)
            callback: Optional callback for each state change

        Returns:
            StateWatcher that can be used as iterator or async iterator
        """
        return StateWatcher(self.state_path, debounce_ms, callback)


class StateWatcher:
    """
    Watches state.json for changes using watchfiles.

    Can be used as:
    - Sync iterator: `for state in watcher: ...`
    - Async iterator: `async for state in watcher: ...`
    - Context manager: `with watcher: ...`
    """

    def __init__(
        self,
        state_path: Path,
        debounce_ms: int = 100,
        callback: Callable[[State], None] | None = None,
    ) -> None:
        self.state_path = state_path
        self.debounce_ms = debounce_ms
        self.callback = callback
        self._stop_event: asyncio.Event | None = None

    def stop(self) -> None:
        """Signal the watcher to stop."""
        if self._stop_event:
            self._stop_event.set()

    def _read_state(self) -> State:
        """Read current state from file."""
        content = self.state_path.read_text()
        data = json.loads(content)
        return State.model_validate(data)

    def __iter__(self) -> "StateWatcher":
        """Start sync iteration."""
        return self

    def __next__(self) -> State:
        """
        Get next state change (blocking).

        Note: For proper file watching, use async iteration instead.
        This sync version polls the file.
        """
        import time

        # Simple polling implementation for sync use
        last_mtime = self.state_path.stat().st_mtime if self.state_path.exists() else 0

        while True:
            time.sleep(self.debounce_ms / 1000)
            if self.state_path.exists():
                current_mtime = self.state_path.stat().st_mtime
                if current_mtime > last_mtime:
                    last_mtime = current_mtime
                    state = self._read_state()
                    if self.callback:
                        self.callback(state)
                    return state

    async def __aiter__(self) -> AsyncIterator[State]:
        """Async iteration with proper file watching."""
        try:
            from watchfiles import awatch
        except ImportError as e:
            raise ImportError(
                "watchfiles is required for async state watching. "
                "Install with: pip install watchfiles"
            ) from e

        self._stop_event = asyncio.Event()

        # Yield initial state
        if self.state_path.exists():
            state = self._read_state()
            if self.callback:
                self.callback(state)
            yield state

        # Watch for changes
        async for changes in awatch(
            self.state_path.parent,
            debounce=self.debounce_ms,
            stop_event=self._stop_event,
        ):
            # Filter for our state file
            for _change_type, path in changes:
                if Path(path) == self.state_path:
                    try:
                        state = self._read_state()
                        if self.callback:
                            self.callback(state)
                        yield state
                    except Exception:
                        # Skip invalid states during rapid updates
                        pass
                    break


# --- Utility functions ---


def get_current_repo(state: State) -> str | None:
    """Get the current/default repository name from state."""
    return state.current_repo


def get_repo_agents(state: State, repo_name: str) -> dict[str, Any]:
    """Get agents for a specific repository."""
    repo = state.repos.get(repo_name)
    if not repo:
        return {}
    return {name: agent.model_dump() for name, agent in repo.agents.items()}


def get_all_agents(state: State) -> list[dict[str, Any]]:
    """Get all agents across all repositories."""
    agents = []
    for repo_name, repo in state.repos.items():
        for agent_name, agent in repo.agents.items():
            agents.append(
                {
                    "repo": repo_name,
                    "name": agent_name,
                    **agent.model_dump(),
                }
            )
    return agents


def get_active_workers(state: State) -> list[dict[str, Any]]:
    """Get all active worker agents."""
    workers = []
    for repo_name, repo in state.repos.items():
        for agent_name, agent in repo.agents.items():
            if agent.type == "worker" and agent.pid > 0:
                workers.append(
                    {
                        "repo": repo_name,
                        "name": agent_name,
                        "task": agent.task,
                        "created_at": agent.created_at,
                    }
                )
    return workers
