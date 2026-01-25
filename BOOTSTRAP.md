# Bootstrapping multiclaude-ui

This repo is a **community hub** - a registry, reference implementations, and templates. Tools live in their own repos.

## Quick Start Command

Give this to your **workspace agent**:

```
Bootstrap multiclaude-ui as a community hub with:

1. Registry structure:
   - registry/tools.yaml (empty list to start)
   - registry/categories.yaml (dashboard, notifications, library, extension, monitoring, automation)

2. Reference implementations:
   - reference/typescript/ (types.ts, client.ts, state-reader.ts, message-reader.ts)
   - reference/python/ (types.py, client.py, state_reader.py, message_reader.py)

   Types must match ./multiclaude/internal/state/state.go exactly.
   Socket client must match ./multiclaude/docs/extending/SOCKET_API.md

3. Templates:
   - templates/typescript-tool/ (package.json, tsconfig, src/, .github/workflows/ci.yml)
   - templates/python-tool/ (pyproject.toml, src/, .github/workflows/ci.yml)

4. Documentation:
   - docs/INTEGRATION.md (how to integrate with multiclaude)
   - docs/CONTRIBUTING.md (how to add your tool to registry)

5. Scripts:
   - scripts/sync-types.sh (update reference types from submodule)
   - scripts/new-tool.sh (scaffold a new tool from template)
   - scripts/validate-registry.sh (check all tools in registry are valid)

6. CI:
   - .github/workflows/ci.yml (validate registry, check types match submodule)

No npm packages. No dependencies. Reference code is copy-paste only.
```

## What Gets Created

```
multiclaude-ui/
├── multiclaude/              # Already exists (submodule)
├── registry/
│   ├── tools.yaml
│   └── categories.yaml
├── reference/
│   ├── typescript/
│   │   ├── types.ts
│   │   ├── client.ts
│   │   ├── state-reader.ts
│   │   └── message-reader.ts
│   └── python/
│       ├── types.py
│       ├── client.py
│       ├── state_reader.py
│       └── message_reader.py
├── templates/
│   ├── typescript-tool/
│   └── python-tool/
├── docs/
│   ├── INTEGRATION.md
│   └── CONTRIBUTING.md
├── scripts/
│   ├── sync-types.sh
│   ├── new-tool.sh
│   └── validate-registry.sh
└── .github/
    └── workflows/
        └── ci.yml
```

## Spawning Workers

```bash
# Worker 1: Registry structure
multiclaude worker create "Create registry/tools.yaml and registry/categories.yaml \
  with the schema from openspec/project.md. Start with empty tools list. \
  Categories: dashboard, notifications, library, extension, monitoring, automation."

# Worker 2: TypeScript reference
multiclaude worker create "Create reference/typescript/ with types.ts, client.ts, \
  state-reader.ts, message-reader.ts. \
  Types must exactly match ./multiclaude/internal/state/state.go. \
  Client must implement socket API from ./multiclaude/docs/extending/SOCKET_API.md. \
  State reader watches ~/.multiclaude/state.json with chokidar. \
  No package.json - this is copy-paste code, not a package."

# Worker 3: Python reference
multiclaude worker create "Create reference/python/ with types.py (Pydantic models), \
  client.py (socket client), state_reader.py (watchdog-based), message_reader.py. \
  Types must match ./multiclaude/internal/state/state.go. \
  Use standard library + pydantic + watchdog only. \
  No setup.py - this is copy-paste code, not a package."

# Worker 4: TypeScript template
multiclaude worker create "Create templates/typescript-tool/ scaffold: \
  package.json, tsconfig.json, src/index.ts, src/types.ts (copied from reference), \
  .github/workflows/ci.yml, README.md template. \
  The template should be a working starting point for any TS-based multiclaude tool."

# Worker 5: Python template
multiclaude worker create "Create templates/python-tool/ scaffold: \
  pyproject.toml (with uv), src/__init__.py, src/types.py (copied from reference), \
  .github/workflows/ci.yml, README.md template. \
  The template should be a working starting point for any Python-based multiclaude tool."

# Worker 6: Documentation
multiclaude worker create "Create docs/INTEGRATION.md explaining the 3 integration points \
  (socket API, state file, message files) with code examples. \
  Create docs/CONTRIBUTING.md explaining how to add a tool to the registry. \
  Reference ./multiclaude/docs/extending/ for accurate API details."

# Worker 7: Scripts
multiclaude worker create "Create scripts/sync-types.sh that reads \
  ./multiclaude/internal/state/state.go and updates reference/typescript/types.ts \
  and reference/python/types.py. \
  Create scripts/new-tool.sh that copies a template to a new directory. \
  Create scripts/validate-registry.sh that checks each tool URL in registry/tools.yaml is valid."

# Worker 8: CI
multiclaude worker create "Create .github/workflows/ci.yml that: \
  1. Checks out with submodules \
  2. Validates registry/tools.yaml is valid YAML \
  3. Runs scripts/validate-registry.sh \
  4. Checks reference types match submodule (run sync-types.sh, fail if diff)"
```

## Creating a New Tool Repo

Once this hub is set up, to create a new tool:

```bash
# Use the template generator
./scripts/new-tool.sh --name multiclaude-web --lang typescript

# This creates a new directory with:
# - Copy of reference implementation
# - CI workflow
# - README template
# - Package config

# Then create the repo on GitHub
gh repo create aronchick/multiclaude-web --public
cd multiclaude-web
git init && git add . && git commit -m "Initial scaffold"
git remote add origin git@github.com:aronchick/multiclaude-web.git
git push -u origin main

# Initialize with multiclaude for the brownian ratchet
multiclaude repo init https://github.com/aronchick/multiclaude-web
```

## Adding a Tool to the Registry

```bash
# Fork multiclaude-ui, add to registry/tools.yaml:
tools:
  - name: multiclaude-web
    repo: https://github.com/aronchick/multiclaude-web
    description: React-based web dashboard for monitoring agents
    category: dashboard
    language: typescript
    status: alpha
    maintainers:
      - aronchick

# Submit PR to multiclaude-ui
```

## Ecosystem Growth Strategy

### Phase 1: Foundation (this repo)
- Registry structure
- TypeScript + Python references
- Templates
- Documentation
- CI

### Phase 2: First Tools (separate repos)
- `multiclaude-web` - React dashboard
- `multiclaude-py` - Python client library
- `multiclaude-slack` - Slack notifications

### Phase 3: Community Growth
- Accept registry PRs from anyone
- Highlight featured tools
- Create more templates (Go, Rust, etc.)
- Add more categories as needed

### Phase 4: Scale
- Automated testing of registered tools
- Version compatibility matrix
- Tool discovery website
- Integration with multiclaude CLI (`multiclaude tools list`)

## The Brownian Ratchet for Tool Development

Each tool repo gets its own multiclaude instance:

```bash
# For multiclaude-web
multiclaude repo init https://github.com/aronchick/multiclaude-web
multiclaude worker create "Implement AgentList component..."

# For multiclaude-slack
multiclaude repo init https://github.com/someone/multiclaude-slack
multiclaude worker create "Implement slash command handler..."
```

Each tool evolves independently. PRs flow. CI validates. Merge-queue merges. Progress is permanent.

## Notes

- **This repo has no runtime dependencies** - It's documentation, YAML, and copy-paste code
- **Tools don't import from here** - They copy the reference implementation
- **Registry is the catalog** - Browse tools.yaml to find what exists
- **Templates bootstrap new tools** - Fork/copy, don't depend
