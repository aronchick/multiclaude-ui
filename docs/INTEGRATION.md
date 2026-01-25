# Integration Guide

This guide explains how to integrate with the multiclaude daemon from external applications using the `@multiclaude/core` library.

## Overview

There are three primary ways to integrate with multiclaude:

| Approach | Use Case | Capabilities |
|----------|----------|--------------|
| **DaemonClient** | Full control | Read/write - spawn agents, manage repos, send commands |
| **StateReader** | Real-time monitoring | Read-only - watch state changes reactively |
| **MessageReader** | Inter-agent communication | Read - watch for messages between agents |

## Installation

```bash
npm install @multiclaude/core
```

## Quick Start

### Check if Daemon is Running

```typescript
import { DaemonClient } from '@multiclaude/core';

const client = new DaemonClient();
const isRunning = await client.ping();

if (isRunning) {
  const status = await client.status();
  console.log(`Daemon PID: ${status.pid}`);
  console.log(`Uptime: ${status.uptime}`);
}
```

### Watch State Changes

```typescript
import { StateReader } from '@multiclaude/core';

const reader = new StateReader();

reader.on('change', (state) => {
  console.log(`Tracking ${Object.keys(state.repos).length} repositories`);

  for (const [name, repo] of Object.entries(state.repos)) {
    const agentCount = Object.keys(repo.agents).length;
    console.log(`  ${name}: ${agentCount} agents`);
  }
});

reader.on('error', (err) => console.error('State read error:', err));

await reader.start();
```

### Monitor Messages

```typescript
import { MessageReader } from '@multiclaude/core';

const reader = new MessageReader({ repo: 'my-repo' });

reader.on('message', (msg) => {
  console.log(`[${msg.from} -> ${msg.to}]: ${msg.content}`);
});

await reader.start();
```

---

## DaemonClient

The `DaemonClient` communicates with the multiclaude daemon via Unix socket at `~/.multiclaude/daemon.sock`.

### Constructor Options

```typescript
interface DaemonClientOptions {
  /** Path to daemon.sock. Defaults to ~/.multiclaude/daemon.sock */
  socketPath?: string;
  /** Timeout for socket operations in ms. Defaults to 30000 (30s). */
  timeout?: number;
}
```

### Repository Management

```typescript
const client = new DaemonClient();

// List all tracked repositories
const repos = await client.listRepos();
// => ['multiclaude-ui', 'my-project']

// Add a new repository
await client.addRepo('my-project', 'https://github.com/user/my-project', {
  mergeQueueEnabled: true,
  mergeQueueTrackMode: 'author',  // 'all' | 'author' | 'assigned'
});

// Get repository configuration
const config = await client.getRepoConfig('my-project');
// => { merge_queue_enabled: true, merge_queue_track_mode: 'author' }

// Update configuration
await client.updateRepoConfig('my-project', {
  mergeQueueEnabled: false,
});

// Set/get current (default) repository
await client.setCurrentRepo('my-project');
const current = await client.getCurrentRepo();
await client.clearCurrentRepo();

// Remove a repository
await client.removeRepo('my-project');
```

### Agent Management

```typescript
// List all agents for a repository
const agents = await client.listAgents('my-repo');

// Spawn a new worker agent
await client.addAgent(
  'my-repo',           // repository name
  'clever-fox',        // agent name
  'worker',            // type: 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review'
  'Implement feature X' // task description
);

// Mark a worker as completed
await client.completeAgent('my-repo', 'clever-fox', {
  summary: 'Implemented feature X with tests',
  // OR for failures:
  // failureReason: 'Could not complete due to...'
});

// Restart a stopped/crashed agent
await client.restartAgent('my-repo', 'clever-fox');

// Remove/kill an agent
await client.removeAgent('my-repo', 'clever-fox');
```

### Task History

```typescript
const history = await client.taskHistory('my-repo', 10); // limit to 10

for (const task of history.history) {
  console.log(`${task.name}: ${task.status}`);
  console.log(`  Task: ${task.task}`);
  if (task.pr_url) {
    console.log(`  PR: ${task.pr_url}`);
  }
}
```

### Administrative Commands

```typescript
// Get detailed daemon status
const status = await client.status();
// => { pid: 12345, uptime: "2h30m", repos: 3, agents: 7 }

// Trigger cleanup of dead agents
await client.triggerCleanup();

// Repair inconsistent state
await client.repairState();

// Route pending messages immediately
await client.routeMessages();

// Stop the daemon gracefully
await client.stop();
```

### Error Handling

