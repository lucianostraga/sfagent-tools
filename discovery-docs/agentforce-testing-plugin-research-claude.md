# Building an Agentforce Testing Plugin for Claude Code

## Ecosystem Gap Analysis and Architecture

**A Claude Code plugin that automates headless Agentforce agent testing would fill a genuine gap in the ecosystem.** No such tool exists today — while MCP servers exist for *talking to* Agentforce agents and Salesforce provides a Testing API for *evaluating* them, nobody has built a Claude Code plugin that combines headless conversations with automated test assertions. The building blocks are mature: Claude Code's formal plugin system (public beta), Salesforce's GA Agent API with SSE streaming, the Testing API's Connect REST endpoints, and the sf CLI's reusable auth infrastructure all provide solid foundations. The proposed plugin would uniquely bridge Salesforce's testing capabilities with the AI-assisted development workflow inside Claude Code.

---

## Claude Code's plugin architecture is production-ready

Claude Code now has a **formal plugin system in public beta** that bundles multiple extension types into installable units. A plugin lives in a directory with a `.claude-plugin/plugin.json` manifest and optional component directories for skills, agents, hooks, and — critically — MCP servers.

The standard plugin structure looks like this:

```
agentforce-testing-plugin/
├── .claude-plugin/
│   └── plugin.json            # Plugin manifest (name, version, description)
├── skills/
│   └── agent-testing/
│       └── SKILL.md           # Auto-activating skill with testing instructions
├── agents/
│   └── test-runner.md         # Specialized subagent for orchestrating tests
├── hooks/
│   ├── hooks.json             # Event handlers (e.g., PostToolUse validation)
│   └── scripts/
├── .mcp.json                  # MCP server definitions
└── servers/
    └── agentforce-test-server.js  # The MCP server implementation
```

**MCP servers are the primary extension mechanism** for connecting Claude Code to external APIs. They can be defined in the plugin's `.mcp.json` file and registered at three scope levels: local (personal, project-specific), project (committable via `.mcp.json` at project root), and user (global in `~/.claude.json`). Tools exposed by MCP servers follow the naming convention `mcp__<server-name>__<tool-name>` and appear as callable tools within Claude Code sessions.

Two SDK options exist for building the MCP server component. The **MCP TypeScript SDK** (`@modelcontextprotocol/sdk`) creates standalone servers communicating via stdio or HTTP transport. The **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) enables in-process MCP servers with zero subprocess overhead, ideal for tighter integration. Both support tool registration with Zod-based input schemas. Plugins are installed via `/plugin install`, tested locally with `claude --plugin-dir ./your-plugin`, and distributed through Git-based marketplaces. Over **9,000 plugins** now exist across Anthropic's official marketplace and community registries.

---

## What the official Salesforce MCP server already covers

The official Salesforce DX MCP server (`@salesforce/mcp`, v0.26.10, Apache 2.0) provides **60+ tools across 14 toolsets** for Salesforce development workflows. It runs as a local stdio process via `npx` and requires the Salesforce CLI with pre-authenticated orgs.

Most relevant to the proposed plugin, the server includes a `testing` toolset with two GA tools:

- **`run_agent_test`** — Executes predefined Agentforce agent tests defined via YAML test spec files. Validates topic selection, action sequences, and outcome matching. Wraps the `sf agent test run` CLI command.
- **`run_apex_test`** — Executes Apex unit tests.

The `run_agent_test` tool runs *predefined batch tests* but **does not support interactive headless conversations**. It cannot start an ad-hoc agent session, send arbitrary messages, or evaluate responses in real-time. There are no tools for session management, message exchange, or conversational testing workflows. The server also lacks CRUD operations, Apex execution, and bulk data tools — these exist only in community-built MCP servers.

Configuration is straightforward and uses the sf CLI auth store:
```json
{
  "mcpServers": {
    "Salesforce DX": {
      "command": "npx",
      "args": ["-y", "@salesforce/mcp", "--orgs", "DEFAULT_TARGET_ORG",
               "--toolsets", "testing", "--tools", "run_agent_test"]
    }
  }
}
```

