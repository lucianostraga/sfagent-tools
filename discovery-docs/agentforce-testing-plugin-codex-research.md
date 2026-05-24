# Building an Agentforce Testing Plugin for Codex

## Codex Plugin Architecture and Migration Path from Claude Code

**The Agentforce testing plugin designed for Claude Code can be ported to Codex with minimal effort — most of the work is already done.** OpenAI launched the formal Codex plugin system in March 2026, and it is architecturally near-identical to Claude Code's: a manifest-driven bundle of skills, app integrations, and MCP servers. Because both ecosystems standardize on the same MCP protocol, the core MCP server (which actually does the Agentforce testing work) is **100% portable**. What changes is the packaging layer around it: a different manifest filename, a different marketplace format, and TOML instead of JSON for the host configuration. This document covers the full Codex plugin model and the specific changes needed to ship the same plugin to Codex users.

---

## Codex's plugin system mirrors Claude Code's

OpenAI's Codex platform — the coding agent that powers the Codex app, IDE extension, and CLI — supports a formal plugin system that became broadly available in March 2026 with the launch of an official Plugin Directory and over 20 curated plugins (Slack, Figma, Linear, Notion, Sentry, GitHub, Hugging Face, and others). Plugins are described in the official documentation as "installable bundles for reusable Codex workflows" that "package skills, optional app integrations, and MCP server configurations in a single place."

A Codex plugin can contain three component types, exactly paralleling Claude Code:

| Component | Purpose | Equivalent in Claude Code |
|-----------|---------|---------------------------|
| **Skills** | Prompts that describe workflows; progressively discovered by the agent | Skills (`SKILL.md`) |
| **Apps** | Service-connection mappings (e.g., to Notion, Slack) declared via `.app.json` | App integrations / connectors |
| **MCP servers** | External tools and context exposed via `.mcp.json` | MCP servers |

The standard plugin structure is:

```
agentforce-testing-plugin/
├── .codex-plugin/
│   └── plugin.json          # Required: plugin manifest
├── skills/
│   └── agentforce-testing/
│       └── SKILL.md         # Workflow instructions for Codex
├── .app.json                # Optional: app/connector mappings
├── .mcp.json                # Optional: MCP server configuration
└── assets/                  # Optional: icons, logos, screenshots
```

Only `plugin.json` belongs inside `.codex-plugin/`. Everything else lives at the plugin root.

---

## Key differences from the Claude Code plugin

For someone porting a Claude Code plugin to Codex, the surface differences are mostly cosmetic. The substantive change is how the host process is configured (TOML vs JSON) and how plugins are distributed (marketplace files vs Git-based plugin sources).

| Aspect | Claude Code | Codex |
|--------|-------------|-------|
| Manifest folder | `.claude-plugin/` | `.codex-plugin/` |
| Manifest file | `plugin.json` | `plugin.json` (same name) |
| Skill format | `SKILL.md` with YAML frontmatter | `SKILL.md` with YAML frontmatter (same standard, from agentskills.io) |
| Skill scope folders | `.claude/skills/`, project, user | `.agents/skills/` at repo, user, admin, system scopes |
| MCP config file | `.mcp.json` (JSON) | `.mcp.json` for the plugin; host config is `~/.codex/config.toml` (TOML) |
| Optional skill metadata | Within SKILL.md frontmatter | Additional `agents/openai.yaml` for UI and dependencies |
| Distribution | Git-based marketplaces | JSON marketplace files (`marketplace.json`) at repo or personal scope |
| Plugin install command | `/plugin install` | `/plugins` (note plural) |
| Scaffolding tool | `claude --plugin-dir` for local testing | `$plugin-creator` built-in skill |
| MCP transport types | stdio, HTTP, SSE | STDIO, Streamable HTTP (with bearer token + OAuth) |

Plugins in Codex are also tracked at the file-system level: Codex installs them into `~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/`. For local development plugins, `$VERSION` is `local`, and Codex loads from that cached copy rather than the marketplace source — so iterating requires updating the source and restarting Codex.

---

## The MCP server is 100% portable

This is the most important architectural insight: **the MCP server that does the actual Agentforce testing work does not change between Claude Code and Codex.** Both clients implement the same Model Context Protocol specification. The TypeScript implementation using `@modelcontextprotocol/sdk`, the split-tool pattern (`start_agent_session`, `send_test_message`, `evaluate_response`, etc.), the SSE consumption for Salesforce's streaming endpoint, the `@salesforce/core` integration for sf CLI auth — all of it runs identically.

What changes is how each client configures and launches the server. In Codex CLI, MCP servers are declared in `~/.codex/config.toml` (or a project-scoped `.codex/config.toml` for trusted projects), using TOML rather than JSON:

```toml
[mcp_servers.agentforce-testing]
command = "npx"
args = ["-y", "@your-org/agentforce-testing-mcp"]

[mcp_servers.agentforce-testing.env]
SF_TARGET_ORG = "my-dev-org"
```

