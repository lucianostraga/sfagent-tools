# SFAgent Tools

**AI-powered testing for Salesforce Agentforce agents — for Claude Code AND OpenAI Codex.**

Tell your AI assistant what to test. It reads your agent's brain, has dozens of headless conversations with it, finds what's broken, and gives you a scored report with fix recommendations. Generates YAML specs you can hand off to `sf agent test run-eval` for CI regression.

No scripts. No YAML to write by hand. No new credentials — reuses your `sf` CLI authentication.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@sfagent/mcp-server.svg)](https://www.npmjs.com/package/@sfagent/mcp-server)

## Repository layout

This is a monorepo. The MCP server is the actual product — both plugin packagings are thin wrappers around it.

```
sfagent-tools/
├── packages/
│   ├── server/                # @sfagent/mcp-server — the MCP server (TypeScript)
│   ├── claude-code-plugin/    # Anthropic Claude Code packaging
│   └── codex-plugin/          # OpenAI Codex packaging
├── docs/                      # progress logs, architecture decisions
└── discovery-docs/            # research that informed the design
```

## Quick install

### Claude Code

```bash
/plugin marketplace add lucianostraga/sfagent-tools
/plugin install sfagent-tools@sfagent-tools-marketplace
```

Then in any project: `Generate tests for my Agentforce agent`.

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.sfagent-tools]
command = "npx"
args = ["-y", "@sfagent/mcp-server@latest"]
```

Or install the full Codex plugin (skills + marketplace metadata) — see [packages/codex-plugin/README.md](packages/codex-plugin/README.md).

### Direct MCP (any MCP-compatible client)

```bash
npx -y @sfagent/mcp-server@latest
```

## What's inside the MCP server

12 tools, organized into four groups:

**Discovery**
- `list_orgs` — sf-authenticated orgs
- `list_agents` — Agentforce agents in an org
- `get_agent_metadata` — full subagent/action map
- `load_config` — read user expectations from `sfagent-config.yaml`

**Live conversation**
- `start_session` / `send_message` / `end_session` — multi-turn via `sf agent preview`

**Native diagnostics** *(requires Salesforce CLI 2026-05-20 or later)*
- `list_traces` / `read_trace` — read Salesforce's own session traces

**Regression hand-off**
- `generate_test_spec` — turn an exploratory session into a `sf agent test run-eval` YAML
- `run_batch_test` / `get_test_results` — drive native test suites

## Why this exists

Salesforce ships strong native tooling for batch-spec Agentforce testing (Testing Center, `sf agent test run-eval`, on-disk traces). **What they don't ship is a way to drive exploratory, multi-turn, AI-orchestrated testing from inside your AI dev assistant.** That's the gap this fills.

The positioning is **collaborator, not competitor**: SFAgent Tools is the exploration step that feeds native YAML specs into Salesforce's regression pipeline.

## Status & versioning

- **v0.2.0** (this release): monorepo restructure, Codex packaging, new trace + spec-generation tools, subagent terminology aligned with Agent Script v2.0, spec compliance fixes for the Anthropic community marketplace.
- **v0.1.0**: Initial Claude Code plugin with 9 MCP tools.

All packages share the same version number.

## Compatibility notes

- **Salesforce CLI**: `agent preview` GA features require sf CLI v2.131+. Trace tools (`list_traces`, `read_trace`) require sf CLI from 2026-05-20 or later. The plugin still works without trace tools on older CLIs — those tool calls just return a clear error.
- **Auth**: Reuses `sf` CLI credentials via `@salesforce/core`'s `AuthInfo`/`Org`. Does NOT parse `sf org display --json`, so unaffected by the May 27, 2026 CLI token-redaction change.
- **Subagent vs topic**: Salesforce renamed "topic" to "subagent" in Agent Script v2.0 (April 2026). This server uses "subagent" everywhere; the Testing API parser still accepts legacy "topic" field names from older API versions.
- **Production orgs blocked**: `start_session` and `run_batch_test` refuse to target production orgs. Test against sandboxes, scratch orgs, or Developer Edition.

## Development

```bash
# Install dependencies (npm workspaces)
npm install

# Build the server
npm run build

# Watch mode while iterating
npm run dev
```

Local Claude Code testing:
```bash
claude --plugin-dir packages/claude-code-plugin
```

Local Codex testing — see [packages/codex-plugin/README.md](packages/codex-plugin/README.md) for marketplace setup.

## Contributing

Issues and PRs welcome. The MCP server in [packages/server/](packages/server/) is the single source of truth for tool behavior; both plugin packagings just wrap it. Changes to tool surface should ship as a server version bump.

## License

Apache-2.0 — see [LICENSE](packages/claude-code-plugin/LICENSE).
