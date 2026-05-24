# SFAgent Tools — Notes for Codex (and other agents reading AGENTS.md)

This is a monorepo for the **sfagent-tools** plugin: an AI-driven testing toolkit for Salesforce Agentforce agents. It works in OpenAI Codex (CLI + App), Claude Code, and any MCP-compatible client.

## What lives where

- `packages/server/` — `sfagent-tools-mcp-server` — the actual MCP server (TypeScript). Published to npm. **Source of truth for tool behavior.**
- `packages/codex-plugin/` — the Codex packaging (`.codex-plugin/plugin.json`, `skills/sfagent-tools/agents/openai.yaml`, marketplace.json).
- `packages/claude-code-plugin/` — the Claude Code packaging.
- `demo/` — recorded demos and the recording pipeline.
- `docs/`, `discovery-docs/` — progress logs and research.

## Critical conventions

- **`subagent` terminology** — Agent Script v2.0 (April 2026) renamed "topic" to "subagent". The server uses `subagent` everywhere. Don't reintroduce `topic` in new code.
- **Production orgs are blocked** at the tool level (start_session, run_batch_test). Don't loosen this.
- **`sf agent preview` commands need an SFDX project dir on cwd.** The server materializes one in `os.tmpdir()/sfagent-tools-mcp-sfdx/` via `getSfProjectDir()`. Use that helper for any new `sf agent ...` calls.
- **`sf agent trace` commands do NOT take `--target-org`** — traces are local files, not fetched from the org.
- **`BotDefinition.BotUserId` is read-only via API** — must be set through Salesforce Setup UI.

## When making changes

1. MCP server (`packages/server/`) is the single source of truth. Both plugin packagings reference it via `npx -y sfagent-tools-mcp-server@latest`.
2. Tool behavior change → bump server version, publish to npm, both plugins auto-pick it up.
3. Plugin metadata change → bump version in `plugin.json` AND `marketplace.json` (same number, both files).
4. Five places version lives — keep them in sync: root `package.json`, server `package.json`, both `plugin.json`s, marketplace.json's `plugins[0].version`.

## Codex-specific notes

- The Codex plugin's `.mcp.json` uses the `mcp_servers` wrapped format (not the flat one).
- `agents/openai.yaml` declares the MCP dependency so Codex auto-wires the server when installing the skill.
- Codex sandboxes MCP servers by default. The plugin's MCP server needs filesystem read access to `~/.sfdx/` and network access to `*.my.salesforce.com` — documented in `packages/codex-plugin/README.md`.

## Useful commands

```bash
# Build the server
npm run build

# Install the plugin into Codex
codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest

# Publish a new server version (requires npm 2FA)
cd packages/server && npm publish

# Smoke-test from Codex
codex exec --dangerously-bypass-approvals-and-sandbox "List my Salesforce orgs"
```

## Don't touch

- `demo/recordings/` — old hardcoded mockup recordings, kept for history.
- `.sfdx/` cache directories.
