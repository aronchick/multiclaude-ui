# Project Context

## Purpose

**multiclaude-ui** is a community hub for tools and interfaces that extend multiclaude. It is NOT a monorepo containing all the tools - instead, it's a **registry and reference implementation** that links to independent tool repositories.

### Goals
- **Registry**: Catalog of community-built multiclaude tools
- **Reference implementations**: Core libraries that other tools can copy/adapt
- **Templates**: Scaffolds for new tools in various languages
- **Documentation**: Shared guides for integrating with multiclaude
- **Submodule sync**: Keep multiclaude types/docs in sync across the ecosystem

### What This Repo Contains
```
multiclaude-ui/
├── multiclaude/              # READ-ONLY submodule (source of truth for types)
├── registry/                 # YAML catalog of community tools
│   ├── tools.yaml           # List of all registered tools
│   └── categories.yaml      # Tool categories
├── reference/                # Reference implementations (copy, don't import)
│   ├── typescript/          # TypeScript types + socket client
│   ├── python/              # Python types + socket client
│   └── go/                  # Go client (thin wrapper around multiclaude/pkg)
├── templates/                # Scaffolds for new tools
│   ├── typescript-tool/     # Create a new TS-based tool
│   ├── python-tool/         # Create a new Python-based tool
│   └── slack-bot/           # Slack bot starter
├── docs/                     # Shared documentation
│   ├── INTEGRATION.md       # How to integrate with multiclaude
│   ├── CONTRIBUTING.md      # How to add your tool to the registry
│   └── PUBLISHING.md        # How to publish/release tools
└── scripts/                  # Automation
    ├── sync-types.sh        # Update types from submodule
    └── validate-registry.sh # Check all registered tools are valid
```

### What Lives OUTSIDE This Repo (as separate repos)
- `multiclaude-web` - React dashboard
- `multiclaude-slack` - Slack bot
- `multiclaude-discord` - Discord bot
- `multiclaude-vscode` - VS Code extension
- `multiclaude-cli-tui` - Terminal UI
- `multiclaude-py` - Python client library
- `multiclaude-prometheus` - Prometheus exporter
- `multiclaude-notifications` - Desktop notifications
- ... hundreds more from the community

## Philosophy

### Why Separate Repos?

1. **Lower barrier to entry** - Contributors only need to understand their tool, not the whole ecosystem
2. **Language freedom** - Python tools, Go tools, Rust tools, not just TypeScript
3. **Independent release cycles** - Each tool versions independently
4. **Clear ownership** - Each repo has its own maintainers
5. **Easy to fork** - Want to customize a tool? Fork just that repo
6. **Discoverable** - Registry makes it easy to find tools

### This Repo's Role

| Role | Description |
|------|-------------|
| **Registry** | YAML files listing all community tools with metadata |
| **Reference** | Copy-paste implementations of types and clients |
| **Templates** | Scaffolds to bootstrap new tools quickly |
| **Sync point** | Single place to update when multiclaude changes |
| **Documentation** | Shared guides that all tools link to |

### NOT This Repo's Role

- ❌ Don't import from this repo as a dependency
- ❌ Don't build tools inside this repo
- ❌ Don't create npm/pip packages from this repo
- ❌ Don't add tool-specific code here

## Registry Format

### tools.yaml
```yaml
tools:
  - name: multiclaude-web
    repo: https://github.com/aronchick/multiclaude-web
    description: React-based web dashboard for monitoring agents
    category: dashboard
    language: typescript
    status: stable
    maintainers:
      - aronchick

  - name: multiclaude-slack
    repo: https://github.com/someone/multiclaude-slack
    description: Slack bot for notifications and commands
    category: notifications
    language: typescript
    status: beta
    maintainers:
      - someone

  - name: multiclaude-py
    repo: https://github.com/someone/multiclaude-py
    description: Python client library for multiclaude
    category: library
    language: python
    status: alpha
    maintainers:
      - someone
```

### categories.yaml
```yaml
categories:
  - id: dashboard
    name: Dashboards & UIs
    description: Visual interfaces for monitoring and managing agents

  - id: notifications
    name: Notifications
    description: Slack, Discord, email, desktop notifications

  - id: library
    name: Client Libraries
    description: Language-specific libraries for integrating with multiclaude

  - id: extension
    name: IDE Extensions
    description: VS Code, JetBrains, Vim/Neovim integrations

  - id: monitoring
    name: Monitoring & Metrics
    description: Prometheus, Grafana, observability tools

  - id: automation
    name: Automation
    description: CI/CD integrations, webhooks, bots
```

## Reference Implementations

These are **copy-paste** implementations, not packages to import. When you create a new tool:

1. Copy the reference implementation for your language
2. Adapt it to your needs
3. You own that code now - no dependency on this repo

### TypeScript Reference (`reference/typescript/`)
```typescript
// types.ts - Copy of types from multiclaude/internal/state/state.go
// client.ts - Socket client implementation
// state-reader.ts - State file watcher
// message-reader.ts - Message file watcher
```

