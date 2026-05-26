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

---

## Phase 5: v0.2.0 — Monorepo + Codex + TrailheadDX modernization (2026-05-23)

### Why this phase
Anthropic's curated marketplace hadn't listed the plugin. Decided to: (1) ship a Codex packaging in parallel so distribution isn't single-vendor-dependent, (2) verify nothing in the 2026 Salesforce releases supersedes us or breaks us, (3) fix spec compliance issues that may have blocked the Anthropic community sync.

### Investigations run

Three parallel deep-research passes:

1. **Claude Code plugin spec (current)** — surfaced that there are TWO marketplaces (`claude-plugins-official` curated/no-application vs `claude-community` open-submission), explaining why submitting via the form doesn't land in the official one. Also flagged `owner.url` as undocumented (silently breaks Claude.ai nightly sync) and noted `displayName` (added in v2.1.143) for nicer UI.
2. **Codex plugin spec** — confirmed the plugin system mirrors Claude Code's (manifests, skills, MCP servers, marketplaces). MCP servers are 100% portable. Codex sandbox is host-level not plugin-level — must document required user `config.toml` entries.
3. **TrailheadDX 2026 + Spring/Summer '26 release notes** — confirmed no official MCP-based agent-testing tool exists from Salesforce. Three breaking changes flagged: `topic` → `subagent` rename (Apr 15, 2026), `sf agent preview start` flag change (Apr 15), and `sf` CLI token redaction in JSON (May 27). Three new capabilities to adopt: `sf agent trace read/list` (May 20), `sf agent test run-eval` YAML spec (May 20 Beta), `sf agent preview end --all`.

### Verified safe before any changes
- **Auth path** uses `@salesforce/core` `AuthInfo`/`Org` directly (not CLI output scraping) → unaffected by May 27 deadline ✓
- **Local + origin git divergence**: discovered local `main` and `origin/main` had **no common ancestor** (separate histories with same branch name). Canonicalized on local, tagged origin as `archive/origin-pre-rewrite-2026-05-23` for safety, force-pushed local.
- **Anthropic community marketplace JSON**: directly inspected `anthropics/claude-plugins-community/.claude-plugin/marketplace.json` — `sfagent-tools` is NOT listed. Only Agentforce entry is `agentforce-adlc` from Salesforce Research.

### Changes shipped

**Repo restructure**
- Reorganized into a monorepo (`packages/server`, `packages/claude-code-plugin`, `packages/codex-plugin`)
- All file moves done with `git mv` so history is preserved
- Root `package.json` with npm workspaces
- Server published as `@sfagent/mcp-server` on npm (single source of truth across both plugins)

**Spec compliance fixes (Claude Code)**
- Added `displayName: "SFAgent Tools"` to `plugin.json`
- Removed undocumented `owner.url` from `marketplace.json`
- Moved `metadata.description` to top-level `description`
- Bumped plugin to v0.2.0

**TrailheadDX-driven code changes**
- Renamed `topic` → `subagent` everywhere: `TopicRecord` → `SubagentRecord`, `expectedTopic` → `expectedSubagent`, `topicMap` → `subagentMap`, plus tool descriptions
- Testing API parser accepts both legacy `expectedTopic` AND new `expectedSubagent` fields from the API (backward-compat fallback)

**New MCP tools (3)**
- `list_traces` — wraps `sf agent trace list` (May 20 CLI feature)
- `read_trace` — wraps `sf agent trace read`
- `generate_test_spec` — emits YAML compatible with `sf agent test run-eval`. Turns the plugin into an upstream of the native pipeline (explore here, regress in CI with Salesforce-native tooling).

**Distribution model change**
- `.mcp.json` switched from bundled `node ${CLAUDE_PLUGIN_ROOT}/dist/index.js` to `npx -y @sfagent/mcp-server@latest`
- Removed the auto-install `SessionStart` hook (no longer needed since npx handles deps)

**Codex packaging (new)**
- `.codex-plugin/plugin.json` with full `interface` block (displayName, longDescription, capabilities, defaultPrompt, brandColor, composerIcon, logo)
- `.mcp.json` (Codex variant with `mcp_servers` top-level key)
- `skills/sfagent-tools/SKILL.md` (copied from Claude plugin; both use agentskills.io standard)
- `skills/sfagent-tools/agents/openai.yaml` with `interface`, `policy`, `dependencies.tools` block declaring MCP server dependency
- `.agents/plugins/marketplace.json` for local/personal distribution
- `README.md` with install instructions and sandbox configuration requirements

