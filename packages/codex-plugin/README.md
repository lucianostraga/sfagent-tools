# SFAgent Tools — Codex Plugin

AI-powered testing for Salesforce Agentforce agents inside [OpenAI Codex](https://developers.openai.com/codex). Tell Codex what to test, and it reads your agent's configuration, runs headless conversations, and produces a scored report plus a YAML spec you can run with `sf agent test run-eval`.

This is the Codex packaging of [`sfagent-tools`](https://github.com/lucianostraga/sfagent-tools). The Claude Code packaging lives in `../claude-code-plugin/`. Both share the same MCP server: [`@sfagent/mcp-server`](https://www.npmjs.com/package/@sfagent/mcp-server).

## Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf` v2.131 or later — needed for `agent preview` GA features)
- A Salesforce sandbox, scratch org, or Developer Edition with at least one Agentforce agent
- `sf org login web --alias <your-org>` already run (the plugin reuses your sf CLI auth — no new credentials)
- Node.js 20+ (for `npx`-based MCP server install)
- Codex CLI or desktop app (March 2026 plugin system or later)

## Install

### Option 1 — Add the personal marketplace (recommended)

```bash
git clone https://github.com/lucianostraga/sfagent-tools.git
mkdir -p ~/.agents/plugins
cp -r sfagent-tools/packages/codex-plugin ~/.codex/plugins/cache/sfagent-tools-marketplace/sfagent-tools/local
```

Then in your `~/.agents/plugins/marketplace.json`, add an entry pointing at the cloned directory. Or run Codex's `@plugin-creator` skill to set this up interactively.

### Option 2 — Reference directly in `~/.codex/config.toml`

If you only want the MCP server (without the skills layer), add this to `~/.codex/config.toml`:

```toml
[mcp_servers.sfagent-tools]
command = "npx"
args = ["-y", "@sfagent/mcp-server@latest"]
```

Then in Codex, type any of these to get started:
- "Generate tests for my Agentforce agent"
- "Run guardrail tests against my Agentforce agent"
- "Test the Resort_Manager agent with multi-turn booking scenarios"

## Sandbox configuration (important)

Codex CLI sandboxes MCP servers by default. The server needs:

- **Filesystem read access** to `~/.sfdx/` (Salesforce CLI credential store)
- **Network access** to your Salesforce instance URLs (e.g. `*.my.salesforce.com`, `*.lightning.force.com`)
- **Filesystem write access** to your current working directory (for `sfagent-reports/`)

If you use `sandbox_mode = "workspace-write"`, configure:

```toml
[sandbox_workspace_write]
network_access = true
writable_roots = ["~/.sfdx", "~/.cache/npm"]

[features.network_proxy]
domains = { "*.my.salesforce.com" = "allow", "*.lightning.force.com" = "allow", "registry.npmjs.org" = "allow" }
```

## Tools exposed

Same surface as the Claude Code plugin:

| Tool | Purpose |
|---|---|
| `list_orgs` | List sf-authenticated orgs |
| `list_agents` | List Agentforce agents in an org |
| `get_agent_metadata` | Read subagents, actions, descriptions |
| `start_session` / `send_message` / `end_session` | Headless multi-turn conversation |
| `list_traces` / `read_trace` | Native Salesforce trace files (sf CLI 2026-05-20+) |
| `generate_test_spec` | Export an exploratory session as a `sf agent test run-eval` YAML |
| `run_batch_test` / `get_test_results` | Drive native regression tests |
| `load_config` | Load `sfagent-config.yaml` (user expectations) |

## Differences from the Claude Code packaging

- Codex uses TOML for host MCP config (`~/.codex/config.toml`); the plugin's bundled `.mcp.json` still uses JSON
- Skills include an `agents/openai.yaml` sidecar for Codex-specific UI metadata and implicit-invocation policy
- Distribution is via marketplace JSON files at `.agents/plugins/marketplace.json` (vs Claude's `.claude-plugin/marketplace.json`)

The MCP server (`@sfagent/mcp-server`) is identical across both.

## License

Apache-2.0 — see [LICENSE](../../LICENSE).
