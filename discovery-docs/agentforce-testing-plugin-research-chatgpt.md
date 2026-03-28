# Claude Code Plugin for Testing Salesforce Agentforce Agents

## Feasibility in one statement

What you want is feasible, because Claude Code plugins can bundle reusable skills/agents/hooks and optionally MCP servers, while Salesforce already exposes (a) “headless agent” chat via the Agent API, including a streaming (SSE) endpoint, and (b) first-class, pro-code agent testing via Agentforce DX (Salesforce CLI) and the Testing API—so a Claude Code plugin can orchestrate official Salesforce test/preview/chat surfaces, then generate reports and documentation from the resulting transcripts and evaluation outputs. citeturn19view0turn17view0turn10view1turn8view2turn3view3

## What already exists and where your idea would overlap

Salesforce has already invested heavily in agent testing and “programmatic conversations,” which means your plugin should be positioned as an orchestration + documentation layer (and not a replacement for Salesforce’s official tooling).

### Salesforce-native testing and preview capabilities you can build on

Salesforce documents three primary ways to test Agentforce agents, with different definition formats and automation levels: Testing Center (UI, CSV), Agentforce DX (CLI, YAML), and Testing API (code, XML via Metadata API + execution via Connect API). citeturn8view2turn3view4turn8view1

Agentforce DX is particularly aligned with your “drop files + run automated conversations + produce reports” concept because it treats an agent test spec as a local YAML file that describes one or more test cases (utterance, expected topic, expected actions, expected outcome, optional metrics and conversation context). citeturn10view0turn11view0turn11view2

It also outputs results in automation-friendly formats: agent tests run asynchronously by default (with a resume step), and you can request JSON, TAP, or JUnit outputs for CI/reporting pipelines. citeturn10view1

Separately, Agentforce DX provides an “agent preview” workflow that supports both a simulated mode (mocking actions to avoid org data risk) and live mode (using real org actions), and even describes programmatic preview flows that other agents can use. citeturn10view3

Two constraints matter for your plugin design and should be surfaced prominently to users:

Agent testing is available only in sandboxes (per Salesforce docs), and tests can consume requests/credits and can modify data. citeturn8view2

Agent preview has important fidelity limitations (for example: preview doesn’t strictly adhere to connection endpoint configuration and doesn’t support escalation, per Salesforce docs). citeturn10view3

### Salesforce MCP is real—and it already mentions running agent tests

Salesforce explicitly positions MCP as a way to access Salesforce services through AI applications using “ready-made MCP servers,” including the Salesforce DX MCP Server (Beta), and even uses “Run agent tests in my org” as a sample prompt in its MCP Solutions page. citeturn18view0turn18view1

So yes: your concept overlaps with “Salesforce MCP” in the sense that Salesforce already provides an MCP server intended to let AI tools run DX tasks—including tests—through tool calls rather than custom scripting. citeturn18view0turn3view2

That said, the Salesforce DX MCP Server is a general Salesforce developer-experience toolset (metadata/data/users/dev tasks). It’s not intrinsically a specialized “agent test harness with documentation output,” which is where your plugin can add value. citeturn18view0turn3view2

### Community projects that are very close to your idea

Before building from scratch, you should be aware of two community efforts that partially implement what you described:

A Claude Code “skill” specifically for Agentforce testing exists in the wild: `sf-ai-agentforce-testing` in Jaganpro’s `sf-skills` repository. Its own description explicitly includes “multi-turn conversation validation,” “CLI Testing Center specs,” “topic/action coverage analysis,” and a structured test-fix loop—very close to your “extensively test an agent, then generate documentation” plan. citeturn12search1turn12search0

An MCP server project exists that exposes the Agentforce Agent API (auth/session/message exchange) via MCP, enabling LLM-driven conversations with an Agentforce agent. citeturn7view2turn12search9

There’s also an experimental Claude Code plugin marketplace focused on Salesforce/Agentforce workflows that bundles related integrations such as the Salesforce DX MCP server (and others), although its showcased plugin appears oriented toward demo portal automation rather than deep agent testing. citeturn7view0turn7view3

Implication for your build decision: the “does this already exist?” answer is “parts exist.” The differentiator for your plugin would be a single cohesive experience in Claude Code that (a) standardizes test plan files, (b) executes tests through official Salesforce channels (Agentforce DX / Testing API / Agent API), and (c) produces high-quality, audit-friendly reports and documentation.

## How Claude Code plugins work and what a test plugin is “made of”

Claude Code is designed to read your codebase, edit files, and run commands, which makes it a practical host for a local testing harness plugin. citeturn5view2

### Plugin composition at a practical level