For Streamable HTTP servers (if the plugin were eventually hosted remotely), the same file supports:

```toml
[mcp_servers.agentforce-testing-remote]
url = "https://example.com/mcp"
bearer_token_env_var = "AGENTFORCE_TEST_TOKEN"
http_headers = { "X-Org" = "us-east-1" }
startup_timeout_sec = 20
tool_timeout_sec = 45
enabled_tools = ["start_session", "send_message", "run_evaluation"]
```

Codex also supports OAuth-authenticated MCP servers (`codex mcp login <server-name>`), which is useful if the plugin ever exposes itself as a hosted service for non-developer users. Both bearer-token and OAuth flows work transparently for the user — no manual token handling needed in the plugin.

When packaged as a plugin (rather than a manually configured server), the same configuration moves into the plugin's `.mcp.json` file and gets installed automatically when the user adds the plugin from a marketplace. The official Salesforce DX MCP server already ships and works with Codex via this exact pattern, confirming the integration model is production-ready.

---

## Skills work the same way, with progressive disclosure

Codex skills follow the same open agent skills standard as Claude Code (the spec at agentskills.io), so the `SKILL.md` files written for the Claude Code plugin can be reused with minor adjustments. A skill is a directory containing a required `SKILL.md` plus optional scripts and references:

```
skills/agentforce-testing/
├── SKILL.md              # Required: instructions + metadata
├── scripts/              # Optional: executable code
├── references/           # Optional: documentation
├── assets/               # Optional: templates, resources
└── agents/
    └── openai.yaml       # Optional: Codex-specific metadata
```

The `SKILL.md` frontmatter format is identical:

```markdown
---
name: agentforce-testing
description: Run automated headless conversations against Agentforce agents and produce pass/fail reports for topic routing, action sequences, and response quality.
---

Skill instructions go here…
```

The key Codex-specific addition is the optional `agents/openai.yaml` file, which controls how the skill appears in the Codex app UI and lets the skill declare its MCP dependencies — meaning the skill can ensure its required MCP server is installed and wired up automatically:

```yaml
interface:
  display_name: "Agentforce Testing"
  short_description: "Headless conversation testing for Agentforce agents"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#00A1E0"
  default_prompt: "Run my agent test suite and report results"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "agentforceTesting"
      description: "Agentforce headless testing MCP server"
      transport: "stdio"
```

Codex uses **progressive disclosure**: it starts with each skill's metadata (`name`, `description`, file path, and any `agents/openai.yaml` data) and only loads the full `SKILL.md` instructions when it decides to use the skill. This keeps context usage low even when many plugins are installed, but it also means the skill `description` field is doing critical work — Codex picks skills based on whether the description matches the task, so descriptions need clear scope and trigger boundaries.

Skills can be invoked two ways:
- **Explicit:** the user types `$skill-name` or runs `/skills` to pick one
- **Implicit:** Codex matches the user's task against skill descriptions and chooses one automatically

Setting `allow_implicit_invocation: false` in `agents/openai.yaml` forces explicit invocation only — useful for skills with side effects, though for a testing skill, implicit invocation is probably fine.

---

## The manifest format is nearly identical

The Codex `plugin.json` is a superset of the equivalent Claude Code manifest. A minimal version requires just four fields:

```json
{
  "name": "agentforce-testing-plugin",
  "version": "0.1.0",
  "description": "Automated headless testing for Agentforce agents",
  "skills": "./skills/"
}
```

A production-ready version uses the full set of fields, with the addition of a Codex-specific `interface` object for install-surface metadata:

