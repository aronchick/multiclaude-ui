# Project Context

## Purpose

**multiclaude-ui** is a monorepo of community tools for [multiclaude](https://github.com/dlorenc/multiclaude). The project provides:
- A shared TypeScript library (`@multiclaude/core`) for daemon communication
- A React web dashboard (`@multiclaude/web`) for monitoring agents
- A foundation for community-contributed tools

### Goals
- **Shared library**: Common code for daemon communication, types, state watching
- **Self-contained packages**: Each package works independently
- **Extractable**: Any package can be forked out as its own repo
- **Community contributions**: Easy to add new tools as new packages
- **Single command**: `npm install && npm run web` to start dashboard

### Repository Structure
```
multiclaude-ui/
├── multiclaude/              # READ-ONLY submodule (source of truth)
│   ├── internal/state/       # Go types (state.go)
│   └── docs/extending/       # Socket API, state file docs
│
├── packages/
│   ├── core/                 # @multiclaude/core - shared library
│   │   ├── src/
│   │   │   ├── types.ts      # TypeScript types from state.go
│   │   │   ├── schemas.ts    # Zod validation schemas
│   │   │   ├── client.ts     # DaemonClient (socket API)
│   │   │   ├── state.ts      # StateReader (file watcher)
│   │   │   ├── messages.ts   # MessageReader
│   │   │   └── index.ts      # Public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                  # @multiclaude/web - React dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   └── components/
│       │       ├── AgentList.tsx
│       │       ├── TaskHistory.tsx
│       │       └── MessageFeed.tsx
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── docs/
│   └── CONTRIBUTING.md       # How to add new packages
│
├── .github/workflows/
│   └── ci.yml                # Build, lint, test CI
│
├── package.json              # Workspace root
├── turbo.json                # Build orchestration
└── tsconfig.json             # Base TypeScript config
```

## Philosophy

### Self-Contained but Shared

Each package in `packages/` is designed to be:

1. **Runnable from monorepo**: `npm run web` (from root)
2. **Extractable**: Fork repo, delete other packages, keep what you need
3. **Forkable**: Clone repo, vendor @multiclaude/core into your project
4. **Minimal**: Only essential dependencies

### Package Independence

Each package should:
- Have its own `package.json`
- Be buildable independently via Turborepo
- Include a README with standalone instructions
- Work if extracted to its own repo

## Packages

### packages/core (@multiclaude/core)

The shared library for daemon communication.

```typescript
import { DaemonClient, StateReader, Agent, Repository } from '@multiclaude/core';

// Send commands to daemon
const client = new DaemonClient();
const status = await client.send('status');

// Watch state changes
const reader = new StateReader();
reader.on('change', (state) => {
  console.log('Agents:', Object.keys(state.repos['myrepo'].agents));
});
reader.start();
```

**Files:**
- `types.ts` - All TypeScript interfaces matching Go types
- `schemas.ts` - Zod schemas for runtime validation
- `client.ts` - DaemonClient for socket communication
- `state.ts` - StateReader for watching state.json
- `messages.ts` - MessageReader for watching message files

### packages/web (@multiclaude/web)

React dashboard for monitoring agents.

**Tech**: React, Vite, Tailwind CSS
**Purpose**: Visual dashboard for monitoring agents
**Features**:
- Real-time agent status (AgentList component)
- Task history and PR tracking (TaskHistory component)
- Inter-agent message feed (MessageFeed component)
- Repo selection sidebar

**Run**: `npm run web` from repo root

## Future Packages (Ideas)

These can be added as new packages in `packages/`:

| Package | Description |
|---------|-------------|
| `slack` | Slack bot with /spawn and /status commands |
| `discord` | Discord bot with rich embeds |
| `cli-tui` | Terminal UI with Ink |
| `vscode` | VS Code extension |
| `prometheus` | Prometheus metrics exporter |
| `raycast` | Raycast extension |

## Development Workflow

### Quick Start

```bash
# Clone with submodule
git clone --recursive https://github.com/aronchick/multiclaude-ui
cd multiclaude-ui

# Install and run dashboard
npm install
npm run web
```

Then open http://localhost:3000

### Common Commands

```bash
npm install          # Install all dependencies
npm run build        # Build all packages (Turborepo)
npm run web          # Run web dashboard
npm run typecheck    # Type check all packages
npm run lint         # Lint all packages
npm test             # Run all tests
```

### Adding a New Package

1. Create `packages/mytool/` directory
2. Add `package.json` with `@multiclaude/core` as workspace dependency
3. Add `tsconfig.json` extending root config
4. Implement your package
5. Submit PR

See `docs/CONTRIBUTING.md` for detailed instructions.

## Build System

### Monorepo Tooling

- **npm workspaces** for package management
- **Turborepo** for build orchestration and caching
- **TypeScript strict mode** for type safety

### Package Layout

```json
// Root package.json
{
  "workspaces": ["packages/*"]
}
```

### CI Strategy

Single CI workflow that:
1. Checks out repo with submodule
2. Installs dependencies
3. Builds all packages (core first via Turborepo)
4. Runs typecheck, lint, and tests

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

When the multiclaude daemon adds new types:

```bash
# Update submodule to latest
git submodule update --remote multiclaude

# Manually update packages/core/src/types.ts to match
# multiclaude/internal/state/state.go

# Run build to verify
npm run build
```

## Contributing

### Adding a Package
1. Create `packages/mytool/` directory
2. Add `package.json` depending on `@multiclaude/core`
3. Implement your package
4. Run `npm run build && npm run lint`
5. Submit PR

### Modifying Core Library
1. Make changes in `packages/core/src/`
2. Update packages that depend on it if needed
3. Run full test suite: `npm test`
4. Submit PR

### Extracting for Standalone Use
1. Fork this repo
2. Delete packages you don't need
3. Vendor `@multiclaude/core` or keep as dependency