Claude Code supports both standalone per-project configuration and reusable plugins. Standalone lives in a project’s `.claude/` directory; plugins are separate directories intended for sharing/versioning and use a manifest at `.claude-plugin/plugin.json`. citeturn5view0turn19view0

A plugin’s identity and namespace come from `.claude-plugin/plugin.json`, which defines the plugin name/description/version and determines the prefix for namespaced commands like `/my-plugin:hello`. citeturn19view1turn19view3

Claude Code’s plugin guide also lays out the typical root-level layout: `skills/`, `agents/`, `hooks/`, plus `.mcp.json` for MCP server configs and `.lsp.json` for language server integrations, with the important rule that only `plugin.json` lives inside `.claude-plugin/`. citeturn19view0

During development you can load a plugin directly using `claude --plugin-dir ./my-plugin` (and you can load multiple plugin dirs). This is the fastest way to iterate locally before distributing via a marketplace. citeturn19view2turn5view4

### Where MCP fits in Claude Code plugins

Claude Code connects to external tools via MCP servers, and plugins can bundle MCP servers so users don’t need manual setup: plugin MCP servers can be defined in a `.mcp.json` at the plugin root or inline in `plugin.json`, start automatically when the plugin is enabled, and show up alongside other MCP tools. citeturn14view2turn13view2

Two MCP-related Claude Code features are directly relevant to your “stream conversations + generate big reports” goals:

Claude Code warns when MCP tool output exceeds 10,000 tokens and has a configurable max output token limit via `MAX_MCP_OUTPUT_TOKENS` (default max 25,000). This matters for long transcripts and verbose evaluation reports. citeturn14view3

MCP servers can “push messages with channels” into the active session so Claude can react to external events (for example CI results or other streaming updates), by declaring the `claude/channel` capability and opting in via `--channels`. This is one of the cleaner architectural options for “streaming” test progress back into the Claude Code conversation. citeturn14view0

## Salesforce surfaces you can test through

Your plugin idea splits naturally into two testing modes: “formal evaluation tests” and “freeform conversational probes.” Salesforce supports both; they just live in different products/APIs.

### Formal evaluation testing with Agentforce DX and Testing API

Salesforce explicitly frames Testing API as the way to “programmatically build out tests that automate the evaluation process” and assess many requests quickly; it’s the programmatic complement to interactive testing in Agentforce Builder. citeturn3view4

The Testing Connect API exposes an execution lifecycle (start → poll status → fetch results). This matters if you choose “direct API calls” instead of “shell out to CLI.” citeturn8view1

Agentforce DX offers an opinionated CLI-first workflow where you generate a YAML test spec that describes test cases (utterance/topic/actions/outcome) and optional enhancements like custom evaluation criteria and conversation history to add multi-turn context. citeturn10view0turn11view0turn11view2

Critically for your specific “automated conversations” phrasing: the test spec supports a `conversationHistory` section expressly described as enabling multi-turn testing by providing context leading up to the utterance being evaluated. citeturn11view2turn11view0

### Freeform “headless” conversations via the Agent API

Salesforce’s Agent API guide positions the API as a way to access goal-oriented autonomous agents from anywhere a REST API can be called, including creating/deploying “headless agents” without UI constraints. citeturn3view3

The Agent API supports both synchronous messaging and a streaming endpoint. Salesforce’s examples document that streaming responses are delivered via server-sent events (SSE) with an `Accept: text/event-stream` header, and the stream includes events like `ProgressIndicator`, `TextChunk`, `Inform` (complete message), and `EndOfTurn`. citeturn17view0

This gives you a direct technical foundation for “streaming those conversations” in your plugin: even if Claude Code itself doesn’t natively render token-by-token tool outputs, your plugin can consume Salesforce’s SSE stream and surface progress incrementally (for example via channels, or by periodically emitting summarized chunks). citeturn17view0turn14view0

### Authentication alignment with Salesforce CLI

Your instinct to lean on Salesforce CLI for authentication is sensible for two reasons:

Agentforce DX is itself implemented as Salesforce CLI commands (for example, `agent test run`, `agent preview`, etc.), so if your plugin executes these commands, you automatically inherit “whatever org auth is already set up” locally. citeturn10view1turn10view3turn9search22

Salesforce CLI’s recommended auth path for many dev workflows is a browser-based login flow (`org login web`), explicitly intended for MFA/SSO environments. That keeps your plugin out of the business of credential storage. citeturn15search2turn15search23

