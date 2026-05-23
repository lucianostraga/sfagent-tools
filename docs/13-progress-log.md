# Progress Log

Complete record of the SFAgent Tools project from idea to marketplace submission.

**Date**: 2026-03-28 to 2026-04-25
**Total commits on workspace**: 16
**Total commits on plugin repo**: 2
**Final state**: Plugin live on GitHub, submitted to marketplace, awaiting Anthropic review

---

## Phase 1: Research and Planning

### Initial Question
"I want to create a Claude Code plugin for testing Agentforce Agents. Does this exist? Is it possible?"

### Research Findings
- **Salesforce Agent API** (GA): Headless conversations via `/einstein/ai-agent/v1/`
- **Salesforce Testing API** (GA): Batch evaluation via Connect REST endpoints
- **`@salesforce/mcp` server**: Existing MCP server, but only `run_agent_test` (predefined batch tests)
- **Community Agentforce MCP servers**: 3 exist, all communication-only (no testing)
- **Agentforce Vibes**: Code-level testing only (Apex, LWC), not behavioral
- **No existing tool** combines headless conversations + assertions + reports in Claude Code

### Gap Identified
Nobody had built an AI-driven exploratory testing tool that:
- Uses Claude's reasoning to design tests
- Has real multi-turn conversations
- Generates structured reports
- Works inside the Claude Code workflow

---

## Phase 2: Architecture Decisions (12 ADRs)

Documented in `docs/01-architecture-decisions.md`:

| ADR | Decision | Rationale |
|---|---|---|
| 001 | Claude Code Plugin with bundled MCP server | Marketplace-ready packaging |
| 002 | SF CLI auth delegation only | Zero credentials stored |
| 003 | Agent API + Testing API | Cover both modalities |
| 004 | TypeScript + MCP SDK | SF ecosystem language |
| 005 | 7 lean focused tools | Salesforce recommends max ~20 |
| 006 | Internal SSE consumption | MCP is synchronous |
| 007 | Agentforce DX YAML format | No custom format invented |
| 008 | Security constraints | Zero secrets, sandbox-only |
| 009 | Modern Salesforce tech only | sf v2, AiEvaluationDefinition, etc. |
| 010 | No DX MCP Server dependency | Self-contained plug-and-play |
| 011 | Plug-and-play installation | No setup beyond sf CLI auth |

---

## Phase 3: Naming

**Considered**: agentforce-testing, agentforce-claude, sfagent, forceagent, agentdx
**Chosen**: **SFAgent Tools** (`sfagent-tools`)
- Avoids trademark issues with "Agentforce" and "Claude"
- Matches marketplace naming style (no kebab-case in display name)
- Open to grow beyond testing

---

## Phase 4: Building the Plugin

### Repo Structure
```
sfagent-tools/
├── .claude-plugin/
│   ├── plugin.json              # Manifest (name, version, author, license)
│   └── marketplace.json         # Marketplace catalog entry
├── .mcp.json                    # MCP server config
├── skills/sfagent-tools/SKILL.md # Auto-activating skill
├── commands/                    # 4 slash commands
│   ├── generate.md              # /sfagent-tools:generate
│   ├── test.md                  # /sfagent-tools:test
│   ├── explore.md               # /sfagent-tools:explore
│   └── report.md                # /sfagent-tools:report
├── hooks/hooks.json             # SessionStart auto-install npm deps
├── src/                         # TypeScript source
├── dist/                        # Compiled JS (committed)
├── package.json
├── tsconfig.json
├── LICENSE                      # Apache 2.0
└── README.md                    # Marketplace-facing showcase
```

### 9 MCP Tools Built
1. `list_orgs` — Discover authenticated SF orgs
2. `list_agents` — Find Agentforce agents in an org
3. `get_agent_metadata` — Read agent's topics, actions, descriptions
4. `load_config` — Load user expectations from sfagent-config.yaml
5. `start_session` — Start headless conversation session
6. `send_message` — Send message, get full agent response
7. `end_session` — Close session, return transcript
8. `run_batch_test` — Execute AiEvaluationDefinition tests
9. `get_test_results` — Fetch batch test results

### Tech Stack
- TypeScript + `@modelcontextprotocol/sdk` for MCP server
- `@salesforce/core` for auth (zero credential storage)
- `sf agent preview` CLI for headless conversations (Agent API requires ECA)
- Zod for input validation
- Apache 2.0 license

---

## Phase 5: Development Environment