Three community-built Agentforce MCP servers exist (`pkurimella/agentforce-mcp-server`, `xlengelle-sf/agentforce-mcp-xlengelle`, `agentforce-mcp/simple-agentforce-mcp`), but all are **communication bridges only** — they let you talk to agents without any test assertion, batch evaluation, or pass/fail reporting capabilities.

---

## Salesforce's Agent API enables full headless conversations

Salesforce provides two distinct APIs for programmatic agent interaction, both now generally available.

### The Agent API for headless conversations

The **Agent API** (`/einstein/ai-agent/v1/`) is purpose-built for headless, autonomous agent interactions via REST. Its lifecycle consists of four operations:

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Start session | `/einstein/ai-agent/v1/sessions` | POST |
| Send message (sync) | `/sessions/{sessionId}/messages` | POST |
| Send message (streaming) | `/sessions/{sessionId}/messages/stream` | POST |
| End session | `/sessions/{sessionId}` | DELETE |

Starting a session requires the **18-character Agent ID** (prefix `0Xx`), an external session key (UUID), and a `bypassUser` flag. Messages use incrementing `sequenceId` values for ordering. The streaming endpoint returns **SSE events** including `ProgressIndicator`, `TextChunk`, `Inform` (complete response), and `EndOfTurn` markers.

Authentication uses **OAuth client credentials flow** via an External Client App with `api`, `chatbot_api`, `sfap_api`, and `refresh_token` scopes. The Agent API is **not supported for "Agentforce (Default)" type agents** — only custom agents.

### The Testing API for batch evaluation

The **Testing API** uses Connect REST API endpoints for structured batch testing:

```
POST   /services/data/v63.0/einstein/ai-evaluations/runs     → Start test
GET    /services/data/v63.0/einstein/ai-evaluations/runs/{id} → Poll status
GET    /services/data/v63.0/einstein/ai-evaluations/runs/{id}/results → Get results
```

Tests are defined as `AiEvaluationDefinition` metadata components containing utterances, expected topics, expected actions, and expected outcomes. Results provide pass/fail verdicts for topic selection accuracy, action sequence correctness, and response quality.

### CLI commands round out the tooling

The Salesforce CLI plugin-agent package provides `sf agent preview start/send/end` for programmatic headless preview sessions and `sf agent test create/run/list` for structured testing — all usable in CI/CD pipelines. These commands produce `transcript.json` and detailed trace files for debugging.

---

## Reusing Salesforce CLI authentication is straightforward

The sf CLI stores per-org auth credentials as **encrypted JSON files** in `~/.sfdx/` (e.g., `~/.sfdx/user@example.com.json`), encrypted with a key from `~/.sfdx/key.json`. An MCP server can access these credentials through two proven patterns.

**Pattern 1: Shell out to sf CLI** (simplest, language-agnostic):
```bash
sf org display --target-org my-alias --json | jq -r '.result.accessToken'
sf org display --target-org my-alias --json | jq -r '.result.instanceUrl'
```
The JSON output includes `accessToken`, `instanceUrl`, `username`, `orgId`, and `connectedStatus`. Multiple community MCP servers use this exact pattern.

**Pattern 2: Use @salesforce/core directly** (Node.js, recommended for the plugin):
```typescript
import { Org } from '@salesforce/core';
const org = await Org.create({ aliasOrUsername: 'my-alias' });
await org.refreshAuth(); // Auto-refresh expired tokens
const conn = org.getConnection();
// conn.accessToken and conn.instanceUrl now available
```

This approach provides **automatic token refresh**, encrypted credential handling, and direct jsforce API access. Access tokens typically expire in 15 minutes to 2 hours, but the `@salesforce/core` library handles refresh transparently using stored refresh tokens (for web-auth orgs) or JWT re-authentication (for JWT-auth orgs).

The plugin should accept a `--target-org` parameter (or environment variable) matching sf CLI conventions, enumerate available orgs via `sf org list --json`, and let users select their target. This mirrors the official Salesforce DX MCP server's `--orgs` flag pattern.

---

## No existing tool combines headless testing with MCP integration