If you later choose to call Agent API directly (instead of via `sf agent preview`), you’ll need to decide whether to (a) mint tokens via Salesforce’s documented “create token” flows for the Agent API, or (b) extract a valid access token from an authenticated CLI org context and reuse it carefully. The former is more “platform orthodox” and auditable; the latter is often simpler for developer tooling but must be designed with clear security boundaries.

## A recommended architecture for your plugin that fits Salesforce and Claude Code

This section proposes an architecture that is deliberately “Salesforce-friendly”: it builds on Agentforce DX / Testing API first (because they are the official testing frameworks), then adds Agent API-based headless probes as an advanced module.

### Plugin mental model

Think of your plugin as three layers:

Orchestration layer (Claude Code plugin): user-facing commands/skills, file conventions, report templates, and a consistent workflow.

Execution layer (Salesforce-native tools): Agentforce DX CLI commands and/or Testing API calls; optionally Agent API chat sessions for exploratory tests.

Integration layer (optional MCP servers): either the Salesforce DX MCP Server (official) for metadata/test operations, or a small purpose-built MCP server bundled with your plugin to expose “run tests / stream progress / parse outputs” as structured tool calls.

This layering keeps your plugin differentiated: Salesforce provides the raw test execution; you provide “opinionated automation + documentation.”

### Concrete “MVP” workflow that requires the least invention

A strong minimal version that adds value quickly:

User drops one or more YAML specs into the repo (for example `agent-tests/*.yaml`) following the Agentforce DX test spec model (test cases + optional conversation history + metrics). citeturn11view0turn11view2

User runs a plugin command like `/agentforce-test:run` (namespaced via your plugin manifest). Claude Code plugins are inherently namespaced and designed for shareable workflows. citeturn19view1turn5view0

The skill executes:

`sf agent test run ...` (async by default, or synchronous with `--wait`) and captures output in JSON/JUnit for machine parsing. citeturn10view1

If async, it automatically runs the corresponding resume/results commands using the job ID. citeturn10view1

Claude then generates a repo artifact such as `reports/agentforce/<timestamp>/report.md`, summarizing failures by category (topic mismatch, action mismatch, outcome mismatch, metric regressions) and appending key excerpts from “generated data” when available.

Why this is “Salesforce-friendly”: you’re not bypassing Salesforce’s existing testing surfaces; you’re standardizing their use inside an AI-assisted workflow and producing repeatable documentation.

### Adding “automated conversations” beyond test specs

Once MVP works, add two optional advanced modes:

Conversation-history expansion mode (still “formal testing”): automatically synthesize richer `conversationHistory` blocks in test specs to approximate multi-turn interactions, then run tests through Agentforce DX. Salesforce docs explicitly call out conversation history as a way to enhance test context for multi-turn testing. citeturn11view2

Headless probe mode (true “chat sessions”): use the Agent API to start a session and send a multi-turn conversation script, optionally consuming the SSE stream for realtime updates. Salesforce’s Agent API examples document the streaming model and event structure. citeturn17view0turn3view3

A practical way to merge these: treat Agent API probes as a “generator” for candidate test cases. For example, your plugin can run 20 exploratory conversations, cluster failure patterns, and then propose new deterministic Agentforce DX test cases that become part of the formal regression suite.

### How to approach “streaming” in Claude Code without fighting the platform

You have three viable patterns (from most “Claude-native” to most “simple scripting”):

Channel-based streaming (Claude-native): bundle an MCP server (or extend an existing one) that publishes progress events via MCP channels so updates appear inside the Claude session as they occur. Claude Code’s MCP docs explicitly describe servers pushing messages into the session using `claude/channel`. citeturn14view0

Tool-output chunking (Claude-safe): keep execution in a single tool call, but emit periodic summarized chunks (for example, every N SSE events) to avoid huge outputs and reduce the risk of hitting MCP output thresholds. Claude Code’s MCP output limits are explicit and should inform how much transcript you push back at once. citeturn14view3

Terminal streaming (simplest): run a local command that streams to stdout (for example, curl or a small Node/Python client consuming the Agent API SSE stream), while the plugin captures a finalized structured log file for Claude to analyze after completion. Salesforce’s Agent API streaming uses `text/event-stream` and events like `TextChunk`, which makes this pattern straightforward from an HTTP standpoint. citeturn17view0

### Where Salesforce DX MCP Server fits if you want “MCP-first” design

If you’d rather avoid shelling out to `sf` commands (or want more structured tool calls), consider making your plugin depend on (or bundle setup for) the official Salesforce DX MCP Server.

Its documentation includes a Claude Code `.mcp.json` configuration snippet and shows that it can expose specific tools/toolsets, including test-related tools. citeturn3view2turn18view0