```typescript
import { DaemonClient, DaemonError } from '@multiclaude/core';

const client = new DaemonClient();

try {
  await client.addAgent('my-repo', 'fox', 'worker', 'Do something');
} catch (error) {
  if (error instanceof DaemonError) {
    switch (error.code) {
      case 'DAEMON_NOT_RUNNING':
        console.error('Start daemon with: multiclaude start');
        break;
      case 'CONNECTION_REFUSED':
        console.error('Daemon is starting up, try again');
        break;
      case 'TIMEOUT':
        console.error('Daemon not responding');
        break;
      case 'COMMAND_FAILED':
        console.error('Command failed:', error.message);
        break;
      default:
        console.error('Socket error:', error.message);
    }
  }
}
```

---

## StateReader

The `StateReader` watches `~/.multiclaude/state.json` for changes, providing a reactive way to monitor the daemon's state without polling.

### Constructor Options

```typescript
interface StateReaderOptions {
  /** Path to state.json. Defaults to ~/.multiclaude/state.json */
  statePath?: string;
  /** Debounce delay in ms for rapid updates. Defaults to 100ms. */
  debounceMs?: number;
  /** Whether to emit initial state on start. Defaults to true. */
  emitInitial?: boolean;
}
```

### Events

```typescript
interface StateReaderEvents {
  change: (state: State) => void;  // Emitted when state changes
  error: (error: Error) => void;   // Emitted on read/parse errors
  ready: () => void;               // Emitted when watcher is ready
  close: () => void;               // Emitted when watcher is closed
}
```

### Usage Patterns

#### Continuous Watching

```typescript
import { StateReader } from '@multiclaude/core';

const reader = new StateReader();

reader.on('change', (state) => {
  // React to state changes
  updateUI(state);
});

reader.on('ready', () => {
  console.log('Watching state file');
});

await reader.start();

// Later: stop watching
await reader.stop();
```

#### One-Shot Read

```typescript
import { StateReader } from '@multiclaude/core';

// Read state once without watching
const state = await StateReader.readOnce();

// Safe version returns null on error
const state = await StateReader.safeReadOnce();

// Check if state file exists
if (StateReader.exists()) {
  const state = await StateReader.readOnce();
}
```

#### Access Cached State

```typescript
const reader = new StateReader();
await reader.start();

// Get last read state (cached)
const state = reader.getState();

// Force re-read
const fresh = await reader.refresh();
```

### State Structure

```typescript
interface State {
  version: number;
  currentRepo: string | null;
  repos: Record<string, Repository>;
}

interface Repository {
  name: string;
  githubUrl: string;
  localPath: string;
  mainBranch: string;
  agents: Record<string, Agent>;
  mergeQueue: MergeQueueConfig;
  prShepherd: PRShepherdConfig;
  fork: ForkConfig | null;
  taskHistory: TaskHistoryEntry[];
}

interface Agent {
  name: string;
  type: 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review';
  task: string;
  branch: string;
  createdAt: string;
  completedAt: string | null;
  prUrl: string | null;
  prNumber: number | null;
  lastNudge: string | null;
  exitedAt: string | null;
  exitCode: number | null;
}
```

---

## MessageReader

The `MessageReader` watches for inter-agent messages stored as JSON files in `~/.multiclaude/messages/`.

### Constructor Options

```typescript
interface MessageReaderOptions {
  /** Base path for messages. Defaults to ~/.multiclaude/messages */
  messagesPath?: string;
  /** Repository name to filter messages */
  repo?: string;
  /** Agent name to filter messages */
  agent?: string;
}
```

### Events

```typescript
interface MessageReaderEvents {
  message: (message: Message) => void;  // New message arrived
  error: (error: Error) => void;        // Read/parse error
  ready: () => void;                    // Watcher ready
  close: () => void;                    // Watcher closed
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  created_at: string;
  acknowledged?: boolean;
}
```

### Usage Patterns

#### Watch All Messages for a Repository

```typescript
import { MessageReader } from '@multiclaude/core';

const reader = new MessageReader({ repo: 'my-repo' });

reader.on('message', (msg) => {
  console.log(`[${msg.from} -> ${msg.to}]: ${msg.content}`);
});

await reader.start();
```

#### Watch Messages for Specific Agent

```typescript
const reader = new MessageReader({
  repo: 'my-repo',
  agent: 'clever-fox',
});

reader.on('message', (msg) => {
  // Only messages TO clever-fox
  handleIncomingMessage(msg);
});

await reader.start();
```

#### List and Manage Messages

```typescript
const reader = new MessageReader();

// List all pending messages for an agent
const messages = await reader.listMessages('my-repo', 'clever-fox');

// Read a specific message
const msg = await reader.readMessage('my-repo', 'clever-fox', 'msg-123');

// Acknowledge (delete) a message
const deleted = await reader.acknowledgeMessage('my-repo', 'clever-fox', 'msg-123');
```

