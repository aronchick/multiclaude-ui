# Bootstrapping multiclaude-ui

Monorepo with shared libraries (`lib/`) and self-contained tools (`tools/`).

## Quick Start Command

Give this to your **workspace agent**:

```
Bootstrap multiclaude-ui as a monorepo:

1. Root config:
   - package.json with npm workspaces: ["lib/typescript", "tools/*"]
   - turbo.json with build/test/lint pipelines
   - tsconfig.json base config (strict mode)
   - .eslintrc.js and .prettierrc

2. lib/typescript (@multiclaude/core):
   - package.json as @multiclaude/core
   - src/types.ts - interfaces from ./multiclaude/internal/state/state.go
   - src/schemas.ts - Zod validation
   - src/client.ts - DaemonClient for socket communication
   - src/state.ts - StateReader watching ~/.multiclaude/state.json
   - src/messages.ts - MessageReader watching message files
   - src/index.ts - public exports

3. lib/python (multiclaude-lib):
   - pyproject.toml with uv
   - src/multiclaude/types.py - Pydantic models
   - src/multiclaude/client.py - socket client
   - src/multiclaude/state.py - file watcher

4. tools/web (React dashboard scaffold):
   - package.json depending on @multiclaude/core
   - Vite + React + TypeScript + Tailwind
   - Basic App.tsx showing "multiclaude-ui"

5. CI:
   - .github/workflows/ci.yml building lib then tools

Reference ./multiclaude/internal/state/state.go for types.
Reference ./multiclaude/docs/extending/ for API details.
```

## What Gets Created

```
multiclaude-ui/
├── multiclaude/              # Already exists (submodule)
├── lib/
│   ├── typescript/           # @multiclaude/core
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts
│   │   │   ├── client.ts
│   │   │   ├── state.ts
│   │   │   ├── messages.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── python/               # multiclaude-lib
│       ├── src/multiclaude/
│       │   ├── __init__.py
│       │   ├── types.py
│       │   ├── client.py
│       │   └── state.py
│       └── pyproject.toml
├── tools/
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── package.json              # Workspace root
├── turbo.json
├── tsconfig.json
└── .github/workflows/ci.yml
```

## Spawning Workers

### Phase 1: Foundation (parallel)

```bash
# Worker 1: Monorepo scaffold
multiclaude worker create "Create root monorepo config: \
  package.json with workspaces ['lib/typescript', 'tools/*'], \
  turbo.json with build/test/lint pipelines, \
  base tsconfig.json (strict, ES2022, NodeNext), \
  .eslintrc.js with @typescript-eslint, \
  .prettierrc, \
  .gitignore for node_modules/dist/.env"

# Worker 2: TypeScript library
multiclaude worker create "Create lib/typescript as @multiclaude/core: \
  - src/types.ts matching ./multiclaude/internal/state/state.go exactly \
  - src/schemas.ts with Zod schemas for all types \
  - src/client.ts with DaemonClient class (Unix socket, JSON protocol) \
  - src/state.ts with StateReader (chokidar, debounced events) \
  - src/messages.ts with MessageReader \
  - src/index.ts exporting everything \
  - package.json, tsconfig.json \
  Reference ./multiclaude/docs/extending/SOCKET_API.md for client"

# Worker 3: Python library
multiclaude worker create "Create lib/python as multiclaude-lib: \
  - pyproject.toml with uv, pydantic, watchdog deps \
  - src/multiclaude/types.py with Pydantic models matching Go types \
  - src/multiclaude/client.py with DaemonClient (socket, JSON) \
  - src/multiclaude/state.py with StateReader (watchdog) \
  - src/multiclaude/__init__.py with public exports \
  Reference ./multiclaude/internal/state/state.go for types"

# Worker 4: CI workflow
multiclaude worker create "Create .github/workflows/ci.yml: \
  - Checkout with submodules: true \
  - Setup Node 20, cache npm \
  - npm ci, npm run build, npm run lint, npm run typecheck \
  - Setup Python, uv \
  - cd lib/python && uv sync && uv run pytest"
```

### Phase 2: Web Dashboard (after Phase 1)