Salesforce’s MCP Solutions page positions the DX MCP Server as letting developers “use natural language” to issue complex commands to orgs without learning platform-specific CLIs/auth flows, which aligns with your goal of reducing friction for plugin users. citeturn18view0

In that world, your plugin becomes mostly “skills that orchestrate MCP tools + parse outputs + write reports,” rather than “skills that shell out to CLI.”

## A realistic build roadmap that gets you shipping quickly

### Phase that validates the concept with minimal risk

Start by targeting Agentforce DX test execution and reporting first, because:

It already matches your “put some files with instructions/config” model (YAML test specs). citeturn11view0turn10view0

It already outputs automation-friendly formats (JSON/JUnit), which makes report generation reliable. citeturn10view1

It already supports multi-turn context via `conversationHistory`, reducing pressure to immediately implement a full Agent API conversation runner. citeturn11view2

### Phase that turns it into a “real plugin,” not just a script

Follow Claude Code’s plugin scaffolding approach:

Create the manifest at `.claude-plugin/plugin.json` (name/description/version/author), and keep operational components at the plugin root (`skills/`, `agents/`, `hooks/`, `.mcp.json`). citeturn19view0turn19view1

Develop locally using `claude --plugin-dir ./your-plugin` and test your commands via `/your-plugin:command`, then iterate with `/reload-plugins`. citeturn19view2turn19view0

As you add richer automation, keep an eye on output size (especially if you embed transcripts). Claude Code’s MCP output warning threshold and max output token cap are explicit guardrails you should design around. citeturn14view3

### Phase that decides whether you’re “net-new” or “curating existing projects”

Because there are already community artifacts close to your goal—especially Jaganpro’s Agentforce testing skill, which claims multi-turn validation/coverage/fix loops—you should explicitly decide whether you’re:

Contributing to or wrapping an existing agent-testing skill ecosystem (faster, but you inherit their conventions), or citeturn12search1turn12search0

Building a distinct opinionated plugin focused on your team’s needs (more work, but clearer ownership).

Likewise, for Agent API conversations, an MCP server already exists that wraps the Agentforce API (auth/session/message). You could reuse it as an integration component or use it as a reference implementation. citeturn7view2turn12search9

### Phase that adds headless Agent API probes and true streaming

Once the DX-based evaluation harness is stable:

Implement an Agent API client mode that uses the streaming endpoint (SSE) and captures a raw event log plus a normalized transcript, using Salesforce’s documented event types (`ProgressIndicator`, `TextChunk`, `Inform`, `EndOfTurn`) as your canonical structure. citeturn17view0

Optionally map event stream progress into Claude Code via MCP channels to show “live” conversation progress in-session. citeturn14view0

Add a report section that differentiates “formal regression failures” (DX/Testing API) from “exploratory probe anomalies” (Agent API), and recommend converting high-confidence anomalies into formal YAML tests.

### Phase that makes it enterprise-friendly

If you plan to share the plugin across a team:

Package it as a Claude Code plugin suitable for marketplace distribution (either private marketplace for internal teams or public, depending on your goals). Claude Code provides explicit marketplace mechanics and supports installing plugins from catalogs, including an official marketplace available in Claude Code. citeturn5view3turn5view4turn4search2

Avoid storing Salesforce secrets inside the plugin wherever possible; instead rely on CLI-authenticated org contexts (or provide explicit “bring your own connected app” configuration). This aligns with how Salesforce expects dev teams to operate in MFA/SSO environments using browser-based CLI auth. citeturn15search2turn10view1

Make sandbox-only and data-modification/credit-consumption warnings non-optional in the UX, because Salesforce itself documents those as properties of agent testing. citeturn8view2

## Bottom line

Yes, it’s possible—and in a sense, Salesforce and Anthropic have already built most of the “hard infrastructure” you need:

Claude Code gives you a structured plugin system (manifest + skills/agents/hooks + optional MCP servers) and even supports MCP-based message pushing for more real-time experiences. citeturn19view0turn14view0turn14view2

Salesforce provides official agent testing (Agentforce DX / Testing API) designed for batch evaluation and regression suites, including multi-turn context via conversation history and CI-friendly outputs. citeturn11view2turn10view1turn8view2

Salesforce also provides a headless Agent API with an SSE streaming endpoint, which is the technical basis for “stream those conversations.” citeturn3view3turn17view0

But: parts of what you want already exist in the community (Agentforce testing skills and an Agentforce API MCP server). The highest-leverage path is to ship a narrow plugin that orchestrates official Agentforce DX tests + produces excellent documentation, then add Agent API streaming probes as an advanced mode once the reporting and regression harness is solid. citeturn12search1turn7view2turn10view1turn11view0