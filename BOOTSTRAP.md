# Bootstrapping multiclaude-ui

This document explains how to use multiclaude itself to build multiclaude-ui.

## Quick Start Command

Once this repo is initialized with multiclaude, give this command to your **workspace agent**:

```
Bootstrap the multiclaude-ui monorepo. Create the following structure:

1. Root monorepo config:
   - package.json with npm workspaces (packages/*)
   - turbo.json for build orchestration
   - tsconfig.json base config (strict mode)
   - .eslintrc.js shared config
   - .prettierrc

2. packages/core - Shared daemon communication library:
   - TypeScript types matching multiclaude/internal/state/state.go
   - DaemonClient class for Unix socket communication
   - StateReader class for watching state.json
   - MessageReader for watching message files
   - Zod schemas for runtime validation

3. packages/web - React dashboard (scaffold only):
   - Vite + React + TypeScript setup
   - Tailwind CSS configured
   - Basic App.tsx that imports from @multiclaude/core
   - Placeholder components: AgentList, MessageFeed, TaskHistory

Reference the submodule at ./multiclaude/ for:
- Type definitions in internal/state/state.go
- Socket API docs in docs/extending/SOCKET_API.md
- State file docs in docs/extending/STATE_FILE_INTEGRATION.md

Use npm workspaces (not pnpm). All TypeScript strict mode.
Make sure the build passes: npm install && npm run build
```

## What This Creates

```
multiclaude-ui/
├── multiclaude/              # READ-ONLY submodule (dlorenc/multiclaude)
├── packages/
│   ├── core/                 # @multiclaude/core
│   │   ├── src/
│   │   │   ├── types.ts      # TypeScript types from state.go
│   │   │   ├── schemas.ts    # Zod validation schemas
│   │   │   ├── client.ts     # DaemonClient (socket communication)
│   │   │   ├── state.ts      # StateReader (file watching)
│   │   │   ├── messages.ts   # MessageReader
│   │   │   └── index.ts      # Public API
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                  # @multiclaude/web
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── package.json              # Root workspace config
├── turbo.json                # Build orchestration
├── tsconfig.json             # Base TypeScript config
└── .eslintrc.js              # Shared ESLint config
```

## Initialize This Repo with multiclaude

```bash
# Make sure multiclaude daemon is running
multiclaude start

# Initialize this repo
multiclaude repo init https://github.com/aronchick/multiclaude-ui

# Attach to your workspace
tmux attach -t mc-multiclaude-ui

# Or connect directly to workspace
multiclaude workspace connect multiclaude-ui
```

## Spawning Workers

After the initial bootstrap, spawn workers for specific tasks:

```bash
# From your workspace or CLI:

# Build the core package
multiclaude worker create "Implement DaemonClient in packages/core - \
  connect to Unix socket at ~/.multiclaude/daemon.sock, \
  send JSON commands, parse responses. \
  Reference multiclaude/docs/extending/SOCKET_API.md"

# Build the state reader
multiclaude worker create "Implement StateReader in packages/core - \
  watch ~/.multiclaude/state.json for changes using chokidar, \
  emit events when state updates. \
  Reference multiclaude/docs/extending/STATE_FILE_INTEGRATION.md"

# Build the web dashboard
multiclaude worker create "Create AgentList component in packages/web - \
  display all agents across repos with status indicators, \
  use @multiclaude/core StateReader for data, \
  show agent type, task, created time, last nudge"
```

## Phase 1: Core Package (P0)

The core package is the foundation. Workers should complete these in order:

1. **Types** (`types.ts`)
   - Mirror Go types from `multiclaude/internal/state/state.go`
   - Export all interfaces and type unions

2. **Schemas** (`schemas.ts`)
   - Zod schemas for runtime validation
   - Parse functions that throw on invalid data

3. **StateReader** (`state.ts`)
   - Watch `~/.multiclaude/state.json`
   - Emit 'change' events with parsed state
   - Debounce rapid updates

4. **DaemonClient** (`client.ts`)
   - Connect to Unix socket
   - Send JSON-RPC requests
   - Handle responses and errors

5. **MessageReader** (`messages.ts`)
   - Watch message directories
   - Emit new messages as they arrive

## Phase 2: Web Dashboard (P1)

Once core is solid, build the dashboard:

1. **Layout** - Sidebar with repo list, main content area
2. **AgentList** - Show all agents with status
3. **MessageFeed** - Real-time message stream
4. **TaskHistory** - Completed tasks with PR links
5. **SpawnWorker** - Form to create new workers

## Phase 3: Additional Packages (P2+)

Future packages to consider:

- `packages/slack` - Slack bot using Bolt.js
- `packages/cli-extras` - TUI with blessed/ink
- `packages/notifications` - Desktop notifications

## CI/CD Setup

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

## Keeping Submodule in Sync

```bash
# Update submodule to latest main
git submodule update --remote multiclaude

# Verify types still match
npm run typecheck

# If types changed, update packages/core/src/types.ts
```

## Notes

- **multiclaude ROADMAP says** web UIs are out of scope for the core project, which is why this is a separate repo
- **The Socket API** is the primary integration point for full control
- **The State File** is simpler but read-only
- **All tools are vibe coded** - prioritize popular, LLM-friendly patterns
