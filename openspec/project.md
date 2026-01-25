# Project Context

## Purpose

**multiclaude-ui** is a monorepo of self-contained tools and interfaces for interacting with the multiclaude agent swarm system. It serves as the community contribution point for UI/UX work, kept separate from the core multiclaude repo but always in sync with it.

### Goals
- **Multiple interfaces**: Slack bot, web dashboard, CLI enhancements, notifications, etc.
- **Shared utilities**: Common library for daemon communication, state parsing, message handling
- **Community contributions**: Easy for contributors to add new interfaces without touching core
- **Always in sync**: Main multiclaude repo as read-only submodule, regularly updated

### Architecture Overview
```
multiclaude-ui/
  packages/
    core/              # Shared utilities for daemon communication
    web/               # Local web dashboard (React + Tailwind)
    slack/             # Slack bot integration
    cli-extras/        # Additional CLI commands/TUI
    notifications/     # Desktop/system notifications
    ...                # Future interfaces
  multiclaude/         # READ-ONLY submodule of main repo
  scripts/             # Sync scripts, CI helpers
```

### What multiclaude does
multiclaude is a multi-agent orchestration system that coordinates specialized Claude Code agents:
- **Workers**: Complete assigned tasks, create PRs
- **Reviewers**: Code review with blocking/non-blocking feedback
- **Merge-Queue**: Merges PRs when CI passes, maintains main branch health
- **PR-Shepherd**: Manages PRs to upstream repositories (for forks)
- **Supervisor**: Coordinates the swarm, assigns work, handles escalations

The daemon runs locally at `~/.multiclaude/`, managing state via `state.json`, agent messages via the `messages/` directory, and communicating through `daemon.sock`.

## Development Philosophy

**This project is vibe coded.** AI agents write most of the code. Tool choices optimize for:
1. **Popularity** - More training data = better LLM output
2. **Simplicity** - Fewer abstractions = fewer mistakes
3. **Convention over configuration** - Standard patterns LLMs know well

## Tech Stack

> All choices prioritize LLM compatibility and mainstream popularity.

### Monorepo Tooling
- **npm workspaces** - Most training data, universal compatibility
- **Turborepo** - Popular, simple config, great caching
- **TypeScript** project references for cross-package types

### Shared Core (`packages/core`)
- **TypeScript** (strict mode)
- **Zod** for runtime validation - extremely popular, LLMs know it cold
- Zero framework dependencies - pure utilities

### Web Dashboard (`packages/web`)
- **React 18+** with TypeScript - the most popular UI framework by far
- **Vite** - fast, simple, well-known
- **Tailwind CSS** - extremely popular, LLMs excel at it
- **React Query (TanStack Query)** - the standard for data fetching
- **React Router** - the standard for routing
- **Lucide React** - popular icon library

### Slack Integration (`packages/slack`)
- **Bolt.js** (official Slack SDK) - most documented approach
- Simple event handlers, no frameworks

### Testing (All Packages)
- **Vitest** - fast, Vite-native, popular
- **React Testing Library** - the standard
- **Playwright** for e2e when needed

### Tooling
- **ESLint** + **Prettier** - the universal standard
- **TypeScript** strict mode everywhere
- **Changesets** for versioning (optional, can skip initially)

## Project Conventions

### Vibe Coding Guidelines

When AI generates code for this project:
- **Prefer explicit over clever** - verbose but clear beats concise but confusing
- **Use standard patterns** - don't invent new abstractions
- **Copy working examples** - adapt existing code rather than writing from scratch
- **Keep files small** - easier for LLMs to reason about (<200 lines ideal)
- **Inline over abstract** - duplication is fine, premature abstraction is not
- **Comments for context** - explain the "why" for non-obvious decisions

### Monorepo Rules

- **Self-contained packages**: Each package should work independently
- **Core is dependency-free**: `packages/core` has no UI framework deps
- **Import from core**: All packages use `@multiclaude/core` for daemon communication
- **No cross-package imports** except through core

### Package Structure
```
packages/<name>/
  src/
  tests/
  package.json        # Scoped: @multiclaude/<name>
  tsconfig.json       # Extends root config
  README.md           # Package-specific docs
```

### Code Style

- **Functional components only** (React packages)
- **Named exports** preferred over default exports
- **Explicit return types** on public APIs
- **Prefer `interface` over `type`** for object shapes
- **Use package aliases** (`@multiclaude/core`, not relative paths)

### Naming Conventions
- **Packages**: lowercase with hyphens (`cli-extras`)
- **Components**: PascalCase (`AgentCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAgentStatus.ts`)
- **Utilities**: camelCase (`formatTimestamp.ts`)
- **Types/Interfaces**: PascalCase (`DaemonState`, `AgentStatus`)

### Submodule Management

The main multiclaude repo (Go CLI tool) is included as a **read-only submodule** at `./multiclaude/`.

> Note: The main multiclaude CLI is written in Go. This UI repo is TypeScript/Node.
> The submodule gives us access to documentation, type definitions (via comments/specs),
> and ensures our interfaces stay compatible with the daemon.

```bash
# Update submodule to latest main
git submodule update --remote multiclaude

# Or via script
npm run sync:upstream
```

**Rules:**
- NEVER commit changes to the submodule
- Changes to core multiclaude go through the main repo
- CI checks submodule is on an official commit
- Types/interfaces can be imported from submodule for compatibility

### Git Workflow

- **Trunk-based development** with short-lived feature branches
- **Branch naming**: `feature/<package>/<description>`, `fix/<package>/<description>`
- **Commits**: Conventional commits with scope (`feat(web): add agent cards`)
- **PRs**: Squash merge to main
- **jj preferred** over git (per user preferences)

