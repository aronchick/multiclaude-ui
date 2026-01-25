"""
multiclaude-tool: A Python tool for integrating with multiclaude daemon.

This package provides:
- Pydantic models matching multiclaude's state structure
- DaemonClient for socket communication
- StateReader for watching state.json changes
"""

from multiclaude_tool.client import DaemonClient
from multiclaude_tool.state import StateReader
from multiclaude_tool.types import (
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
)

__version__ = "0.1.0"
__all__ = [
    # Types
    "AgentType",
    "TrackMode",
    "TaskStatus",
    "MergeQueueConfig",
    "PRShepherdConfig",
    "ForkConfig",
    "TaskHistoryEntry",
    "Agent",
    "Repository",
    "State",
    "SocketRequest",
    "SocketResponse",
    "DaemonStatus",
    # Classes
    "DaemonClient",
    "StateReader",
]
