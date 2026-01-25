# Contributing to multiclaude-ui

## Adding a New Tool

### 1. Create the package

```bash
mkdir -p packages/mytool/src
cd packages/mytool
```

### 2. Create package.json

```json
{
  "name": "@multiclaude/mytool",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@multiclaude/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### 4. Implement your tool

```typescript
// src/index.ts
import { StateReader, DaemonClient } from '@multiclaude/core';

// Your implementation
```

### 5. Test it

```bash
npm install
npm run build
```

## Tool Ideas

| Tool | Description | Language |
|------|-------------|----------|
| `slack` | Slack bot for notifications | TypeScript |
| `discord` | Discord bot | TypeScript/Python |
| `cli-tui` | Terminal UI with Ink | TypeScript |
| `vscode` | VS Code extension | TypeScript |
| `prometheus` | Metrics exporter | Go |
| `raycast` | Raycast extension | TypeScript |
| `telegram` | Telegram bot | Python |

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Small files (<200 lines)
- Explicit types on public APIs
- Comments for non-obvious logic

## Pull Request Process

1. Fork and create a branch
2. Make your changes
3. Ensure `npm run build && npm run lint` passes
4. Update README if adding a new package
5. Submit PR with clear description

## Using the Core Library

### StateReader

Watch for state changes:

```typescript
import { StateReader } from '@multiclaude/core';

const reader = new StateReader();

reader.on('change', (state) => {
  for (const [name, repo] of Object.entries(state.repos)) {
    console.log(`${name}: ${Object.keys(repo.agents).length} agents`);
  }
});

reader.start();
```

### DaemonClient

Send commands to the daemon:

```typescript
import { DaemonClient } from '@multiclaude/core';

const client = new DaemonClient();

// Check status
const status = await client.status();
console.log(`Daemon running: ${status.running}`);

// Spawn a worker
await client.send('add_agent', {
  repo: 'my-repo',
  name: 'swift-fox',
  type: 'worker',
  task: 'Fix the login bug'
});

// List agents
const agents = await client.send('list_agents', { repo: 'my-repo' });
```

### MessageReader

Watch for inter-agent messages:

```typescript
import { MessageReader } from '@multiclaude/core';

const reader = new MessageReader('my-repo', 'supervisor');

reader.on('message', (msg) => {
  console.log(`${msg.from} -> ${msg.to}: ${msg.body}`);
});

reader.start();
```
