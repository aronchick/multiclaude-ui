"""
multiclaude-types: Python type definitions for multiclaude daemon state.

This package provides Pydantic models and type definitions that mirror
the TypeScript types in @multiclaude/core. Use these for building Python
tools and integrations with the multiclaude daemon.

Example:
    >>> from multiclaude_types import State, parse_state
    >>> import json
    >>> with open("~/.multiclaude/state.json") as f:
    ...     state = parse_state(json.load(f))
    >>> print(f"Tracking {len(state.repos)} repositories")
"""

from .types import (
    PERSISTENT_AGENT_TYPES,
    Agent,
    AgentType,
    DaemonStatus,
    ForkConfig,
    MergeQueueConfig,
    PRShepherdConfig,
    Repository,
    SocketRequest,
    SocketResponse,
    State,
    TaskHistoryEntry,
    TaskStatus,
    TrackMode,
    default_merge_queue_config,
    default_pr_shepherd_config,
    is_persistent_agent_type,
    parse_agent,
    parse_daemon_status,
    parse_repository,
    parse_socket_response,
    parse_state,
    safe_parse_state,
)

__all__ = [
    "PERSISTENT_AGENT_TYPES",
    "Agent",
    "AgentType",
    "DaemonStatus",
    "ForkConfig",
    "MergeQueueConfig",
    "PRShepherdConfig",
    "Repository",
    "SocketRequest",
    "SocketResponse",
    "State",
    "TaskHistoryEntry",
    "TaskStatus",
    "TrackMode",
    "default_merge_queue_config",
    "default_pr_shepherd_config",
    "is_persistent_agent_type",
    "parse_agent",
    "parse_daemon_status",
    "parse_repository",
    "parse_socket_response",
    "parse_state",
    "safe_parse_state",
]

__version__ = "0.1.0"