```json
{
  "name": "agentforce-testing-plugin",
  "version": "0.1.0",
  "description": "Automated headless testing for Agentforce agents via the Agent API and Testing API",
  "author": {
    "name": "Luciano",
    "email": "you@example.com",
    "url": "https://example.com"
  },
  "homepage": "https://github.com/luciano/agentforce-testing-plugin",
  "repository": "https://github.com/luciano/agentforce-testing-plugin",
  "license": "MIT",
  "keywords": ["salesforce", "agentforce", "testing", "mcp"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Agentforce Testing",
    "shortDescription": "Headless conversation testing for Agentforce agents",
    "longDescription": "Run automated test conversations against your Agentforce agents. Validate topic routing, action sequences, and response quality. Reuses your existing sf CLI authentication.",
    "developerName": "Luciano",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "websiteURL": "https://github.com/luciano/agentforce-testing-plugin",
    "defaultPrompt": [
      "Run the test suite against my Agentforce agent",
      "Test my agent with these conversation scenarios"
    ],
    "brandColor": "#00A1E0",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

The `interface` object drives how the plugin appears in the Codex plugin directory — its title, description, icon, brand color, screenshots, and starter prompts. For published plugins, all of these fields matter for discoverability and adoption.

---

## Marketplaces replace Git-based distribution

Where Claude Code distributes plugins through Git-based plugin sources, Codex uses **marketplace files** — JSON catalogs that list one or more plugins. Each marketplace appears as a selectable source in the Codex plugin directory. There are three marketplace scopes:

| Scope | Location | Use case |
|-------|----------|----------|
| **Official** | OpenAI-curated marketplace powering the Plugin Directory | Production-ready plugins for general distribution (self-serve publishing not yet available) |
| **Repo** | `$REPO_ROOT/.agents/plugins/marketplace.json` | Team or project plugins committed to a repo |
| **Personal** | `~/.agents/plugins/marketplace.json` | Personal plugins available across all projects |

A marketplace file looks like:

```json
{
  "name": "agentforce-tools",
  "interface": {
    "displayName": "Agentforce Developer Tools"
  },
  "plugins": [
    {
      "name": "agentforce-testing-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/agentforce-testing-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

The `policy.installation` field accepts `AVAILABLE`, `INSTALLED_BY_DEFAULT`, or `NOT_AVAILABLE`. The `policy.authentication` field determines whether OAuth/auth flows trigger at install time or on first use — relevant if the MCP server requires credentials beyond what sf CLI already provides.

For local development, the fastest workflow is to use the built-in `$plugin-creator` skill, which scaffolds the manifest and generates a local marketplace entry automatically. Once the official Plugin Directory opens to self-serve publishing (currently "coming soon"), the same plugin can be promoted from a personal marketplace to the curated catalog.

---

## Authentication and the sf CLI integration are unchanged

The plugin's use of `@salesforce/core` for sf CLI authentication works identically in Codex. The MCP server reads from `~/.sfdx/` exactly as it does for Claude Code, refreshes tokens via the same mechanisms, and resolves the target org through the same `--target-org` flag or environment variable.

One Codex-specific consideration: Codex CLI runs MCP servers in a sandbox by default, with configurable network and filesystem policies. The plugin documentation should call out that the server needs network access to Salesforce instance URLs (for the Agent API and Testing API REST calls) and filesystem read access to `~/.sfdx/` (for credential lookup). The `sandbox` policy in Codex's config supports the right carveouts, but it's worth noting in the plugin's setup instructions to avoid surprise failures on first run.

For MCP servers that need credentials beyond sf CLI auth (e.g., a hosted version of the plugin that uses OAuth), Codex supports OAuth flows natively via `codex mcp login <server-name>`. This is useful if the plugin ever evolves into a managed SaaS offering — the user doesn't have to handle tokens manually.

---

## Recommended porting plan

Given that the MCP server itself doesn't change, porting the Claude Code plugin to Codex is a packaging exercise rather than a rewrite. The recommended sequence:

1. **Build the MCP server first** (independent of plugin packaging). This is the work already scoped in the Claude Code research document — TypeScript, `@modelcontextprotocol/sdk`, the split-tool pattern, internal SSE consumption, `@salesforce/core` for auth.

2. **Package it as a Claude Code plugin** (the primary distribution target initially). Use the structure and manifest from the Claude Code research document.

3. **Add a Codex packaging layer** as a second distribution target. This means:
   - Copy the plugin folder, rename `.claude-plugin/` to `.codex-plugin/`
   - Adjust the `plugin.json` to add Codex's `interface` object
   - Reuse the same `SKILL.md` files unchanged (the format is the agentskills.io standard)
   - Add an `agents/openai.yaml` per skill for Codex-specific UI metadata and MCP dependency declaration
   - Create a `marketplace.json` for local distribution and testing
   - Reuse the same `.mcp.json` (the MCP server config schema is portable)

4. **Test against `$plugin-creator`**. Use Codex's built-in scaffolding skill to validate that the manifest and marketplace file pass Codex's checks. Then install locally from the personal or repo marketplace and run through the test workflow.

5. **Publish to both directories when available**. Claude Code already has community plugin marketplaces (9,000+ plugins as of mid-2026). Codex's official Plugin Directory currently lists OpenAI-curated plugins only, with self-serve publishing coming soon — when it opens, submit the same MCP server packaged with a Codex manifest.

A single Git repository can host both packagings side by side (e.g., `packages/claude-code/` and `packages/codex/`), sharing the MCP server implementation in `packages/server/`. This keeps the plugin in sync across both ecosystems with one set of source-of-truth tests for the actual Agentforce testing logic.

---

## Conclusion

OpenAI's Codex plugin system is mature enough to ship a real plugin today: a formal manifest format, three component types (skills, apps, MCP servers), marketplace-based distribution, scaffolding via `$plugin-creator`, OAuth and bearer-token MCP authentication, and a documented build/install workflow. Architecturally it parallels Claude Code's plugin system closely enough that an Agentforce testing plugin built for one can be packaged for the other without rewriting the core MCP server. The official Salesforce DX MCP server already runs on Codex CLI via TOML configuration, proving the integration model works end-to-end. The path forward is to build the MCP server once, package it twice, and reach developers in both ecosystems with the same testing capabilities.
