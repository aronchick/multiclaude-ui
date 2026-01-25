# multiclaude-tool

A Python template for building tools that integrate with the multiclaude daemon.

## Overview

This template provides:

- **Pydantic models** matching multiclaude's state structure
- **DaemonClient** for socket communication with the daemon
- **StateReader** for watching state.json changes
- **Example CLI** demonstrating common operations

## Installation

```bash
# Using uv (recommended)
uv pip install -e ".[dev]"

# Or using pip
pip install -e ".[dev]"
```

## Quick Start

### Check daemon status

```python
from multiclaude_tool import DaemonClient

client = DaemonClient()
if client.ping():
    status = client.status()
    print(f"Tracking {status.repos} repos with {status.agents} agents")
```

### Read current state

```python
from multiclaude_tool import StateReader

reader = StateReader()
state = reader.read()

for repo_name, repo in state.repos.items():
    print(f"{repo_name}: {len(repo.agents)} agents")
```

### Spawn a worker

```python
from multiclaude_tool import DaemonClient

client = DaemonClient()
worker_name = client.spawn_worker(
    task="Implement feature X",
    repo="my-repo",
)
print(f"Spawned worker: {worker_name}")
```

### Watch for state changes

```python
import asyncio
from multiclaude_tool import StateReader

async def watch():
    reader = StateReader()
    async for state in reader.watch():
        print(f"State updated: {len(state.repos)} repos")

asyncio.run(watch())
```

## CLI Usage

The template includes an example CLI:

```bash
# Check daemon status
multiclaude-tool status

# List all agents
multiclaude-tool agents

# List active workers
multiclaude-tool workers

# Spawn a new worker
multiclaude-tool spawn "Implement feature X" --repo my-repo

# Watch for state changes
multiclaude-tool watch
```

## Project Structure

```
multiclaude-tool/
├── src/multiclaude_tool/
│   ├── __init__.py      # Package exports
│   ├── types.py         # Pydantic models (State, Agent, etc.)
│   ├── client.py        # DaemonClient for socket communication
│   ├── state.py         # StateReader for file watching
│   └── cli.py           # Example CLI
├── tests/
│   └── test_types.py    # Type tests
├── pyproject.toml       # Project configuration
└── README.md
```

## Types Reference

### Core Types

| Type | Description |
|------|-------------|
| `State` | The entire daemon state |
| `Repository` | A tracked repository's state |
| `Agent` | An agent's state |
| `TaskHistoryEntry` | A completed task |

### Configuration Types

| Type | Description |
|------|-------------|
| `MergeQueueConfig` | Merge queue agent configuration |
| `PRShepherdConfig` | PR shepherd agent configuration |
| `ForkConfig` | Fork-related configuration |

### Literal Types

| Type | Values |
|------|--------|
| `AgentType` | supervisor, worker, merge-queue, pr-shepherd, workspace, review, generic-persistent |
| `TrackMode` | all, author, assigned |
| `TaskStatus` | open, merged, closed, no-pr, failed, unknown |

## Development

```bash
# Install dev dependencies
uv pip install -e ".[dev]"

# Run tests
pytest

# Run linter
ruff check .

# Run type checker
mypy src/
```

## Customizing

1. Rename the package from `multiclaude_tool` to your tool's name
2. Update `pyproject.toml` with your project details
3. Add your custom functionality to the client or create new modules
4. Update the CLI with your tool's commands

## Requirements

- Python 3.10+
- multiclaude daemon running (for socket communication)
- `watchfiles` package (for async state watching)