### Python Reference (`reference/python/`)
```python
# types.py - Pydantic models matching multiclaude state
# client.py - Socket client implementation
# state_reader.py - State file watcher (watchdog)
# message_reader.py - Message file watcher
```

### Go Reference (`reference/go/`)
```go
// Thin wrapper around multiclaude/pkg/...
// Just re-exports the official packages
```

## Templates

Scaffolds for new tools. Run the template generator:

```bash
# Create a new TypeScript-based tool
./scripts/new-tool.sh --name multiclaude-mytool --lang typescript

# Create a new Python-based tool
./scripts/new-tool.sh --name multiclaude-pytool --lang python

# Create a Slack bot
./scripts/new-tool.sh --name multiclaude-myslack --template slack-bot
```

Templates include:
- Basic project structure
- Copy of reference implementation
- CI/CD workflow
- README template
- License (MIT)

## Keeping Types in Sync

When multiclaude updates its state format:

1. Update the submodule: `git submodule update --remote multiclaude`
2. Run sync script: `./scripts/sync-types.sh`
3. Script updates all reference implementations
4. Create PR, notify tool maintainers via registry

Tools should watch this repo for type changes and update accordingly.

## Contributing a Tool

See `docs/CONTRIBUTING.md` for full details. Quick version:

1. Create your tool in its own repo
2. Follow naming convention: `multiclaude-<toolname>`
3. Include reference implementation (copy, don't depend)
4. Add CI that tests against latest multiclaude
5. Submit PR to add your tool to `registry/tools.yaml`

## Development Philosophy

**This project is vibe coded.** AI agents write most of the code. Tool choices optimize for:
1. **Popularity** - More training data = better LLM output
2. **Simplicity** - Fewer abstractions = fewer mistakes
3. **Copy over import** - Each tool is self-contained

### Vibe Coding Guidelines

When AI generates code for tools in this ecosystem:
- **Prefer explicit over clever** - verbose but clear beats concise but confusing
- **Copy reference implementations** - don't try to be clever, use what works
- **Keep files small** - easier for LLMs to reason about (<200 lines ideal)
- **Inline over abstract** - duplication is fine, premature abstraction is not
- **Comments for context** - explain the "why" for non-obvious decisions

## Multiclaude Integration Points

All tools integrate with multiclaude through these interfaces:

### Socket API (Full Control)
- Location: `~/.multiclaude/daemon.sock`
- Protocol: JSON over Unix socket
- Use for: Spawning agents, sending messages, triggering operations
- Docs: `multiclaude/docs/extending/SOCKET_API.md`

### State File (Read-Only Monitoring)
- Location: `~/.multiclaude/state.json`
- Format: JSON (atomic writes, never corrupt)
- Use for: Watching agent status, task history, repo config
- Docs: `multiclaude/docs/extending/STATE_FILE_INTEGRATION.md`

### Message Files (Inter-Agent Communication)
- Location: `~/.multiclaude/messages/<repo>/<agent>/*.json`
- Format: JSON files per message
- Use for: Watching agent communication, message feeds

### State Types (from multiclaude/internal/state/state.go)

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

interface TaskHistoryEntry {
  name: string;
  task: string;
  branch: string;
  pr_url?: string;
  pr_number?: number;
  status: 'open' | 'merged' | 'closed' | 'no-pr' | 'failed' | 'unknown';
  summary?: string;
  failure_reason?: string;
  created_at: string;
  completed_at?: string;
}

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  body: string;
  status: 'pending' | 'delivered' | 'read' | 'acknowledged';
}
```

## Ecosystem Vision

```
                    ┌─────────────────────────────────────┐
                    │         multiclaude (core)          │
                    │   CLI + daemon + agent templates    │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │       multiclaude-ui (this repo)    │
                    │   Registry + References + Templates │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        │             │               │               │             │
        ▼             ▼               ▼               ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐
   │  -web   │  │  -slack  │  │   -vscode  │  │   -py    │  │  -metrics │
   │ React   │  │  Bolt.js │  │  Extension │  │  Python  │  │Prometheus │
   └─────────┘  └──────────┘  └────────────┘  └──────────┘  └───────────┘
        │             │               │               │             │
        └─────────────┴───────────────┴───────────────┴─────────────┘
                              Community tools
                        (hundreds of independent repos)
```

## Important Constraints

- **No packages published from this repo** - Reference code is copy-paste only
- **Tools must be self-contained** - Don't depend on this repo at runtime
- **Registry is the source of truth** - All tools listed in tools.yaml
- **Submodule stays in sync** - Update weekly at minimum
- **MIT license** - All reference code and templates are MIT

## Getting Started

### For Tool Users
Browse the registry, pick a tool, go to its repo, follow its README.

### For Tool Authors
1. Read `docs/CONTRIBUTING.md`
2. Copy a template or reference implementation
3. Build your tool in its own repo
4. Submit PR to add to registry

### For This Repo's Maintainers
1. Keep submodule updated
2. Sync reference implementations when multiclaude changes
3. Review registry PRs
4. Maintain templates
