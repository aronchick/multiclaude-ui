# TypeScript Tool Template

This template provides a starting point for building custom multiclaude integrations in TypeScript.

## Features

- Full TypeScript support with strict mode
- Uses `@multiclaude/core` for daemon communication
- Example CLI tool demonstrating common patterns
- Real-time state and message watching

## Quick Start

1. **Copy this template** to your project:
   ```bash
   cp -r templates/typescript-tool my-tool
   cd my-tool
   ```

2. **Update package.json** with your tool's name and description.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
typescript-tool/
├── src/
│   └── index.ts      # Main entry point with example CLI
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Using @multiclaude/core

### DaemonClient

Connect to the daemon via Unix socket:

```typescript
import { DaemonClient, DaemonError } from '@multiclaude/core';

const client = new DaemonClient();

// Check if daemon is running
const isAlive = await client.ping();

// Get daemon status
const status = await client.status();
console.log(`PID: ${status.pid}, Repos: ${status.repos}`);

// List repositories
const repos = await client.listRepos();

// Spawn a worker
await client.addAgent('my-repo', 'clever-fox', 'worker', 'Add auth feature');

// Handle errors
try {
  await client.status();
} catch (error) {
  if (error instanceof DaemonError) {
    if (error.code === 'DAEMON_NOT_RUNNING') {
      console.error('Start daemon with: multiclaude start');
    }
  }
}
```

### StateReader

Watch state.json for real-time updates:

```typescript
import { StateReader, type State } from '@multiclaude/core';

const reader = new StateReader();

reader.on('change', (state: State) => {
  console.log('State updated:', state);
});

reader.on('error', (error: Error) => {
  console.error('Error:', error.message);
});

await reader.start();

// Later...
reader.stop();
```

### MessageReader

Watch for inter-agent messages:

```typescript
import { MessageReader, type Message } from '@multiclaude/core';

const reader = new MessageReader({ repo: 'my-repo' });

reader.on('message', (message: Message) => {
  console.log(`${message.from} -> ${message.to}: ${message.content}`);
});

await reader.start();
```

## Example Use Cases

### Slack Bot

```typescript
import { App } from '@slack/bolt';
import { DaemonClient } from '@multiclaude/core';

const app = new App({ token: process.env.SLACK_TOKEN, ... });
const client = new DaemonClient();

app.command('/spawn', async ({ command, ack }) => {
  await ack();

  const [repo, ...taskParts] = command.text.split(' ');
  const task = taskParts.join(' ');

  await client.addAgent(repo, generateName(), 'worker', task);
});
```

### Web Dashboard API

```typescript
import express from 'express';
import { DaemonClient, StateReader } from '@multiclaude/core';

const app = express();
const client = new DaemonClient();

app.get('/api/status', async (req, res) => {
  const status = await client.status();
  res.json(status);
});

app.get('/api/repos', async (req, res) => {
  const repos = await client.listRepos();
  res.json(repos);
});

app.post('/api/spawn', async (req, res) => {
  const { repo, task } = req.body;
  await client.addAgent(repo, generateName(), 'worker', task);
  res.json({ success: true });
});
```

### CI/CD Integration

```typescript
import { DaemonClient } from '@multiclaude/core';

async function spawnReviewWorker(prNumber: number) {
  const client = new DaemonClient();

  await client.addAgent(
    'my-repo',
    `pr-${prNumber}-reviewer`,
    'review',
    `Review PR #${prNumber}`
  );
}
```

## Available Commands

The example CLI (`src/index.ts`) includes these commands:

| Command | Description |
|---------|-------------|
| `status` | Show daemon status |
| `repos` | List tracked repositories |
| `workers <repo>` | List workers in a repository |
| `spawn <repo> <task>` | Spawn a new worker |
| `watch` | Watch state.json for changes |
| `messages <repo>` | Watch messages for a repository |
| `help` | Show help message |

## Development

```bash
# Build once
npm run build

# Watch mode for development
npm run dev

# Type check without building
npm run typecheck

# Lint
npm run lint
```

## Tips

1. **Handle daemon not running**: Always wrap daemon calls in try/catch and check for `DaemonError` with code `DAEMON_NOT_RUNNING`.

2. **Use StateReader for monitoring**: If you need to watch for changes, use `StateReader` instead of polling the socket API.

3. **Debounce state updates**: `StateReader` already debounces rapid updates (default 100ms), but you may want additional debouncing in your UI.

4. **Graceful shutdown**: Always call `reader.stop()` when shutting down to clean up file watchers.

## Related Documentation

- [Socket API Reference](../../multiclaude/docs/extending/SOCKET_API.md)
- [State File Integration](../../multiclaude/docs/extending/STATE_FILE_INTEGRATION.md)
- [multiclaude Architecture](../../multiclaude/docs/ARCHITECTURE.md)