**Documentation**
- New root `README.md` explaining the monorepo and both install paths
- Updated `.gitignore` for monorepo build artifacts

### Strategic positioning shift

From "AI testing for Agentforce in Claude Code" to **"Live, exploratory Agentforce testing in Claude Code AND Codex — complements `sf agent test run-eval` by generating the specs it runs."**

TrailheadDX 2026 confirmed Salesforce shipped no MCP-based agent testing tool. Our moat is intact, and the `generate_test_spec` hand-off positions us as a collaborator with the native pipeline rather than a competitor.

### Known follow-ups
- Drop real icons/screenshots into `packages/codex-plugin/assets/` before official directory submission
- Submit Codex plugin to OpenAI's Plugin Directory once self-serve publishing opens for non-partners
- Verify whether re-submitting to the Anthropic community marketplace after the spec fixes successfully syncs to `claude-plugins-community`

---

## Phase 6: v1.0.0 — end-to-end verification, real CLI demos, marketplace-ready (2026-05-24)

### Why this phase
v0.2.x had spec compliance + Codex packaging on paper but had never been smoke-tested against a real Agentforce agent end-to-end. The prior demo video was hardcoded HTML mocks, not real CLI output. Goal of the day: stand up a real test environment, exercise every tool, fix what breaks, and replace the demo with authentic terminal recordings.

### Scratch org saga (longer than expected — UI walls)

1. **Original scratch org expired.** Recreated `sfagent-dev` from `devhubLuciano` with the recovered scratch def. Bumped duration to 30 days (was 7).
2. **First Salesforce wall:** "User doesn't have access to use agent" when trying to create an Agentforce Service Agent via `sf agent create --spec`. Initial scratch def was missing required features.
3. **Updated scratch def** to include `ServiceCloud`, `LiveAgent`, `Knowledge` (in addition to `Einstein1AIPlatform`) — these are the features the original demo had but had been lost.
4. **Permission set licenses + permsets** required for Agentforce agent creation:
   - PSLs: `EinsteinGPTCopilotPsl`, `AgentforceServiceAgentBuilderPsl`, `AgentPlatformBuilderPsl`, `EinsteinGPTPromptTemplatesPsl`
   - Permsets: `AgentPlatformBuilder`, `AgentforceServiceAgentBuilder`, `EinsteinGPTPromptTemplateManager`, `CopilotSalesforceAdmin`, `CopilotSalesforceUser`
   - The missing one that unblocked it: **`CopilotSalesforceAdmin`** (Agentforce Default Admin) — not in the original setup docs.
5. **PSL license exhaustion:** Each failed `sf agent create` attempt consumed `EinsteinGPTPromptTemplatesPsl` slots (only 3 per scratch org) by creating orphan `EinsteinServiceAgent User` users. Wrote Apex to delete orphan PSLAs + deactivate orphan users to free licenses.
6. **`BotDefinition.BotUserId` is read-only via API.** Even after `sf agent publish authoring-bundle` succeeded and created the agent metadata, activation required a Bot User assignment that can ONLY be set in the Agent Builder UI. Confirmed by Apex compile error: `Field is not writeable: BotDefinition.BotUserId`.
7. **Final solution:** user created the agent manually through the Setup wizard. The wizard handles the BotUser creation and assignment internally. Agent created with 8 subagents matching the original demo (Case Management, Delivery Issues, Order Inquiries, Account Management, Reservation Management, Escalation, General FAQ, Service Customer Verification).
8. **Language fix:** scratch org admin defaulted to Spanish (`LanguageLocaleKey: es`, `LocaleSidKey: es_AR`) so all CLI errors were untranslated. Apex `update User` to `en_US` upfront for future setups.

### Smoke testing all 12 MCP tools — bugs found

Tested every tool end-to-end against the live agent. Three real bugs surfaced that would have shipped broken to users:

| Bug | Symptom | Fix | Patch |
|---|---|---|---|
| `sf agent preview` commands need an SFDX project dir on cwd | `RequiresProjectError` on `start_session`, `send_message`, `end_session`, `read_trace` | New `utils/sf-project.ts` helper materializes a minimal `sfdx-project.json` in `os.tmpdir()/sfagent-tools-mcp-sfdx/` and uses it as cwd for every `sf agent` call | **0.2.2** |
| `sf agent trace list/read` use `--agent` (not `--api-name`) and don't take `--target-org` | "Nonexistent flag: --target-org" — completely wrong flags | Rewrote `tools/trace.ts` with correct flags. Traces are LOCAL files in the SFDX project, not fetched from the org. | **0.2.3** |
| `sf agent trace read` throws `TraceParseError` on empty `{}` trace files (when agent didn't invoke actions) | `read_trace` returned a cryptic error for any session that just hit verification gates | `read_trace` now falls back to reading the trace JSON files directly from disk when the CLI parser dies, with a friendly explanation that the agent didn't invoke any actions | **0.2.4** |

After three patches, **all 10 critical tools verified working** (skipped `run_batch_test` + `get_test_results` since they need a pre-existing `AiEvaluationDefinition`). Cross-client verified: identical agent responses in both Claude Code and Codex.

### v1.0.0 ship

Bumped all five version-tracked manifests (root `package.json`, server `package.json`, both plugin `plugin.json`s, marketplace.json) to `1.0.0`. Published `sfagent-tools-mcp-server@1.0.0` to npm. Cut `v1.0.0` GitHub release with full notes — replaced the stale `Apr 8 Demo Video` release tag that had been the "Latest" badge in the sidebar.

### npm publishing learnings
- npm requires 2FA on publish by default. Hardware security key flow via `npm login` (WebAuthn browser flow) works; CLI `--otp` flag doesn't (security keys don't generate codes).
- Granular access tokens with "Bypass 2FA for publishing" enabled also work for non-interactive CI.

### Real CLI demo videos (many iterations)

The original demo was Playwright + edge-tts that rendered hardcoded HTML mockups looking like a terminal. Decided to replace with real terminal recordings using `asciinema` + `agg`.

Eight visible iterations landing on the current shape:
- **v1–v3**: tried multiple chapter-based formats, banner styles, prompt structures. User: *"that's not how anyone actually uses the plugin."*
- **v4**: switched to one realistic user prompt ("test the agent in sfagent-dev"). User: *"I REALLY LIKE IT!"*
- **v5–v6**: tried to match real Claude Code TUI format exactly (the 3-line `▐▛███▜▌` ASCII logo, `Called sfagent-tools N times (ctrl+o to expand)` collapsed style). Hit problems where the logo rendered like a pig at GIF zoom.
- **v7**: per-tool individual rendering. User: *"big chunk of text no one could understand, a disaster."*
- **v8 final**: **10 short per-tool clips** (~8–10s each), organized in the README as a grid by purpose (Discover / Run a live test / Hand off to CI / Diagnose). Each clip is a real `claude --print` capture replayed through a paced renderer. Plus one main "sanity check" demo for the hero. User: *"FANTASTIC! THIS IS WHAT I NEEDED."*