---

## Schema Validation

All types have corresponding Zod schemas for runtime validation:

```typescript
import {
  StateSchema,
  RepositorySchema,
  AgentSchema,
  parseState,
  safeParseState,
  parseRepository,
  parseAgent,
} from '@multiclaude/core';

// Throws on invalid data
const state = parseState(untrustedJson);

// Returns null on invalid data
const state = safeParseState(untrustedJson);

// Direct Zod usage
const result = StateSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

---

## Common Integration Patterns

### Dashboard Application

```typescript
import { StateReader, DaemonClient } from '@multiclaude/core';

class Dashboard {
  private reader: StateReader;
  private client: DaemonClient;

  constructor() {
    this.reader = new StateReader();
    this.client = new DaemonClient();
  }

  async start() {
    // Watch for state changes
    this.reader.on('change', (state) => {
      this.updateRepoList(state.repos);
      this.updateAgentList(state);
    });

    await this.reader.start();
  }

  async spawnWorker(repo: string, task: string) {
    const name = this.generateAgentName();
    await this.client.addAgent(repo, name, 'worker', task);
  }

  private updateRepoList(repos: Record<string, Repository>) {
    // Update UI...
  }
}
```

### CI Integration

```typescript
import { DaemonClient } from '@multiclaude/core';

async function runCIAgent(repo: string, prNumber: number) {
  const client = new DaemonClient();

  // Check if daemon is running
  if (!await client.ping()) {
    throw new Error('Multiclaude daemon not running');
  }

  // Spawn review agent
  const agentName = `ci-review-${prNumber}`;
  await client.addAgent(repo, agentName, 'review', `Review PR #${prNumber}`);

  // Wait for completion (poll task history)
  while (true) {
    const history = await client.taskHistory(repo, 1);
    const task = history.history.find(t => t.name === agentName);

    if (task?.status === 'completed') {
      return { success: true, pr: task.pr_url };
    }
    if (task?.status === 'failed') {
      throw new Error('Review failed');
    }

    await sleep(5000);
  }
}
```

### Slack Bot Integration

```typescript
import { StateReader, MessageReader, DaemonClient } from '@multiclaude/core';

class SlackBot {
  private state: StateReader;
  private messages: MessageReader;
  private client: DaemonClient;

  async start() {
    this.state = new StateReader();
    this.client = new DaemonClient();

    // Notify on new agents
    this.state.on('change', (newState, oldState) => {
      this.detectNewAgents(newState, oldState);
    });

    await this.state.start();
  }

  async handleSlashCommand(repo: string, task: string) {
    // Spawn worker from Slack
    const name = `slack-${Date.now()}`;
    await this.client.addAgent(repo, name, 'worker', task);
    return `Spawned worker \`${name}\` for: ${task}`;
  }
}
```

---

## File Paths

| Path | Description |
|------|-------------|
| `~/.multiclaude/daemon.sock` | Unix socket for daemon communication |
| `~/.multiclaude/state.json` | Current daemon state (repos, agents) |
| `~/.multiclaude/messages/` | Inter-agent message files |
| `~/.multiclaude/wts/<repo>/` | Git worktrees for repositories |

---

## TypeScript Types

All exports are fully typed. Key types:

```typescript
// Agent types
type AgentType = 'supervisor' | 'worker' | 'merge-queue' | 'workspace' | 'review';

// Track modes for merge queue / PR shepherd
type TrackMode = 'all' | 'author' | 'assigned';

// Task statuses in history
type TaskStatus = 'running' | 'completed' | 'failed' | 'cancelled';

// Full interfaces
import type {
  State,
  Repository,
  Agent,
  MergeQueueConfig,
  PRShepherdConfig,
  TaskHistoryEntry,
  SocketRequest,
  SocketResponse,
  DaemonStatus,
} from '@multiclaude/core';
```

---

## Troubleshooting

### Daemon Not Running

```typescript
import { DaemonClient, DaemonError } from '@multiclaude/core';

const client = new DaemonClient();

try {
  await client.status();
} catch (e) {
  if (e instanceof DaemonError && e.code === 'DAEMON_NOT_RUNNING') {
    // Start daemon: multiclaude start
  }
}
```

### State File Missing

```typescript
import { StateReader } from '@multiclaude/core';

if (!StateReader.exists()) {
  console.log('No state file - daemon may not have been started yet');
}
```

### Permission Errors

The daemon socket requires the same user that started the daemon. If you get permission errors, ensure you're running as the correct user.

---

## See Also

- [multiclaude CLI Reference](../BOOTSTRAP.md) - CLI commands
- [Agent Types](../agents/) - Agent definitions and behaviors
- [@multiclaude/web](../packages/web/) - React dashboard using this library