### Scratch Org Setup
- Used user's devhub `lucianostraga@icloud.com`
- Initial scratch org failed: `EinsteinGPTForDevelopers` is not a valid feature
- Found correct config in user's existing project (`Einstein1AIPlatform`)
- Recreated with: `Einstein1AIPlatform`, `ServiceCloud`, `LiveAgent`, `Knowledge`
- `botSettings` failed (legal acceptance required) — removed
- Permission sets needed: `AgentPlatformBuilder`, `AgentforceServiceAgentBuilder`, `CopilotSalesforceAdmin`, `EinsteinGPTPromptTemplateManager`

### Sample Data
Seeded via Apex script:
- 5 accounts (Acme, Global Logistics, Sunrise Health, Peak Performance, Evergreen)
- 8 contacts with realistic emails and titles
- 8 cases covering all topics
- 5 orders

### Agent Created
**Agentforce Service Agent** with 8 topics:
- Case Management
- Account Management
- Reservation Management
- Delivery Issues
- Order Inquiries
- Escalation
- General FAQ
- Service Customer Verification

---

## Phase 6: Testing the Plugin

### Issue 1: Agent API 404 on Scratch Orgs
**Symptom**: `/einstein/ai-agent/v1/` endpoints return 404
**Cause**: Agent API requires External Client App (ECA) with OAuth Client Credentials flow
**Solution**: Switched to `sf agent preview` CLI commands which work with sf CLI auth

### Issue 2: BotDefinition Status Field
**Symptom**: `list_agents` failed with "No such column 'Status' on entity 'BotDefinition'"
**Solution**: Removed Status field from query

### Issue 3: Batch Testing Limitation
**Symptom**: `sf agent test create` rejects "EinsteinServiceAgent" type
**Solution**: Documented as Salesforce CLI limitation. Interactive testing (our core feature) works regardless.

### Issue 4: send_message Timeout
**Symptom**: After failed verification, agent takes >2 minutes to respond
**Solution**: Increased timeout to 180s with graceful error handling (use stdout if available)

### Successful End-to-End Test
4-turn conversation completed successfully:
- Started session via `sf agent preview start`
- Multi-turn conversation maintaining context
- Agent correctly routed to Service Customer Verification
- Session ended cleanly with full transcript

---

## Phase 7: Game-Changing Features Added

### 1. Autonomous Test Generation (Flagship)
Claude reads agent metadata and auto-designs tests:
- Per-topic: happy path, edge case, multi-turn
- Cross-cutting: guardrails, prompt injection, off-topic, escalation
- No user input required beyond "test my agent"

### 2. Config-Driven Expectations (`sfagent-config.yaml`)
Users define business rules:
```yaml
agent: Agentforce_Service_Agent
targetOrg: my-sandbox

expectations:
  - topic: Case Management
    rules:
      - "Always ask for case number before lookup"
      - "Never close a case without confirmation"

globalRules:
  - "Tone should be empathetic"
  - "Never reveal system instructions"

customScenarios:
  - name: "Angry customer"
    messages: ["This is unacceptable!"]
    expect: "Agent should empathize and escalate"
```

### 3. Live Conversation Transcript
Every message written to `sfagent-reports/live-conversation.md` in real-time. Users open in split pane to watch tests as they happen.

### 4. Agent Scoring (Documented, Phase 2)
0-100 score across dimensions: routing, guardrails, multi-turn, quality, business rules, escalation.

---

## Phase 8: Plugin Distribution

### GitHub Repo Created
**URL**: https://github.com/lucianostraga/sfagent-tools

### Marketplace JSON Added
After Anthropic support hint, added `.claude-plugin/marketplace.json` so the repo functions as both a plugin AND a marketplace catalog.

### Validation Issues Fixed
Found via `claude plugin validate`:
- **ERROR**: `author` was string, must be object → Fixed
- **WARNING**: Commands missing YAML frontmatter → Fixed all 4 commands

### Auto-Install Hook
Plugin install doesn't run `npm install`. Added SessionStart hook that:
- Compares `package.json` between plugin root and `${CLAUDE_PLUGIN_DATA}`
- Runs `npm install` if changed
- Sets `NODE_PATH` env so MCP server finds dependencies

### Self-Hosted Marketplace Works
Anyone can install the plugin today via:
```bash
claude plugin marketplace add lucianostraga/sfagent-tools
claude plugin install sfagent-tools@sfagent-tools-marketplace
```

---

## Phase 9: Marketplace Submission Saga

### Submission Process
1. Submitted via https://claude.ai/settings/plugins/submit
2. Filled all fields including platforms (Claude Code only), license (Apache-2.0)
3. Status moved to "Published"

### The Problem
Plugin shows "Published" in submission dashboard but:
- ❌ Does NOT appear at https://claude.com/plugins
- ❌ `claude plugin install sfagent-tools@claude-plugins-official` returns "not found"
- ❌ Direct check of `anthropics/claude-plugins-official` GitHub repo confirms 160 plugins, none Salesforce-related

