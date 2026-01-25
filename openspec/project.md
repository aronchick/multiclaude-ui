# Project Context

## Purpose

**multiclaude-ui** is a monorepo of self-contained tools for multiclaude. Each tool lives in its own directory and can be:
- Used directly from this repo
- Forked/extracted as a standalone project
- Vendored into other projects
- Built as independent binaries

### Goals
- **Shared libraries**: Common code for daemon communication, types, utilities
- **Self-contained tools**: Each tool directory works independently
- **Extractable**: Any tool can be forked out as its own repo
- **Polyglot**: TypeScript, Python, Go, Rust - whatever fits the tool
- **Community contributions**: Easy to add new tools as new directories

### Repository Structure
```
multiclaude-ui/
├── multiclaude/              # READ-ONLY submodule (source of truth)
│
├── lib/                      # Shared libraries
│   ├── typescript/           # @multiclaude/core - npm package
│   │   ├── src/
│   │   │   ├── types.ts     # Types from multiclaude/internal/state/state.go
│   │   │   ├── client.ts    # DaemonClient (socket communication)
│   │   │   ├── state.ts     # StateReader (file watching)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── python/               # multiclaude-lib - pip package
│   │   ├── src/multiclaude/
│   │   │   ├── types.py     # Pydantic models
│   │   │   ├── client.py    # DaemonClient
│   │   │   └── state.py     # StateReader
│   │   └── pyproject.toml
│   │
│   └── go/                   # github.com/aronchick/multiclaude-ui/lib/go
│       ├── types.go
│       ├── client.go
│       └── go.mod
│
├── tools/                    # Self-contained tools
│   ├── web/                  # React dashboard
│   │   ├── src/
│   │   ├── package.json     # Depends on ../../lib/typescript
│   │   └── README.md
│   │
│   ├── slack/                # Slack bot
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── cli-tui/              # Terminal UI
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── vscode/               # VS Code extension
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── prometheus/           # Prometheus exporter
│   │   ├── main.go
│   │   └── go.mod
│   │
│   └── discord/              # Discord bot
│       ├── src/
│       └── pyproject.toml
│
├── templates/                # Scaffolds for new tools
│   ├── typescript/
│   ├── python/
│   └── go/
│
├── scripts/                  # Automation
│   ├── sync-types.sh        # Update types from submodule
│   ├── new-tool.sh          # Create new tool from template
│   └── extract-tool.sh      # Extract tool as standalone repo
│
└── docs/
    ├── INTEGRATION.md
    └── CONTRIBUTING.md
```

## Philosophy

### Self-Contained but Shared

Each tool in `tools/` is designed to be:

1. **Runnable from monorepo**: `cd tools/web && npm run dev`
2. **Extractable**: `./scripts/extract-tool.sh web` creates standalone repo
3. **Forkable**: Clone repo, delete other tools, keep what you need
4. **Vendorable**: Copy `lib/typescript/` into your project

### Library Philosophy

The `lib/` packages are:
- **Published to registries**: npm, PyPI for easy consumption
- **Vendorable**: Copy the code if you don't want the dependency
- **Minimal dependencies**: Only what's absolutely necessary
- **Type-safe**: Full TypeScript/Pydantic/Go types

### Tool Independence

Each tool should:
- Have its own `package.json`/`pyproject.toml`/`go.mod`
- Be buildable independently: `cd tools/web && npm run build`
- Have its own CI job
- Include a README with standalone instructions
- Work if extracted to its own repo

## Shared Libraries

### lib/typescript (@multiclaude/core)

```typescript
// Published to npm as @multiclaude/core
import { DaemonClient, StateReader, Agent, Repository } from '@multiclaude/core';

const client = new DaemonClient();
const status = await client.send('status');

const reader = new StateReader();
reader.on('change', (state) => {
  console.log('Agents:', Object.keys(state.repos['myrepo'].agents));
});
```

**Files:**
- `types.ts` - All TypeScript interfaces matching Go types
- `schemas.ts` - Zod schemas for runtime validation
- `client.ts` - DaemonClient for socket communication
- `state.ts` - StateReader for watching state.json
- `messages.ts` - MessageReader for watching message files

### lib/python (multiclaude-lib)

```python
# pip install multiclaude-lib
from multiclaude import DaemonClient, StateReader, Agent

client = DaemonClient()
status = client.send('status')

reader = StateReader()
for state in reader.watch():
    print(f"Agents: {list(state.repos['myrepo'].agents.keys())}")
```

**Files:**
- `types.py` - Pydantic models matching Go types
- `client.py` - DaemonClient for socket communication
- `state.py` - StateReader using watchdog

### lib/go

```go
// import "github.com/aronchick/multiclaude-ui/lib/go"
import mclib "github.com/aronchick/multiclaude-ui/lib/go"

client := mclib.NewClient()
status, _ := client.Send("status", nil)

reader := mclib.NewStateReader()
reader.Watch(func(state *mclib.State) {
    fmt.Println("Agents:", state.Repos["myrepo"].Agents)
})
```

## Tools

### tools/web - React Dashboard