```bash
# Worker 5: Web scaffold
multiclaude worker create "Create tools/web with Vite + React + Tailwind: \
  - package.json depending on @multiclaude/core (workspace:*) \
  - vite.config.ts, tailwind.config.js, postcss.config.js \
  - src/main.tsx, src/App.tsx \
  - Basic layout showing 'multiclaude-ui dashboard' \
  Verify: npm run dev starts, npm run build succeeds"

# Worker 6: Agent list component
multiclaude worker create "In tools/web, create AgentList component: \
  - Use StateReader from @multiclaude/core \
  - Display all agents grouped by repo \
  - Show: name, type, status badge, task (for workers) \
  - Auto-update on state changes \
  - Use Tailwind for styling"

# Worker 7: Task history component
multiclaude worker create "In tools/web, create TaskHistory component: \
  - Read task_history from state \
  - Show: worker name, task, status, PR link \
  - Color code: merged=green, open=blue, failed=red \
  - Most recent first"
```

### Phase 3: More Tools (parallel)

```bash
# Worker 8: Slack bot
multiclaude worker create "Create tools/slack with Bolt.js: \
  - package.json with @slack/bolt, @multiclaude/core \
  - src/app.ts with Slack app setup \
  - /spawn command that calls DaemonClient.send('add_agent') \
  - /status command showing agent counts \
  - Event handler for state changes -> channel messages"

# Worker 9: CLI TUI
multiclaude worker create "Create tools/cli-tui with Ink: \
  - package.json with ink, @multiclaude/core \
  - src/index.tsx with main app \
  - Agent list panel with real-time updates \
  - Keyboard navigation (j/k for up/down) \
  - Status bar showing daemon connection"

# Worker 10: Prometheus exporter
multiclaude worker create "Create tools/prometheus in Go: \
  - go.mod depending on prometheus/client_golang \
  - main.go with HTTP server on :9090 \
  - Metrics: agent_count{repo,type}, task_total{repo,status} \
  - Read state from ~/.multiclaude/state.json \
  - Refresh every 15 seconds"
```

## Development Commands

```bash
# Install all dependencies
npm install

# Build everything (libs first, then tools)
npm run build
# or: npx turbo build

# Run web dashboard
cd tools/web && npm run dev

# Run tests
npm test

# Lint everything
npm run lint

# Type check
npm run typecheck
```

## Adding a New Tool

```bash
# Manual way
mkdir -p tools/mytool/src
cd tools/mytool
npm init -y
# Add @multiclaude/core as dependency
# Add to turbo.json if needed

# Or create a template script
./scripts/new-tool.sh --name mytool --lang typescript
```

## Extracting a Tool

Want to use a tool standalone? Extract it:

```bash
./scripts/extract-tool.sh web ~/my-multiclaude-web

# Creates:
# ~/my-multiclaude-web/
#   ├── src/              # Tool code
#   ├── lib/              # Vendored @multiclaude/core
#   ├── package.json      # Standalone deps
#   └── README.md
```

Or just fork this repo and delete what you don't need.

## Multiclaude Commands Reference

```bash
# Start daemon
multiclaude start

# Initialize this repo
multiclaude repo init https://github.com/aronchick/multiclaude-ui

# Spawn a worker
multiclaude worker create "task description"

# List workers
multiclaude worker list

# Watch an agent
multiclaude agent attach <name> --read-only

# Check PR status
gh pr list
```

## The Brownian Ratchet

1. **Spawn workers** with clear, scoped tasks
2. **Workers create PRs** for each task
3. **CI validates** - runs build, lint, test
4. **Merge-queue merges** when CI passes
5. **Repeat** - main advances, new work unlocks

Watch it happen:
```bash
# See merge-queue in action
multiclaude agent attach merge-queue --read-only

# Check daemon logs
tail -f ~/.multiclaude/daemon.log
```

## Tool Ideas for Contributors

| Tool | Language | Description |
|------|----------|-------------|
| `tools/raycast` | TypeScript | Raycast extension |
| `tools/alfred` | TypeScript | Alfred workflow |
| `tools/telegram` | Python | Telegram bot |
| `tools/email` | Python | Email notifications |
| `tools/grafana` | Go | Grafana datasource |
| `tools/webhook` | Go | Generic webhook sender |
| `tools/desktop` | Rust | Desktop notifications |
| `tools/menubar` | Swift | macOS menu bar app |