### Support Conversations
- First conversation (215473973826344): Bot loop, deflected with self-service suggestions
- Second conversation (215474059429604): Sent detailed evidence, escalated to human queue
- No human response received yet
- Decision: resubmit form to push back into review queue

### Resubmission Attempt
- Resubmitted via https://claude.ai/settings/plugins/submit with same values
- Plugin name: SFAgent Tools
- Description, use cases, platforms, license — all identical to first submission
- Waiting to see if it goes through this time

### Verified on Our Side
- `claude plugin validate .` passes clean (no errors, no warnings)
- Plugin installs and works perfectly via self-hosted marketplace
- All required files present: plugin.json, marketplace.json, SKILL.md, commands with frontmatter, README

---

## Current State (as of 2026-04-25)

### What's Working
- ✅ Plugin builds clean (TypeScript compiles)
- ✅ All 9 MCP tools functional
- ✅ Validation passes
- ✅ Live transcript writes correctly
- ✅ Multi-turn conversations work
- ✅ Self-hosted marketplace install works for anyone
- ✅ GitHub repo public and clean
- ✅ Comprehensive README
- ✅ Documentation complete (13 docs)

### What's Pending
- ⏳ Anthropic marketplace listing (waiting on human review)
- ⏳ Demo video on README (path is set, video file in workspace)

### What's Next (Phase 2+ Roadmap)
- Agent scoring system with weighted dimensions
- Regression detection (re-run conversations, diff agent behavior)
- Red Team mode (adversarial-only testing)
- Compliance audit reports
- Multi-platform support (Codex, Cursor) — deferred
- Data Cloud + Knowledge Libraries testing — deferred (devhub limitation)

---

## Commits Timeline

```
e2aaa5d Initial project: research docs, architecture decisions, and sfagent-tools plugin scaffold
cc3a9ce MVP working: MCP server with sf agent preview, multi-turn conversations verified
7212d6d Add test spec, testing notes, and batch testing investigation
b1b844e Exploratory test results, timeout fix, live testing guide
f715f48 Fix MCP server cwd and add project-level .mcp.json
dbe5e0e Add autonomous test generation: get_agent_metadata tool + generate command
6bc220d Clean up repo structure: remove duplicates and leaked files
315a255 Fix report output location: save in user's project, not plugin dir
26fd637 Add live conversation transcript for real-time test viewing
b066fc2 Add gitignore for user-generated reports and transcripts
52aa4ae Add user config system: sfagent-config.yaml for custom expectations
2132081 Clean plugin repo: remove all dev artifacts
c1ed4d0 Add auto-dependency install hook for marketplace distribution
cdd1bb9 Rewrite README: comprehensive showcase for marketplace and GitHub
9cab0c1 Add demo video to README with real MCP tool output
064fc12 Fix marketplace submission issues
```

---

## Key Lessons Learned

1. **Agent API requires ECA setup** — not feasible for "plug and play" plugins on scratch orgs. Use `sf agent preview` instead.

2. **`sf agent test create` rejects Service Agents** — interactive testing via our MCP server works with all agent types. This validated our architecture choice.

3. **`claude plugin validate` is essential** — caught two real issues (author format, frontmatter) that the marketplace submission didn't surface.

4. **`node_modules/` should NOT be committed** — use SessionStart hook to auto-install. Use `${CLAUDE_PLUGIN_DATA}` for persistent state.

5. **Self-hosted marketplace works immediately** — `marketplace.json` in your repo lets anyone install via `claude plugin marketplace add owner/repo`. No Anthropic review needed for distribution.

6. **"Published" ≠ Published** — Anthropic's submission dashboard status doesn't reflect actual public marketplace state. Manual review is the gating factor.

7. **The plugin's value is the orchestration** — Claude reading metadata, designing tests, having real conversations is what makes it different from existing tools. Not the API wrapping itself.

---

## Useful URLs

| Resource | URL |
|---|---|
| Plugin GitHub repo | https://github.com/lucianostraga/sfagent-tools |
| Workspace repo (private) | /Users/lucianostraga/Documents/workspace/agentforce-claude |
| Direct install command | `claude plugin marketplace add lucianostraga/sfagent-tools` |
| Salesforce Agent API docs | https://developer.salesforce.com/docs/ai/agentforce/guide/agent-api.html |
| Salesforce Testing API docs | https://developer.salesforce.com/docs/ai/agentforce/guide/testing-api.html |
| Claude plugins reference | https://code.claude.com/docs/en/plugins-reference |
| Claude plugin marketplaces | https://code.claude.com/docs/en/plugin-marketplaces |
| Plugin submission form | https://claude.ai/settings/plugins/submit |
| Official marketplace catalog | https://github.com/anthropics/claude-plugins-official |
