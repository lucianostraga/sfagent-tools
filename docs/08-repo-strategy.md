# Repository Strategy

## Two Repos, Two Purposes

| Repo | Purpose | Visibility |
|---|---|---|
| `agentforce-claude` | Research, planning, documentation, decision log | Private (your workspace) |
| `sfagent-tools` | The actual plugin -- this IS the marketplace listing | **Public** (GitHub) |

The marketplace installs directly from a Git repo. The repo root IS the plugin root. This is how every top plugin works (e.g., `github.com/obra/superpowers` -- the repo is the plugin).

---

## Plugin Repo Structure (`sfagent-tools`)

Modeled after Superpowers (#2 plugin, 294k installs) with the addition of an MCP server:

```
sfagent-tools/                         ← Repo root IS the plugin root
├── .claude-plugin/
│   └── plugin.json                    # Marketplace manifest
│
├── skills/
│   └── sfagent-tools/
│       └── SKILL.md                   # Auto-activating skill
│
├── commands/
│   ├── test.md                        # /sfagent-tools:test
│   ├── explore.md                     # /sfagent-tools:explore
│   └── report.md                      # /sfagent-tools:report
│
├── hooks/
│   └── hooks.json                     # SessionStart hook (optional)
│
├── .mcp.json                          # Points to bundled MCP server
│
├── src/                               # MCP server source (TypeScript)
│   ├── index.ts
│   ├── tools/
│   │   ├── orgs.ts
│   │   ├── agents.ts
│   │   ├── session.ts
│   │   ├── messaging.ts
│   │   ├── batch-test.ts
│   │   └── test-results.ts
│   ├── auth/
│   │   └── sf-auth.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── agent-api.ts
│       └── testing-api.ts
│
├── dist/                              # Compiled JS (committed, so users don't need to build)
│   └── index.js
│
├── package.json                       # Dependencies + build scripts
├── tsconfig.json
├── .gitignore
├── LICENSE                            # Apache 2.0
├── README.md                          # Marketplace-facing docs
└── CHANGELOG.md
```

### Key difference from Superpowers

Superpowers is prompt-only (no code, no MCP server). Our plugin has an MCP server because we make actual API calls to Salesforce. This means:

- We have a `src/` directory with TypeScript
- We have a `dist/` directory with compiled JS (committed to repo so users don't need `npm install` + build)
- We have a `.mcp.json` that starts the server
- We have a `package.json` with real dependencies

### dist/ is committed

The compiled `dist/` directory is committed to the repo. This is important because:
- Users install via `claude plugin install` -- there's no `npm install` step
- The `.mcp.json` points to `dist/index.js` directly
- No build tools required on the user's machine
- This is how MCP-bundled plugins work

---

## Installation Flow (from user's perspective)

```bash
# Install from marketplace
/plugin install sfagent-tools

# Or install from GitHub directly
claude plugin install github:your-username/sfagent-tools
```

The plugin system clones the repo, registers the MCP server from `.mcp.json`, loads skills from `skills/`, and registers commands from `commands/`. Done.

---

## Development Workflow

### Local development (on your machine)

```bash
# Clone the plugin repo
cd ~/Documents/workspace
git clone git@github.com:your-username/sfagent-tools.git
cd sfagent-tools

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally with Claude Code
claude --plugin-dir ./
```

### Iterating

```bash
# Edit TypeScript source
# Rebuild
npm run build

# Reload in Claude Code
/reload-plugins

# Test your changes
/sfagent-tools:test
```

### Publishing updates

```bash
# Bump version in plugin.json and package.json
# Build
npm run build

# Commit dist/ along with source changes
git add .
git commit -m "v0.2.0: add exploratory testing"
git push

# Users get updates via:
/plugin update sfagent-tools
```

---

## This Repo (agentforce-claude) Stays as Workspace

This repo contains:
- `discovery-docs/` -- Initial research from ChatGPT and Claude
- `docs/` -- Architecture decisions, API reference, security model, roadmap
- `.sfdx/` -- Tooling metadata from connected orgs

It is NOT the plugin. It's where we plan and document. When we're ready to build, we create the `sfagent-tools` repo separately.
