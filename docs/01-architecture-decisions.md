# Architecture Decisions

This document records key architectural decisions for SFAgent Tools. Each decision includes context, the decision itself, and rationale.

---

## ADR-001: Plugin Type -- Claude Code Plugin with Bundled MCP Server

**Context**: Claude Code offers multiple extension mechanisms: CLAUDE.md, custom slash commands, skills, hooks, and MCP servers. These can be packaged together as a plugin.

**Decision**: Build a full Claude Code plugin that bundles an MCP server (TypeScript), skills (SKILL.md), and slash commands. Package for Claude Code Marketplace distribution.

**Rationale**:
- MCP server provides structured tool calls for Salesforce API interactions
- Skills allow Claude to auto-activate testing capabilities based on context
- Slash commands give users explicit entry points (`/sfagent-tools:test`)
- Plugin packaging enables single-install marketplace distribution
- This is the pattern established by the Salesforce DX MCP Server

---

## ADR-002: Authentication -- Delegate Entirely to SF CLI

**Context**: The Agent API requires OAuth (Client Credentials flow via External Client App). The Testing API uses standard Salesforce REST auth. Multiple auth patterns exist: direct OAuth, JWT bearer, sf CLI delegation.

**Decision**: Authenticate exclusively via `@salesforce/core` library, reusing sf CLI-authenticated orgs. Never handle, store, or transport raw credentials.

**Rationale**:
- **Security**: `@salesforce/core` encrypts tokens with AES-256-GCM at rest. The plugin never touches secrets.
- **Marketplace compliance**: Zero credentials in config files. Only org aliases stored.
- **Developer experience**: Users already have orgs authenticated via `sf org login web`. No additional setup.
- **MFA/SSO compatible**: Browser-based sf CLI auth handles any enterprise auth requirements.
- **Precedent**: This is exactly how the official `@salesforce/mcp` server works (`--orgs` flag).
- **Token refresh**: `@salesforce/core` handles refresh transparently via stored refresh tokens or JWT re-auth.

**Implementation**:
```typescript
import { Org } from '@salesforce/core';
const org = await Org.create({ aliasOrUsername: targetOrg });
await org.refreshAuth();
const conn = org.getConnection();
// conn.accessToken and conn.instanceUrl -- no secrets in plugin code
```

**User-facing convention**: Accept `--target-org` parameter matching sf CLI conventions. Enumerate available orgs via `sf org list --json`.

**Documented alternative**: For users needing `bypassUser: true` or dedicated integration user testing, document External Client App (ECA) setup separately. This is an advanced path, not the default.

---

## ADR-003: Salesforce API Surface -- Agent API + Testing API

**Context**: Salesforce provides multiple ways to test agents: Testing Center UI, Agentforce DX CLI, Testing API (Connect REST), Agent API (headless conversations), Apex invocable actions, and Flow actions.

**Decision**: Use two Salesforce APIs:
1. **Agent API** (`/einstein/ai-agent/v1/`) -- for interactive headless conversations (exploratory testing)
2. **Testing API** (`/services/data/v63.0/einstein/ai-evaluations/`) -- for batch evaluation runs (regression testing)

Wrap sf CLI commands where appropriate (e.g., `sf agent test run` for batch tests) rather than reimplementing their logic.

**Rationale**:
- Agent API is GA, purpose-built for headless interactions, supports SSE streaming
- Testing API is GA (API v63.0+), handles batch evaluation with structured pass/fail results
- sf CLI commands are the canonical way to run batch tests; wrapping them avoids reimplementing complex orchestration
- These two APIs cover both "exploratory" and "regression" testing modalities
- Not using: Testing Center UI (no API), Apex invocable actions (requires deploying code), Flow actions (same)

**Constraint**: Agent API is NOT supported for "Agentforce (Default)" type agents -- only custom agents. This must be documented clearly.

---

## ADR-004: MCP Server Implementation -- TypeScript with MCP SDK

