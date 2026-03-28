# Plugin Structure

## Key Principle: The Repo IS the Plugin

The `sfagent-tools` GitHub repo root is the plugin root. This is how marketplace plugins work (same pattern as Superpowers, the #2 plugin with 294k installs).

```
/plugin install sfagent-tools
```

Clones the repo, registers everything. Done.

---

## Directory Layout

```
sfagent-tools/                         ← Repo root = plugin root
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
│   ├── index.ts                       # Server entry point (stdio transport)
│   ├── tools/
│   │   ├── orgs.ts                    # list_orgs tool
│   │   ├── agents.ts                  # list_agents tool
│   │   ├── session.ts                 # start_session, end_session tools
│   │   ├── messaging.ts              # send_message tool (SSE consumer)
│   │   ├── batch-test.ts             # run_batch_test tool
│   │   └── test-results.ts           # get_test_results tool
│   ├── auth/
│   │   └── sf-auth.ts                # @salesforce/core token reuse
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   └── utils/
│       ├── agent-api.ts              # Agent API REST/SSE client
│       └── testing-api.ts            # Testing API client
│
├── dist/                              # Compiled JS (COMMITTED to repo)
│   └── index.js                       # Users don't need to build
│
├── config/
│   └── project-scratch-def.json       # Scratch org definition for development
│
├── package.json                       # Dependencies + build scripts
├── tsconfig.json                      # TypeScript config
├── .gitignore                         # Excludes node_modules/, .sfdx/, credentials
├── LICENSE                            # Apache 2.0
├── CHANGELOG.md
└── README.md                          # Marketplace-facing docs
```

### Why `dist/` is committed

Unlike typical Node.js projects, `dist/` is committed because:
- Plugin install (`/plugin install`) clones the repo -- there's no `npm install` step for end users
- `.mcp.json` points to `dist/index.js` directly
- No build tools required on the user's machine
- This is how MCP-bundled plugins distribute compiled code

---

## Plugin Manifest

File: `.claude-plugin/plugin.json`

```json
{
  "name": "sfagent-tools",
  "version": "0.1.0",
  "description": "AI-powered testing and evaluation for Salesforce Agentforce agents. Run headless conversations, validate behavior, and generate reports.",
  "author": "TBD",
  "homepage": "https://github.com/TBD/sfagent-tools",
  "repository": "https://github.com/TBD/sfagent-tools",
  "license": "Apache-2.0",
  "keywords": [
    "salesforce",
    "agentforce",
    "testing",
    "agent-testing",
    "mcp"
  ]
}
```

---

## MCP Server Config

File: `.mcp.json`

```json
{
  "mcpServers": {
    "sfagent-tools": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"],
      "env": {}
    }
  }
}
```

- `${CLAUDE_PLUGIN_ROOT}` resolves to the plugin install directory (same pattern as Superpowers hooks)
- No environment variables with secrets
- Server reads auth from sf CLI internally via `@salesforce/core`

---

## Slash Commands

### `/sfagent-tools:test`
Run a test plan against an Agentforce agent. Accepts a YAML test spec or natural language test plan. Executes and generates a report.

### `/sfagent-tools:explore`
Start exploratory testing. Claude has open-ended conversations with the agent, probing edge cases based on a high-level description.

### `/sfagent-tools:report`
Generate or regenerate a test report from the most recent session data.

---

## Skill (Auto-Activating)

File: `skills/sfagent-tools/SKILL.md`

Frontmatter format (following Superpowers pattern):
```markdown
---
name: sfagent-tools
description: Use when testing or evaluating Salesforce Agentforce agents
---
```

The skill activates when Claude detects the user is working with Agentforce agents and wants to test them. It provides instructions on:
- How to use the 7 MCP tools
- How to interpret agent responses
- How to structure test conversations
- How to generate reports
- When to warn about sandbox-only requirements
- How to convert exploratory findings into YAML test specs

---

## Package Configuration

File: `package.json`

```json
{
  "name": "sfagent-tools",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "@salesforce/core": "^8.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Minimal dependency tree. Three runtime dependencies only.
