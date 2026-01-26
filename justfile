# multiclaude-ui justfile

# Default recipe - show available commands
default:
    @just --list

# Install dependencies
install:
    npm install

# Run web dashboard in dev mode (hot reload)
dev: install
    npm run web

# Build all packages
build: install
    npm run build

# Type check all packages
typecheck:
    npm run typecheck

# Lint all packages
lint:
    npm run lint

# Run all tests
test:
    npm test

# Clean build artifacts and node_modules
clean:
    npm run clean

# Build and run web dashboard
web: build
    npm run web

# Run all checks (what CI runs)
ci: build typecheck lint test

# Update multiclaude submodule to latest
sync-submodule:
    git submodule update --remote multiclaude

# Stop any running dev servers
stop:
    @lsof -ti:3000 | xargs kill 2>/dev/null || echo "No server running on port 3000"