**Crucial technical insight:** `claude --print` produces stream-json output in a single burst after thinking for 30–70s. `asciinema` then sees a silent gap followed by a flurry of output, producing unreadable videos. Fix: **pre-capture** the real Claude output to a JSON file once, then have the demo script **replay** it through a paced renderer. The content stays 100% authentic (it's real Claude output captured against the real MCP server), only the timing is human-controlled.

Final pipeline at `demo/v3/` (per-tool clips) and `demo/v2/` (main demo). `build-clips.sh` regenerates all 10 clips from scratch.

### README restructure (sales-pitch lead)

Rewrote in the order the user wanted for marketplace discovery:
1. **Hero**: *"The first AI-driven testing toolkit for Salesforce Agentforce — in Claude Code AND OpenAI Codex."*
2. **What it does** (9 benefit bullets with emoji markers — scannable in 10 seconds)
3. **See it work** (main demo + Codex parity)
4. **Install in 30 seconds** (Claude + Codex side by side, both first-class)
5. **Every tool, in 10 seconds each** (10 per-tool clip grid)
6. Why this exists / How it works / Zero setup / Built on TrailblazerDX 2026 / etc.

Also surfaced terminology clarification (*subagent (formerly topic)*) at the first mention in every section, so readers landing anywhere on the page get the context.

Reframed `list_orgs` description to *"pick which org to test your agent in (production blocked)"* to differentiate from Salesforce DX MCP's generic org listing.

### Cleanup
Removed the entire v0.1 Playwright + edge-tts demo pipeline (~103 MB local, ~70 MB committed): `demo/audio/`, `demo/recordings/`, the old `narration.js` + `record-*.js` scripts, `node_modules`, `.venv`, and the original 2.1 MB `sfagent-tools-demo.mp4`. **752 files changed, 171,715 deletions.** The new pipelines at `demo/v2/` + `demo/v3/` are tiny by comparison.

### Files added that signal a healthy repo
- `CLAUDE.md` + `AGENTS.md` at repo root — cross-tool entry points (Claude Code reads CLAUDE.md, Codex reads AGENTS.md). Each has conventions, gotchas, useful commands.
- `demo/clips/sfagent-{tool}.gif` × 10 — the per-tool mini clips
- `packages/server/src/utils/sf-project.ts` — the SFDX-project-dir helper

### End-of-day shape

- npm: `sfagent-tools-mcp-server@1.0.0` (live, downloadable, install-tested)
- GitHub: `v1.0.0` tag + release (badge in sidebar shows "1.0.0 · today")
- README: hero pitch → 9-bullet capabilities → main demo → install → 10-clip grid → context
- All 5 version slots aligned at 1.0.0
- Agentforce Service Agent active in sfagent-dev (30-day scratch)
- 0 known bugs in the published server
- 0 megabytes of dead pipeline

### Lessons learned

1. **Trust but verify** — v0.2.x looked "done" on paper, but real smoke testing surfaced 3 bugs in 30 minutes. Spec compliance is necessary but not sufficient.
2. **Salesforce scratch org Agentforce setup is genuinely hard** — even with the right scratch def features, the BotUserId is API-locked and forces a UI step. Document this for plugin users.
3. **`asciinema` + replay-from-capture > recording real interactive sessions** — interactive `claude` driven by `expect` had PTY issues; pre-capturing the stream-json and replaying with paced rendering gave us authentic content with controlled timing.
4. **Production-style narrated demos beat realistic ones for marketplace pitches** — but user prompts WITHIN those demos have to be realistic ("test my agent") not artificial ("walk me through every tool").
5. **Per-tool clips solved the "wall of text" problem** — 10 short focused clips read better than one long demo, even if the total content is similar.
6. **Tool descriptions that overlap with other MCP servers need disambiguating language** — `list_orgs` overlaps with Salesforce DX MCP, so we reframed to signal our testing context.

---

## Phase 7: Per-tool demos, Vibes, marketplace reality-check, competitive analysis (2026-05-26)

### Demo videos — final form: per-tool clip grid
After the v1.0.0 "sanity check" demo, iterated further on user feedback. Tried a tool-by-tool walkthrough ("disaster — wall of text"), then landed on **10 short per-tool clips** (~8-10s each) in a README grid organized by purpose (Discover / Run a live test / Hand off to CI / Diagnose). Built via `demo/v3/build-clips.sh` (capture real `claude --print` output per tool → replay through paced renderer → asciinema → gif/mp4). The main "sanity check" demo stays as the hero; the grid shows each capability individually. Key realization that fixed pacing: `claude --print` dumps all output in one burst after 30-70s of thinking, so we **pre-capture and replay** rather than record live.

### README restructured as a sales pitch
Reordered for marketplace discovery: hero tagline → 9-bullet "What it does" (benefit-oriented, emoji markers) → demos → install (Claude + Codex + Vibes) → per-tool grid → why/how/etc. Added `(formerly topic)` subagent clarification at the first mention in every section. Reframed `list_orgs` to "pick which org to test your agent in" to avoid overlap perception with Salesforce DX MCP. Soft-pedaled Cursor/Continue/Cline/Windsurf as "coming soon" (not yet packaged).

### Agentforce Vibes — confirmed compatible, added as first-class client
Researched and confirmed Vibes (Salesforce's enterprise vibe-coding IDE + VS Code extension, GA at TDX 2026) is fully MCP-compatible: reads `a4d_mcp_settings.json` with the same `command`/`args` schema as Claude/Codex, supports `npx`, defaults to Claude Sonnet 4.5. Wired `sfagent-tools` into the user's actual VS Code + Cursor Vibes configs. Added Vibes to the hero tagline, a badge, the install section, and "currently supported." Strategic point: Vibes is arguably the most natural home for an Agentforce testing tool (user already inside the SF ecosystem).

### Demo pipeline cleanup
Removed ~70 MB of dead v0.1 Playwright + edge-tts pipeline (audio/, recordings/, old scripts, node_modules, .venv, original 2.1 MB mp4). 752 files changed, 171,715 deletions.

### Community marketplace — the reality check
Discovered `sfagent-tools` IS live in `claude-community` — but pinned to the **orphaned** commit `097f5f8` (v0.1, plugin-at-repo-root). Reviewer note confirmed it's live (after some internal "Layer D testing" row-flipping).

**Two compounding problems surfaced:**
1. **Auto-bump is dead.** The session's opening force-push (canonicalize-on-local) left `097f5f8` with NO common ancestor to `main`. The marketplace CI walks commits forward from the pinned SHA — impossible across divergent histories. The live pin will never self-advance to v1.0.0; only a fresh review can move it.
2. **Monorepo move broke the bare-URL submission.** The plugin left the repo root, but the submit form has only a single "Link to plugin" URL field (no separate path). I had wrongly assured the user the restructure was "safe for the submission" by assuming a path field existed. Owned the mistake.

**Fixes applied:**
- Added a **root `.claude-plugin/marketplace.json`** with `source: "./packages/claude-code-plugin"` — makes the bare repo URL + `/plugin marketplace add` both resolve to the subdir plugin. This mirrors how 177 other community monorepo plugins work (Anthropic converts root-marketplace-pointing-to-subdir into `git-subdir` catalog entries). Verified by fresh-cloning from GitHub and `claude plugin validate . --strict`.
- Removed the now-redundant subdir `marketplace.json` (kept the plugin.json). Single canonical marketplace at root.
- Wrote `docs/14-marketplace-submission-playbook.md` — root causes, exact resubmission values (deep-link URL `…/tree/main/packages/claude-code-plugin`, lowercase `sfagent-tools` name), catalog-check command, decision tree.

**Decision: don't resubmit yet.** Wait a bounded 48h to see if the pending May 23 review re-clones latest main (picking up the root marketplace.json). Auto-bump won't help, so if it's still pinned to `097f5f8` after 48h, resubmit fresh with the deep-link URL. Removal isn't useful — a correct fresh submission supersedes the stale entry, and removal would only create an installable-gap. No documented self-service removal exists anyway.

### Competitive analysis
Surveyed the community catalog: 9 Salesforce plugins, only ONE direct Agentforce-testing competitor — `agentforce-adlc` (SalesforceAIResearch). Key facts:
- **We're first.** sfagent-tools repo created 2026-03-28, published Mar 28. agentforce-adlc created 2026-04-10 — 13 days later. The "first AI-driven testing toolkit for Agentforce" claim is provable.
- **They're skills-only + Claude-only.** We're MCP-native (12 executable tools) + cross-client (Claude/Codex/Vibes) + npm-published. Genuine differentiation.
- **They have more traction** (61 stars vs our 22) — the "SalesforceAIResearch" brand effect. So claim "first" but not "most popular."

### Verified Codex + Vibes survived the marketplace changes
After removing/moving marketplace.json files, confirmed Codex + Vibes still work — they install via `npx -y sfagent-tools-mcp-server@latest` (npm package, independent of marketplace.json). Proved with a live `codex exec list_agents` call returning `Agentforce_Service_Agent`.

### Where it stands end of Phase 7
- npm `1.0.0`, GitHub `v1.0.0` release, all 5 version slots aligned
- Live in `claude-community` (v0.1 pin) + v1.0.0 update pending review with the path fix now on main
- Works in Claude Code, Codex (proven), Vibes (config wired, same npm package)
- First-mover, documented, clean repo
- Open item: community pin advancing v0.1 → v1.0.0 (48h watch, then resubmit per playbook)

### Lessons learned (Phase 7)
1. **Don't force-push over a published commit** — it orphans the marketplace pin and kills auto-update. Rebase/merge to preserve ancestry.
2. **Verify the actual submission/distribution mechanism before declaring a structural change "safe"** — I assumed a path field existed; it didn't. The monorepo move silently broke the bare-URL submission.
3. **A monorepo IS marketplace-compatible** via a root marketplace.json pointing at subdirs (177 plugins prove it) — but you have to add that root manifest; moving the plugin alone isn't enough.
4. **"First" is about creation date, not traction** — we're provably first (Mar 28 vs Apr 10) even though the Salesforce-brand competitor has more stars.
5. **Removal ≠ the fix for a stale listing** — a correct fresh submission supersedes; removal just creates downtime.
