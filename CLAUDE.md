# SFAgent Tools — Notes for Claude Code

This is a monorepo for the **sfagent-tools** plugin: an AI-driven testing toolkit for Salesforce Agentforce agents. The plugin ships for Claude Code, OpenAI Codex, and any MCP-compatible client (Cursor, Continue, Cline, Windsurf).

## What lives where

- `packages/server/` — `sfagent-tools-mcp-server` — the actual product (TypeScript MCP server). Published to npm. **Source of truth for all tool behavior.**
- `packages/claude-code-plugin/` — the Claude Code packaging (`.claude-plugin/plugin.json`, `.mcp.json` pointing at the npm server, skills, commands).
- `packages/codex-plugin/` — the OpenAI Codex packaging (`.codex-plugin/plugin.json`, `agents/openai.yaml`, marketplace.json).
- `demo/` — recorded demo videos and the recording pipeline (asciinema + agg + ffmpeg).
- `docs/` — progress logs and architecture decisions.
- `discovery-docs/` — original research that informed the design.

## Critical conventions

- **`subagent` terminology** — Agent Script v2.0 (April 2026) renamed "topic" to "subagent". The server uses `subagent` everywhere. The testing-API parser still accepts legacy `topic` field names for back-compat. **Don't reintroduce `topic` in new code.**
- **Production orgs are blocked** at the tool level (start_session, run_batch_test). Don't loosen this.
- **`sf agent preview` commands need an SFDX project dir on cwd.** The server materializes one in `os.tmpdir()/sfagent-tools-mcp-sfdx/` via `getSfProjectDir()`. Use that helper when adding any new `sf agent ...` invocations.
- **`sf agent trace` commands do NOT take `--target-org`** — traces are local to the SFDX project, not fetched from the org. We learned this the hard way.
- **`BotDefinition.BotUserId` is read-only via API** — agents must have their run-as user set through Salesforce Setup UI, not Apex/REST. Document this for users who hit it.

## When making changes

1. The MCP server (`packages/server/`) is the single source of truth. Both plugin packagings reference it via `npx -y sfagent-tools-mcp-server@latest`. Don't duplicate logic in the plugin folders.
2. Tool behavior change → bump server version, publish to npm, both plugins auto-pick it up on next `npx` invocation.
3. Plugin metadata change (description, displayName, install path) → bump the plugin version in `plugin.json` AND the root `marketplace.json` (the same number).
4. The version lives in five places — keep them in sync: root `package.json`, `packages/server/package.json`, both `plugin.json`s (`packages/claude-code-plugin/.claude-plugin/` + `packages/codex-plugin/.codex-plugin/`), plus the `plugins[0].version` field inside the **root** `.claude-plugin/marketplace.json`.

> **Marketplace layout:** the canonical Claude Code marketplace listing is the **root** `.claude-plugin/marketplace.json` (it points the community-submission's bare repo URL to `./packages/claude-code-plugin`). The plugin manifest itself stays at `packages/claude-code-plugin/.claude-plugin/plugin.json`. Don't re-add a `marketplace.json` inside `packages/claude-code-plugin/` — that created a duplicate listing. Codex has its own separate marketplace at `packages/codex-plugin/.agents/plugins/marketplace.json`.

## Things to be careful with

- **npm publish requires the user's security key** (2FA via WebAuthn). Tell the user to run `npm publish` themselves; don't try to script around it.
- **Salesforce CLI errors come in the org's locale** — the user's admin scratch org defaulted to Spanish until we updated `LanguageLocaleKey`. Helpful tip in CLAUDE.md for future scratch org setup: run an Apex `update User` to set `LanguageLocaleKey = 'en_US'` early.
- **Trace files are empty `{}`** when the agent didn't invoke actions. The `read_trace` tool falls back to reading raw JSON files from disk when sf CLI's parser dies on empty files — preserves graceful UX.

## Useful commands

```bash
# Build the server
npm run build

# Test the Claude Code plugin locally
claude --plugin-dir packages/claude-code-plugin

# Publish a new server version
cd packages/server && npm publish

# Smoke-test the full flow end-to-end
sf agent preview start --api-name <agent> --target-org <alias> --json
```

## Don't touch

- `demo/recordings/` (old hardcoded-output mockup recordings — kept for git history reference only; the real demos live at `demo/v2/recordings/` and `demo/sfagent-*-demo.{gif,mp4}`).
- The `.sfdx/` cache directories that Salesforce CLI creates.