**Tech**: React, Vite, Tailwind, TanStack Query
**Purpose**: Visual dashboard for monitoring and managing agents
**Features**:
- Real-time agent status
- Task history and PR tracking
- Spawn workers from UI
- Message feed

### tools/slack - Slack Bot

**Tech**: TypeScript, Bolt.js
**Purpose**: Slack notifications and commands
**Features**:
- `/spawn <task>` - Spawn a worker
- `/status` - Get agent status
- Notifications on PR created/merged
- Thread updates for long-running tasks

### tools/cli-tui - Terminal UI

**Tech**: TypeScript, Ink or Blessed
**Purpose**: Rich terminal interface
**Features**:
- Split panes for multiple agents
- Real-time log streaming
- Keyboard navigation
- Works over SSH

### tools/vscode - VS Code Extension

**Tech**: TypeScript, VS Code API
**Purpose**: IDE integration
**Features**:
- Status bar with agent count
- Spawn workers from command palette
- Side panel with agent list
- Inline PR status

### tools/prometheus - Metrics Exporter

**Tech**: Go
**Purpose**: Prometheus metrics for observability
**Features**:
- Agent count by type/status
- Task completion rate
- PR merge latency
- Message queue depth

### tools/discord - Discord Bot

**Tech**: Python, discord.py
**Purpose**: Discord notifications and commands
**Features**:
- Similar to Slack bot
- Rich embeds for status
- Thread per task

## Development Workflow

### Working on a Tool

```bash
# Install dependencies
npm install  # or: cd tools/web && npm install

# Run a specific tool
cd tools/web && npm run dev

# Build all
npm run build

# Test all
npm test
```

### Adding a New Tool

```bash
# Use the template generator
./scripts/new-tool.sh --name mytool --lang typescript

# This creates tools/mytool/ with:
# - Package config
# - Dependency on lib/typescript
# - Basic structure
# - CI job
```

### Extracting a Tool

```bash
# Create standalone repo from a tool
./scripts/extract-tool.sh web ~/multiclaude-web

# Result: ~/multiclaude-web/ with:
# - Tool code
# - Vendored lib/typescript (or npm dependency)
# - Standalone package.json
# - Its own git history
```

## Build System

### Monorepo Tooling

- **npm workspaces** for package management
- **Turborepo** for build orchestration and caching
- **TypeScript project references** for fast builds

### Package Layout

```json
// Root package.json
{
  "workspaces": [
    "lib/typescript",
    "tools/*"
  ]
}
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### CI Strategy

Each tool gets its own CI job that:
1. Builds lib/typescript first
2. Builds the tool
3. Runs tool-specific tests
4. Can publish independently

## Types (from multiclaude/internal/state/state.go)

All libraries implement these types:

```typescript
interface DaemonState {
  repos: Record<string, Repository>;
  current_repo?: string;
}

interface Repository {
  github_url: string;
  tmux_session: string;
  agents: Record<string, Agent>;
  task_history?: TaskHistoryEntry[];
  merge_queue_config?: MergeQueueConfig;
  pr_shepherd_config?: PRShepherdConfig;
  fork_config?: ForkConfig;
  target_branch?: string;
}

interface Agent {
  type: AgentType;
  worktree_path: string;
  tmux_window: string;
  session_id: string;
  pid: number;
  task?: string;
  summary?: string;
  failure_reason?: string;
  created_at: string;
  last_nudge?: string;
  ready_for_cleanup?: boolean;
}

type AgentType =
  | 'supervisor' | 'worker' | 'merge-queue'
  | 'pr-shepherd' | 'workspace' | 'review'
  | 'generic-persistent';

type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';
```

## Integration Points

### Socket API
- Location: `~/.multiclaude/daemon.sock`
- Protocol: JSON over Unix socket
- Docs: `multiclaude/docs/extending/SOCKET_API.md`

### State File
- Location: `~/.multiclaude/state.json`
- Format: Atomic JSON writes
- Docs: `multiclaude/docs/extending/STATE_FILE_INTEGRATION.md`

### Message Files
- Location: `~/.multiclaude/messages/<repo>/<agent>/*.json`
- Format: One JSON file per message

## Development Philosophy

**This project is vibe coded.** Choices optimize for LLM compatibility:

1. **Popular tools** - More training data = better output
2. **Simple patterns** - Avoid clever abstractions
3. **Small files** - <200 lines ideal for LLM context
4. **Explicit code** - Verbose > clever
5. **Copy-friendly** - Each tool works standalone

## Keeping Types in Sync

```bash
# Update submodule
git submodule update --remote multiclaude

# Regenerate types in all libraries
./scripts/sync-types.sh

# This updates:
# - lib/typescript/src/types.ts
# - lib/python/src/multiclaude/types.py
# - lib/go/types.go
```

## Contributing

### Adding a Tool
1. Run `./scripts/new-tool.sh --name mytool --lang typescript`
2. Implement in `tools/mytool/`
3. Add CI job in `.github/workflows/`
4. Submit PR

### Modifying Libraries
1. Make changes in `lib/<lang>/`
2. Update all tools that depend on it
3. Run full test suite
4. Submit PR

### Extracting for Standalone Use
1. Fork this repo
2. Delete tools you don't need
3. Or use `./scripts/extract-tool.sh` for clean extraction
