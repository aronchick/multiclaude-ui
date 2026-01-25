"""
Pydantic models mirroring multiclaude/internal/state/state.go

These types represent the daemon's state structure and are used
for type-safe communication with the multiclaude daemon.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

# --- Literal types (enums) ---

AgentType = Literal[
    "supervisor",
    "worker",
    "merge-queue",
    "pr-shepherd",
    "workspace",
    "review",
    "generic-persistent",
]
"""
Agent types supported by multiclaude:
- supervisor: Main orchestrator for a repository
- worker: Executes specific tasks
- merge-queue: Monitors and merges approved PRs
- pr-shepherd: Monitors PRs in fork mode
- workspace: Interactive workspace agent
- review: Reviews a specific PR
- generic-persistent: Custom persistent agents
"""

TrackMode = Literal["all", "author", "assigned"]
"""
Track modes for merge-queue and pr-shepherd agents:
- all: Monitor all PRs in the repository
- author: Only PRs where the multiclaude user is the author
- assigned: Only PRs where the multiclaude user is assigned
"""

TaskStatus = Literal["open", "merged", "closed", "no-pr", "failed", "unknown"]
"""
Task status values:
- open: PR created, not yet merged or closed
- merged: PR was merged successfully
- closed: PR was closed without merging
- no-pr: Task completed but no PR was created
- failed: Task failed (see failure_reason)
- unknown: Status couldn't be determined
"""


# --- Configuration models ---


class MergeQueueConfig(BaseModel):
    """Configuration for the merge-queue agent."""

    enabled: bool = True
    """Whether the merge queue agent should run."""

    track_mode: TrackMode = "all"
    """Which PRs to track: "all", "author", or "assigned"."""


class PRShepherdConfig(BaseModel):
    """Configuration for the pr-shepherd agent (used in fork mode)."""

    enabled: bool = True
    """Whether the PR shepherd agent should run."""

    track_mode: TrackMode = "author"
    """Which PRs to track: "all", "author", or "assigned"."""


class ForkConfig(BaseModel):
    """Fork-related configuration for a repository."""

    is_fork: bool = False
    """True if the repository is detected as a fork."""

    upstream_url: str | None = None
    """URL of the upstream repository (if fork)."""

    upstream_owner: str | None = None
    """Owner of the upstream repository (if fork)."""

    upstream_repo: str | None = None
    """Name of the upstream repository (if fork)."""

    force_fork_mode: bool | None = None
    """Forces fork mode even for non-forks (edge case)."""


# --- Core state models ---


class TaskHistoryEntry(BaseModel):
    """A completed task in the history."""

    name: str
    """Worker name."""

    task: str
    """Task description."""

    branch: str
    """Git branch."""

    pr_url: str | None = None
    """Pull request URL if created."""

    pr_number: int | None = None
    """PR number for quick lookup."""

    status: TaskStatus
    """Current status."""

    summary: str | None = None
    """Brief summary of what was accomplished."""

    failure_reason: str | None = None
    """Why the task failed (if applicable)."""

    created_at: datetime
    """When the task was started."""

    completed_at: datetime | None = None
    """When the task was completed."""


class Agent(BaseModel):
    """An agent's state."""

    type: AgentType
    """Agent type."""

    worktree_path: str
    """Path to the git worktree."""

    tmux_window: str
    """Tmux window identifier."""

    session_id: str
    """Claude session ID."""

    pid: int = 0
    """Process ID (0 if not running)."""

    task: str | None = None
    """Task description (workers only)."""

    summary: str | None = None
    """Brief summary of work done (workers only)."""

    failure_reason: str | None = None
    """Why the task failed (workers only)."""

    created_at: datetime
    """When the agent was created."""

    last_nudge: datetime | None = None
    """Last time the agent was nudged."""

    ready_for_cleanup: bool | None = None
    """Signals worker completion (workers only)."""


class Repository(BaseModel):
    """A tracked repository's state."""

    github_url: str
    """GitHub URL."""

    tmux_session: str
    """Tmux session name."""

    agents: dict[str, Agent] = Field(default_factory=dict)
    """Map of agent name to agent state."""

    task_history: list[TaskHistoryEntry] | None = None
    """Completed task history."""

    merge_queue_config: MergeQueueConfig | None = None
    """Merge queue configuration."""

    pr_shepherd_config: PRShepherdConfig | None = None
    """PR shepherd configuration."""

    fork_config: ForkConfig | None = None
    """Fork configuration."""

    target_branch: str | None = None
    """Default branch for PRs (usually "main")."""


class State(BaseModel):
    """The entire daemon state."""

    repos: dict[str, Repository] = Field(default_factory=dict)
    """Map of repository name to repository state."""

    current_repo: str | None = None
    """Current/default repository name."""


# --- Socket API models ---


class SocketRequest(BaseModel):
    """Socket API request format."""

    command: str
    """Command name."""

    args: dict[str, Any] | None = None
    """Command-specific arguments."""


class SocketResponse(BaseModel):
    """Socket API response format."""

    success: bool
    """Whether command succeeded."""

    data: Any | None = None
    """Command response data (if successful)."""

    error: str | None = None
    """Error message (if failed)."""


class DaemonStatus(BaseModel):
    """Daemon status response."""

    running: bool
    """Whether daemon is running."""

    pid: int
    """Daemon process ID."""

    repos: int
    """Number of tracked repositories."""

    agents: int
    """Total number of agents."""

    socket_path: str
    """Path to the Unix socket."""


# --- Helper functions ---


PERSISTENT_AGENT_TYPES: set[AgentType] = {
    "supervisor",
    "merge-queue",
    "pr-shepherd",
    "workspace",
    "generic-persistent",
}


def is_persistent_agent_type(agent_type: AgentType) -> bool:
    """Check if an agent type is persistent (auto-restarted when dead)."""
    return agent_type in PERSISTENT_AGENT_TYPES


def default_merge_queue_config() -> MergeQueueConfig:
    """Default merge queue configuration."""
    return MergeQueueConfig(enabled=True, track_mode="all")


def default_pr_shepherd_config() -> PRShepherdConfig:
    """Default PR shepherd configuration."""
    return PRShepherdConfig(enabled=True, track_mode="author")