### Adding a New Package

1. Create `packages/<name>/` with standard structure
2. Package is auto-discovered via `packages/*` in workspace config
3. Extend shared tsconfig and eslint configs
4. Add to `turbo.json` pipeline if needed
5. Add brief description to root README

## Domain Context

### Key Entities

| Entity | Description |
|--------|-------------|
| **Agent** | A running Claude Code instance with a role (worker, reviewer, etc.) |
| **Task** | Work assigned to a worker agent |
| **Message** | Inter-agent communication (stored in `~/.multiclaude/messages/`) |
| **PR** | GitHub Pull Request created/managed by agents |
| **Daemon** | Background process managing agent coordination |

### Agent States
- `idle` - Waiting for work
- `working` - Actively on a task
- `blocked` - Waiting for human input or another agent
- `completed` - Finished current task

### Communication Flow
1. Supervisor assigns task to worker
2. Worker creates PR, signals completion
3. Merge-queue checks CI, may spawn reviewer
4. Reviewer posts feedback, reports to merge-queue
5. Merge-queue merges or spawns worker to fix

### Core Package Responsibilities

`@multiclaude/core` should provide:
- **DaemonClient**: Connect to daemon socket, send commands
- **StateParser**: Parse and validate `state.json`
- **MessageReader**: Read/watch message queue
- **Types**: All shared TypeScript types
- **Events**: Event emitter for real-time updates

### Daemon State Format (from ~/.multiclaude/state.json)

> These TypeScript types are derived from `multiclaude/internal/state/state.go`

```typescript
// Root state structure
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
  target_branch?: string;  // Usually "main"
}

interface Agent {
  type: AgentType;
  worktree_path: string;
  tmux_window: string;
  session_id: string;       // Claude session ID
  pid: number;              // 0 if not running
  task?: string;            // Only for workers
  summary?: string;         // Worker completion summary
  failure_reason?: string;  // Why task failed (workers only)
  created_at: string;       // ISO 8601
  last_nudge?: string;      // ISO 8601
  ready_for_cleanup?: boolean;  // Workers only
}

type AgentType =
  | 'supervisor'
  | 'worker'
  | 'merge-queue'
  | 'pr-shepherd'
  | 'workspace'
  | 'review'
  | 'generic-persistent';

interface TaskHistoryEntry {
  name: string;              // Worker name e.g., "clever-fox"
  task: string;              // Task description
  branch: string;            // Git branch
  pr_url?: string;           // PR URL if created
  pr_number?: number;        // PR number
  status: TaskStatus;
  summary?: string;
  failure_reason?: string;
  created_at: string;        // ISO 8601
  completed_at?: string;     // ISO 8601
}

type TaskStatus = 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';

interface MergeQueueConfig {
  enabled: boolean;          // Default: true
  track_mode: TrackMode;     // Default: 'all'
}

interface PRShepherdConfig {
  enabled: boolean;          // Default: true in fork mode
  track_mode: TrackMode;     // Default: 'author' in fork mode
}

type TrackMode = 'all' | 'author' | 'assigned';

interface ForkConfig {
  is_fork: boolean;
  upstream_url?: string;
  upstream_owner?: string;
  upstream_repo?: string;
  force_fork_mode?: boolean;
}
```

### Message Format (from ~/.multiclaude/messages/<repo>/<agent>/*.json)

```typescript
interface AgentMessage {
  id: string;          // e.g., "msg-27585239-ba05"
  from: string;        // Agent name or worker name
  to: string;          // Target agent type
  timestamp: string;   // ISO 8601
  body: string;        // Message content
  status: 'pending' | 'delivered' | 'read' | 'acknowledged';
}
```

Messages are stored as individual JSON files in `~/.multiclaude/messages/<repo>/<agent>/`.

### Socket API

The daemon exposes a Unix socket at `~/.multiclaude/daemon.sock` for programmatic control.

**Protocol**: JSON request/response over Unix socket

```typescript
// Request format
interface SocketRequest {
  command: string;
  args?: Record<string, unknown>;
}

// Response format
interface SocketResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

**Key commands** (see `multiclaude/docs/extending/SOCKET_API.md` for full reference):
- `ping` - Check if daemon is alive
- `status` - Get daemon status
- `list_repos` - List tracked repositories
- `list_agents` - List agents for a repo
- `add_agent` - Spawn a new agent
- `remove_agent` - Kill an agent
- `task_history` - Get task history

## Important Constraints

- **Submodule is read-only**: Never modify, only update
- **Core has no deps**: Keep `@multiclaude/core` dependency-free
- **Each package standalone**: Should work without other UI packages
- **Local-first**: All tools assume local daemon initially
- **Sync regularly**: CI should fail if submodule is stale (>1 week behind main)

## External Dependencies

### From Submodule
- Type definitions
- Protocol documentation
- Test fixtures

### Runtime
- **multiclaude daemon**: Unix socket at `~/.multiclaude/daemon.sock`
- **GitHub API**: Via `gh` CLI for PR status
- **Local filesystem**: `state.json`, `messages/`, `output/`
- **Slack API**: For slack package (requires bot token)

## Planned Packages

| Package | Purpose | Priority |
|---------|---------|----------|
| `core` | Shared daemon communication library | P0 |
| `web` | Local web dashboard | P0 |
| `slack` | Slack bot for notifications and commands | P1 |
| `cli-extras` | TUI, additional commands | P2 |
| `notifications` | Desktop notifications (macOS/Linux) | P2 |
| `vscode` | VS Code extension | P3 |
