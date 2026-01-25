# multiclaude-types

Python type definitions for multiclaude daemon state.

This package provides Pydantic models that mirror the TypeScript types in `@multiclaude/core`, enabling type-safe Python integrations with the multiclaude daemon.

## Installation

```bash
pip install multiclaude-types

# Or with uv
uv add multiclaude-types
```

## Usage

### Reading Daemon State

```python
import json
from pathlib import Path
from multiclaude_types import parse_state, State

# Read and parse state.json
state_path = Path.home() / ".multiclaude" / "state.json"
with open(state_path) as f:
    state = parse_state(json.load(f))

# Access typed data
print(f"Tracking {len(state.repos)} repositories")
if state.current_repo:
    repo = state.repos[state.current_repo]
    print(f"Current repo: {repo.github_url}")
    print(f"Active agents: {len(repo.agents)}")
```

### Working with Agents

```python
from multiclaude_types import Agent, is_persistent_agent_type

# Check if an agent is persistent (auto-restarted)
def should_restart(agent: Agent) -> bool:
    return is_persistent_agent_type(agent.type) and agent.pid == 0

# Filter workers
workers = [a for a in repo.agents.values() if a.type == "worker"]
for worker in workers:
    print(f"{worker.task} - ready: {worker.ready_for_cleanup}")
```

### Socket Communication

```python
import socket
import json
from multiclaude_types import SocketRequest, SocketResponse, parse_socket_response

def send_command(command: str, args: dict | None = None) -> SocketResponse:
    request = SocketRequest(command=command, args=args)

    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
        sock.connect("/tmp/multiclaude.sock")
        sock.send(request.model_dump_json().encode() + b"\n")
        response = sock.recv(65536)
        return parse_socket_response(json.loads(response))

# Get daemon status
result = send_command("status")
if result.success:
    print(f"Daemon running: {result.data}")
```

### Safe Parsing

```python
from multiclaude_types import safe_parse_state

# Returns None instead of raising on invalid data
state = safe_parse_state(maybe_invalid_data)
if state is None:
    print("Invalid state data")
```

## Type Reference

### Literal Types

| Type | Values |
|------|--------|
| `AgentType` | `supervisor`, `worker`, `merge-queue`, `pr-shepherd`, `workspace`, `review`, `generic-persistent` |
| `TrackMode` | `all`, `author`, `assigned` |
| `TaskStatus` | `open`, `merged`, `closed`, `no-pr`, `failed`, `unknown` |

### Models

| Model | Description |
|-------|-------------|
| `State` | Root daemon state containing all repositories |
| `Repository` | A tracked repository with agents and config |
| `Agent` | An agent's current state |
| `TaskHistoryEntry` | Completed task record |
| `MergeQueueConfig` | Merge queue settings |
| `PRShepherdConfig` | PR shepherd settings |
| `ForkConfig` | Fork detection and upstream info |
| `SocketRequest` | Socket API request format |
| `SocketResponse[T]` | Socket API response format |
| `DaemonStatus` | Daemon health information |

### Helper Functions

| Function | Description |
|----------|-------------|
| `is_persistent_agent_type(type)` | Check if agent type auto-restarts |
| `default_merge_queue_config()` | Create default MQ config |
| `default_pr_shepherd_config()` | Create default PS config |

### Parsing Functions

| Function | Description |
|----------|-------------|
| `parse_state(data)` | Parse state, raise on error |
| `safe_parse_state(data)` | Parse state, return None on error |
| `parse_repository(data)` | Parse repository |
| `parse_agent(data)` | Parse agent |
| `parse_socket_response(data)` | Parse socket response |
| `parse_daemon_status(data)` | Parse daemon status |

## Type Checking

This package is fully typed and includes a `py.typed` marker (PEP 561). Works with mypy, pyright, and other type checkers.

```bash
# Check your code
mypy your_script.py
```

## Compatibility

- Python 3.10+
- Pydantic 2.0+
- Mirrors `@multiclaude/core` TypeScript types