A comprehensive search across GitHub, npm, Claude Code marketplaces, MCP registries, and the Salesforce ecosystem confirms that **the proposed plugin does not exist**. Here is what does exist and where the gaps are:

- **Communication MCP servers** (3 repos) let Claude talk to Agentforce agents but have zero testing capabilities — no assertions, no batch execution, no pass/fail reporting
- **Salesforce's Testing Center** provides UI-based batch testing inside Salesforce Setup but has no MCP interface and no developer toolchain integration
- **Salesforce's Testing API** is a REST API that *could* power a testing plugin but has no MCP wrapper
- **The `sf agent test` CLI commands** exist but are not exposed as MCP tools
- **Commercial platforms** (Provar, Copado, TestZeus) offer enterprise Agentforce testing but are standalone SaaS products, not Claude Code plugins
- **The `sf-ai-agentforce-observability` MCP Market skill** analyzes post-hoc session telemetry but does not execute tests proactively

The specific gap: nobody has built an MCP server that **orchestrates Agentforce agent testing end-to-end** — defining test scenarios, executing headless conversations via the Agent API, running structured evaluations via the Testing API, and returning actionable pass/fail results within Claude Code.

---

## Streaming works but requires careful architecture

The Agentforce Agent API **fully supports SSE streaming** via the `/messages/stream` endpoint. However, MCP's tool protocol is fundamentally synchronous — **tool results are returned as complete, atomic responses**. Claude Code waits for the full MCP tool result before processing it and does not display partial results in real-time.

The recommended architecture uses **streaming consumption with synchronous return**:

1. The MCP server internally opens an SSE connection to Salesforce's streaming endpoint
2. It consumes `ProgressIndicator` and `TextChunk` events as they arrive (keeping the HTTP connection alive)
3. It can optionally send MCP `notifications/progress` to Claude Code during processing
4. Once the `EndOfTurn` event arrives, it returns the accumulated response as a single tool result

A **split-tool pattern** is strongly recommended for multi-turn conversations:

| Tool | Purpose |
|------|---------|
| `start_agent_session` | Creates a session, returns `sessionId` |
| `send_test_message` | Sends a message, returns agent response + optional assertions |
| `evaluate_response` | Validates response against expected topic/actions/outcome |
| `end_agent_session` | Closes the session, returns transcript |
| `run_batch_test` | Executes a full test suite via the Testing API |

This avoids timeout risks (complex agent interactions can take 10–30+ seconds) and lets Claude Code naturally orchestrate multi-turn test conversations. The default `MAX_MCP_OUTPUT_TOKENS` of **25,000 tokens** is generous enough for most agent responses but should be documented as configurable.

---

## Where this plugin adds unique, non-overlapping value

Based on the complete landscape analysis, the proposed plugin would deliver value in five areas that no existing tool covers:

**Interactive headless testing from Claude Code.** Developers could describe test scenarios in natural language, and Claude would orchestrate multi-turn agent conversations via MCP tools — sending messages, receiving responses, and evaluating correctness without leaving their development workflow. No existing tool offers this AI-assisted testing loop.

**MCP wrapper for the Testing API.** The Salesforce Testing API's three Connect REST endpoints remain un-wrapped by any MCP server. The plugin could expose `create_test_definition`, `run_evaluation`, and `get_results` as MCP tools, making batch testing a natural part of the Claude Code workflow rather than requiring separate API calls or UI navigation.

**Test assertion engine.** Unlike existing communication-only MCP servers, the plugin would validate responses against expected topics, action sequences, and outcome patterns — producing structured pass/fail reports that Claude can analyze and act on (e.g., suggesting agent configuration fixes).

**SF CLI auth reuse.** By leveraging `@salesforce/core` directly, the plugin eliminates the need for separate OAuth setup — it uses the same authenticated orgs developers already have configured, matching the pattern established by the official Salesforce DX MCP server.

**Complementary, not conflicting, with the official MCP server.** The official `@salesforce/mcp` server's `run_agent_test` tool handles predefined batch tests via YAML specs. The proposed plugin would handle *interactive*, *exploratory*, and *conversational* testing — validating agent behavior through ad-hoc dialogues that Claude can dynamically adjust based on observed responses. These are fundamentally different testing modalities that complement each other.

