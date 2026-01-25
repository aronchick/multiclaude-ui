# multiclaude-ui

Community tools and interfaces for [multiclaude](https://github.com/dlorenc/multiclaude).

## Quick Start

```bash
# Clone with submodule
git clone --recursive https://github.com/aronchick/multiclaude-ui
cd multiclaude-ui

# Install and run dashboard
npm install
npm run web
```

Then open http://localhost:3000

## Packages

| Package | Description |
|---------|-------------|
| `@multiclaude/core` | TypeScript library for daemon communication |
| `@multiclaude/web` | React dashboard for monitoring agents |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run web dashboard in dev mode
npm run web

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm test
```

## Architecture

```
multiclaude-ui/
├── multiclaude/          # Submodule (dlorenc/multiclaude)
├── packages/
│   ├── core/             # @multiclaude/core - shared library
│   │   ├── src/
│   │   │   ├── types.ts      # TypeScript types from state.go
│   │   │   ├── client.ts     # DaemonClient (socket API)
│   │   │   ├── state.ts      # StateReader (file watcher)
│   │   │   └── messages.ts   # MessageReader
│   │   └── package.json
│   └── web/              # @multiclaude/web - React dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   └── components/
│       └── package.json
└── package.json          # Workspace root
```

## Adding a New Tool

1. Create `packages/mytool/`
2. Add `package.json` with dependency on `@multiclaude/core`
3. Implement your tool
4. Submit PR

## Using @multiclaude/core

```typescript
import { StateReader, DaemonClient } from '@multiclaude/core';

// Watch state changes
const reader = new StateReader();
reader.on('change', (state) => {
  console.log('Agents:', state.repos);
});
reader.start();

// Send commands to daemon
const client = new DaemonClient();
const status = await client.send('status');
console.log('Daemon status:', status);
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run build && npm run lint && npm test`
5. Submit PR

## License

MIT