**Context**: MCP servers can be built in any language. Two SDK options exist for Node.js: MCP TypeScript SDK (`@modelcontextprotocol/sdk`) and Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`).

**Decision**: Build the MCP server in TypeScript using the MCP TypeScript SDK (`@modelcontextprotocol/sdk`) with stdio transport.

**Rationale**:
- TypeScript is the Salesforce developer ecosystem language (LWC, sf CLI plugins, `@salesforce/core`)
- `@modelcontextprotocol/sdk` is the standard, well-documented MCP SDK
- stdio transport is simplest for bundled plugin servers (no network config)
- `@salesforce/core` is a Node.js library -- staying in the same runtime avoids cross-process complexity
- Zod for input validation (standard in MCP ecosystem)

---

## ADR-005: Tool Design -- 7 Lean, Focused Tools

**Context**: Salesforce recommends max ~20 tools per MCP session. Tools should be single-purpose. The split-tool pattern is recommended for multi-turn conversations to avoid timeouts.

**Decision**: Expose exactly 7 MCP tools:

| Tool | Purpose | Salesforce API |
|---|---|---|
| `list_orgs` | Show sf CLI authenticated orgs | `@salesforce/core` |
| `list_agents` | List available agents in target org | REST API (query) |
| `start_session` | Create headless Agent API session | Agent API |
| `send_message` | Send utterance, return full agent response | Agent API (SSE consumed internally) |
| `end_session` | Close session, return conversation transcript | Agent API |
| `run_batch_test` | Execute AiEvaluationDefinition test suite | Testing API / sf CLI |
| `get_test_results` | Fetch batch test results | Testing API / sf CLI |

**Rationale**:
- 7 tools is well under the ~20 limit
- Split-tool pattern for sessions avoids timeout risks (agent interactions can take 10-30+ seconds)
- Each tool does one thing -- Claude orchestrates the workflow
- `list_orgs` and `list_agents` are discovery tools that help Claude (and the user) pick targets
- Batch test tools wrap sf CLI commands rather than reimplementing Testing API orchestration

---

## ADR-006: Streaming Strategy -- Internal SSE Consumption, Synchronous Return

**Context**: The Agent API supports SSE streaming. MCP tool protocol is fundamentally synchronous -- tool results are complete, atomic responses. Claude Code waits for full results.

**Decision**: The `send_message` tool internally consumes the Agent API SSE stream (`ProgressIndicator`, `TextChunk`, `Inform`, `EndOfTurn`) and returns the accumulated complete response as a single tool result. No real-time streaming to the user in MVP.

**Rationale**:
- MCP tools are synchronous -- no way around this for MVP
- Claude orchestrates turn-by-turn anyway, which is better for testing (clean, evaluable responses per turn)
- SSE consumption ensures we get the full response including all event metadata
- Future enhancement: add MCP `notifications/progress` for "agent is thinking..." status (cosmetic)
- Future enhancement: MCP channels for live streaming (Phase 3+)

---

## ADR-007: Test Plan Format -- YAML Compatible with Agentforce DX

**Context**: Users need to define what to test. Agentforce DX uses YAML test specs. The Testing API uses AiEvaluationDefinition XML metadata. Custom formats are possible.

**Decision**: Support two input modes:
1. **Natural language instructions** -- user describes what to test in plain English (in a markdown or text file). Claude interprets and creates test conversations.
2. **Agentforce DX YAML specs** -- standard `sf agent generate test-spec` format. Plugin can run these through the batch Testing API.

Never invent a custom test format. Extend, don't replace.

**Rationale**:
- Natural language is the plugin's unique value -- it's why you use Claude, not a script
- YAML compatibility means users can reuse existing test specs and generate new ones
- AiEvaluationDefinition is the standard metadata type -- generated YAML specs can be deployed to orgs for CI/CD
- No learning curve for Salesforce developers already using Agentforce DX

---

## ADR-008: Security Constraints

**Decision**: The following security rules are non-negotiable:

1. **Zero secrets in plugin config.** Only org aliases, agent IDs, and file paths in any config file.
2. **No credential logging.** Access tokens never appear in logs, even at debug level.
3. **Sandbox-only warnings.** Agent tests consume API credits and can modify data. Plugin must warn users prominently.
4. **No `.sfdx/` in distribution.** Plugin `.gitignore` must exclude all credential stores.
5. **Least privilege.** Document minimum required permissions and OAuth scopes (`api`, `chatbot_api`, `sfap_api`, `refresh_token`).
6. **No `--no-verify` or hook bypasses.** Follow Claude Code's security model.
7. **Input validation.** All MCP tool inputs validated with Zod schemas.

---

## ADR-009: Modern Salesforce Technology Compliance

**Decision**: The plugin must use current Salesforce technology exclusively:

| Requirement | Implementation |
|---|---|
| sf v2 CLI only | All CLI calls use `sf`, never `sfdx`. sfdx is deprecated and frozen. |
| `@salesforce/core` for auth | Direct library usage with `Org.create()` and `Connection` |
| `AiEvaluationDefinition` metadata | Standard metadata type for generated test specs |
| Agent API (GA) | `/einstein/ai-agent/v1/` for headless conversations |
| Testing API (GA, v63.0+) | Connect REST endpoints for batch evaluation |
| `--target-org` convention | Same flag pattern as all sf CLI commands |
| Source-driven development | Compatible with `sfdx-project.json` project structure |
| CI-friendly outputs | JSON, JUnit, TAP formats for test results |

---

## ADR-010: No Dependency on Salesforce DX MCP Server

**Context**: The official Salesforce DX MCP Server (`@salesforce/mcp`) provides 60+ tools including `run_agent_test`. It could be used as a dependency or integration point.

**Decision**: The plugin does NOT depend on, require, or invoke the Salesforce DX MCP Server. It talks to Salesforce APIs directly via `@salesforce/core` and wraps sf CLI commands itself.

**Rationale**:
- **Plug and play**: Adding a dependency on `@salesforce/mcp` would require users to configure `--orgs`, `--toolsets`, and `--tools` flags separately -- breaking the zero-config experience.
- **No value add**: The DX MCP Server's `run_agent_test` tool just wraps `sf agent test run`, which we wrap ourselves. Its other 60+ tools (metadata, SOQL, LWC) are irrelevant to agent testing.
- **Unnecessary indirection**: Calling an MCP server from an MCP server adds latency and failure modes.
- **Independent lifecycle**: We don't want our plugin to break when `@salesforce/mcp` releases a new version.
- **Coexistence, not dependence**: If a user also has the DX MCP Server installed, both work fine side by side. They just don't depend on each other.

---

## ADR-011: Plug-and-Play Installation -- Zero Config Beyond SF CLI Auth

**Context**: The user experience for installing and using the plugin should require the absolute minimum setup.

**Decision**: The plugin requires only two prerequisites that every Salesforce developer already has:
1. SF CLI (`sf`) installed with at least one authenticated org
2. Node.js >= 20

No additional configuration, environment variables, OAuth setup, or Salesforce org-side changes are needed beyond standard Agentforce prerequisites.

**Rationale**:
- `@salesforce/core` reads the sf CLI auth store directly from `~/.sf/` and `~/.sfdx/` -- no CLI invocation needed at runtime
- No External Client App (ECA) required -- we reuse the sf CLI access token (web auth flow tokens have sufficient permissions)
- No environment variables with secrets -- the plugin reads auth internally
- The `list_orgs` tool lets Claude discover available orgs interactively
- The `list_agents` tool lets Claude discover agents without upfront config
- Org-side Agentforce prerequisites (Einstein enabled, custom agent activated) are documented but not our responsibility

**Install experience**:
```
claude plugin install sfagent-tools
/sfagent-tools:test-run
# Claude asks which org, discovers agents, starts testing
```

**Org-side prerequisites (must be documented, not automated)**:
- Einstein enabled in Setup
- Agentforce enabled in Setup
- Custom agent created and activated (not "Agentforce Default" type)
- Enterprise/Unlimited Edition or free Developer Edition
- Sandbox recommended (tests can modify data, consume Flex Credits)
