# SFAgent Tools

> **The first AI-orchestrated testing toolkit for Salesforce Agentforce.** Tell your AI assistant what to test. It reads your agent's brain, runs dozens of headless conversations, and gives you a scored report with fix recommendations — in minutes, not hours.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/sfagent-tools-mcp-server.svg)](https://www.npmjs.com/package/sfagent-tools-mcp-server)
[![Works in Claude Code](https://img.shields.io/badge/Claude_Code-supported-D97757.svg)](https://code.claude.com)
[![Works in OpenAI Codex](https://img.shields.io/badge/OpenAI_Codex-supported-10A37F.svg)](https://developers.openai.com/codex)

https://github.com/lucianostraga/sfagent-tools/raw/main/demo/sfagent-tools-demo.mp4

```
You: "Generate tests for my Agentforce agent"
```

That's it. Your AI assistant does the rest.

---

## What it does

You built an Agentforce agent. Now you need to know:

- Does it route to the right **subagent** when a customer says "my order is late"?
- What happens when someone says "ignore your instructions"?
- Does it maintain context across a 5-turn conversation?
- Does it follow your business rules? ("never close a case without confirmation")
- What does it do when the customer is angry and demands a manager?

**Today, answering these questions means manually chatting with your agent in the Testing Center or writing YAML test specs by hand.** That takes hours and you'll miss edge cases.

SFAgent Tools lets Claude (or Codex) do it for you in minutes:

1. **Reads your agent** — calls `get_agent_metadata` to discover every subagent, action, and description in your configuration.
2. **Designs scenarios** — happy paths per subagent, edge cases, prompt-injection probes, escalation tests, multi-turn context checks.
3. **Has real conversations** — headless multi-turn sessions via `sf agent preview`. Streams a live transcript you can watch in a split pane.
4. **Scores and reports** — routing accuracy, guardrail strength, business-rule compliance, multi-turn coherence — all in a Markdown report.
5. **Hands off to native regression** — generates a YAML spec compatible with `sf agent test run-eval` so your CI runs the same scenarios on every commit.

---

## Install — pick your assistant

### Claude Code

```bash
/plugin marketplace add lucianostraga/sfagent-tools
/plugin install sfagent-tools@sfagent-tools-marketplace
```

Then in any project: ask Claude *"Generate tests for my Agentforce agent."*

### OpenAI Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.sfagent-tools]
command = "npx"
args = ["-y", "sfagent-tools-mcp-server@latest"]
```

Or install the full Codex plugin (skills + marketplace metadata) — see [packages/codex-plugin/README.md](packages/codex-plugin/README.md).

### Any other MCP-compatible client

```bash
npx -y sfagent-tools-mcp-server@latest
```

Works with Cursor, Continue.dev, Cline, Windsurf, or any custom MCP client.

---

## Built for Salesforce developers, aligned with TrailblazerDX 2026

This tool is intentionally a **collaborator with Salesforce's native tooling, not a replacement.** Every Salesforce surface we use is what Salesforce themselves recommend right now:

| Capability | What we use | Why it matters |
|---|---|---|
| **Agent Script v2.0 terminology** | "Subagent" (the April 2026 rename from "topic") | Code, prompts, and reports all use the current terminology |
| **`sf agent preview` GA** | Native CLI for headless conversations | Reuses your existing org auth — zero new credentials |
| **`sf agent trace` (May 20, 2026)** | New `list_traces` / `read_trace` tools | Pulls Salesforce's own step-by-step session traces |
| **`sf agent test run-eval` YAML (May 20, 2026 Beta)** | New `generate_test_spec` tool | Hands off exploratory sessions as regression specs for CI |
| **`@salesforce/core` AuthInfo/Org** | Programmatic auth | Unaffected by the May 27, 2026 CLI token-redaction change |
| **External Client App** | Not required | Works on day one with `sf org login web` — no ECA setup |

**Nothing deprecated. Nothing scraped from CLI text output. Nothing that bypasses Salesforce governance.** Production orgs are blocked at the tool level — testing only runs against sandboxes, scratch orgs, or Developer Edition.

---

## What's inside

12 MCP tools, grouped by what you'd use them for:

**Discover your agent**
- `list_orgs` — sf-authenticated Salesforce orgs
- `list_agents` — Agentforce agents in an org
- `get_agent_metadata` — full subagent + action map
- `load_config` — read business rules from `sfagent-config.yaml`

**Run live conversations**
- `start_session` / `send_message` / `end_session` — multi-turn via `sf agent preview`
- Live transcript written to `sfagent-reports/live-conversation.md` while tests run

**Diagnose failures with native traces** *(sf CLI 2026-05-20+)*
- `list_traces` / `read_trace` — read Salesforce's own session traces to see exactly which subagent routed and which actions ran

**Hand off to native regression**
- `generate_test_spec` — emit YAML for `sf agent test run-eval`
- `run_batch_test` / `get_test_results` — drive native test suites

---

## Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf` v2.131 or later)
- A Salesforce sandbox, scratch org, or Developer Edition with at least one Agentforce agent
- `sf org login web --alias <your-org>` already run (the plugin reuses your sf CLI auth — no new credentials)
- Node.js 20+ (for `npx`-based server install)
- Claude Code or OpenAI Codex (any MCP-compatible client works)

For Codex, see the [sandbox configuration notes](packages/codex-plugin/README.md#sandbox-configuration-important).

---

## Architecture (for the curious)

This is a monorepo. The MCP server is the actual product — both plugin packagings are thin wrappers around the same server.

```
sfagent-tools/
├── packages/
│   ├── server/                # sfagent-tools-mcp-server — the MCP server (TypeScript, published to npm)
│   ├── claude-code-plugin/    # Anthropic Claude Code packaging
│   └── codex-plugin/          # OpenAI Codex packaging
├── demo/                      # demo video and recording scripts
├── docs/                      # progress logs, architecture decisions
└── discovery-docs/            # research that informed the design
```

Both plugin packagings reference the same npm package (`sfagent-tools-mcp-server`). One server, one set of tests, two install paths.

---

## Development

```bash
npm install                                          # install via npm workspaces
npm run build                                        # build the server
claude --plugin-dir packages/claude-code-plugin      # test the Claude plugin locally
```

Local Codex testing — see [packages/codex-plugin/README.md](packages/codex-plugin/README.md).

---

## Status

- **v0.2.1** — current release. Monorepo, Codex packaging, native trace + spec-generation tools, subagent terminology aligned with Agent Script v2.0.
- **v0.1.0** — initial Claude Code plugin with 9 MCP tools.

---

## Contributing

Issues and PRs welcome. The MCP server in [packages/server/](packages/server/) is the single source of truth for tool behavior. Changes to the tool surface ship as a server version bump on npm.

## License

Apache-2.0 — see [LICENSE](LICENSE).