---

## Agentforce Vibes does not overlap — it complements the plugin

Agentforce Vibes (formerly Einstein for Developers) is Salesforce's enterprise vibe coding platform, GA since October 2025. It is an AI-powered IDE extension — available in VS Code, Code Builder, Cursor, and Windsurf — that helps developers build, debug, test, and deploy Salesforce apps and agents using natural language. Its AI agent, Vibe Codey, understands project context, org metadata, and schema to generate Apex, LWC, and configuration code. Vibes is extensible to Claude Code and other agentic tools through the same Salesforce DX MCP Server (`@salesforce/mcp`) analyzed earlier in this document.

### What Vibes actually tests

The "test" capabilities in Agentforce Vibes refer exclusively to **code-level testing**: generating Apex unit tests and LWC test cases to hit Salesforce's 75% code coverage requirement, running Code Analyzer v5 for security and best practices, and deploying to Sandboxes for isolated validation. Vibes does not perform interactive agent conversation testing, headless agent sessions, or behavioral evaluation of deployed Agentforce agents. Its test generation is about validating *code correctness*, not *agent behavior*.

### What Vibes provides (relevant to this plugin)

Vibes ships with the Salesforce DX MCP Server, which provides 60+ tools across 14 toolsets for Salesforce development workflows. This includes the `testing` toolset with the `run_agent_test` tool (predefined batch tests via YAML specs) and `run_apex_test`. However, none of these tools support ad-hoc headless conversations, real-time response evaluation, or exploratory agent testing — the core value proposition of the proposed plugin.

Vibes also establishes important architectural precedents that the plugin should follow: MCP as the extension mechanism, `@salesforce/mcp` as the canonical server pattern, sf CLI for authentication, and the `--toolsets`/`--tools` flags pattern for selective tool enablement. Developers already using Vibes will find the plugin's integration model familiar.

### Complementary lifecycle positioning

The two tools occupy distinct stages of the Agentforce development lifecycle:

| Stage | Tool | What it does |
|-------|------|-------------|
| **Build** | Agentforce Vibes | Generate agent code, create metadata, scaffold topics/actions, write Apex |
| **Unit test** | Agentforce Vibes | Generate Apex test classes, run Code Analyzer, validate code coverage |
| **Behavioral test** | **Proposed plugin** | Run headless conversations, validate topic routing, evaluate response quality |
| **Batch evaluation** | **Proposed plugin** | Execute structured test suites via Testing API, report pass/fail verdicts |
| **Deploy** | Agentforce Vibes | Deploy to orgs via DevOps Center, manage CI/CD pipelines |

A developer would use Vibes to build an agent, then switch to Claude Code with the testing plugin to stress-test it with dozens of conversation scenarios — checking edge cases, validating guardrails, and generating documentation about agent behavior. These are fundamentally different concerns that do not conflict.

### Third-party MCP extensibility is an intended pattern

Salesforce explicitly designed Vibes to support custom MCP integrations. Teams can build MCP servers that pull context from external sources (Jira, Confluence, internal wikis) and connect them alongside the DX MCP Server. The proposed plugin follows this exact pattern — it would be a purpose-built MCP server that adds agent testing capabilities to any MCP-compatible environment (Claude Code, Cursor, Windsurf, or Vibes itself). The ~20 tool limit per session documented in Vibes means the plugin should keep its tool count lean and focused.

---

## Conclusion

The technical foundations for this plugin are solid and well-documented. Claude Code's plugin system provides the packaging and distribution framework. The Agentforce Agent API delivers headless conversation capabilities with SSE streaming. The Testing API enables structured batch evaluation. And `@salesforce/core` offers seamless auth reuse. The implementation path is clear: build an MCP server (TypeScript, using the MCP SDK) that wraps both the Agent API and Testing API, package it as a Claude Code plugin with skills for guiding test workflows, and distribute via a Git-based marketplace. The split-tool architecture for session management, combined with internal SSE consumption, resolves the streaming/timeout constraints. This would be the first tool to bring AI-assisted, interactive Agentforce agent testing into the developer's primary coding workflow.
