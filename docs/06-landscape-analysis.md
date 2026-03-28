# Landscape Analysis

A comprehensive analysis of existing tools, their capabilities, and where the SFAgent Tools fits.

Last updated: 2026-03-28

---

## Existing Tools Matrix

### Salesforce Official Tools

| Tool | Type | Agent Testing? | Interactive? | MCP? | CI/CD? |
|---|---|---|---|---|---|
| **Testing Center** | UI (Setup) | Batch evaluation | No | No | No |
| **Testing API** (Connect REST) | API | Batch evaluation | No | No | Yes (via REST) |
| **Agentforce DX** (sf CLI) | CLI | Batch + preview | Preview only (beta) | No | Yes (JSON/JUnit/TAP) |
| **Salesforce DX MCP Server** | MCP Server | `run_agent_test` only | No | Yes | Indirect |
| **Agent API** | REST API | No (conversation only) | Yes (headless) | No | Possible |
| **Agentforce Vibes** | IDE Extension | Code-level only | No | Uses @salesforce/mcp | No |

### Community Tools

| Tool | Type | Capabilities | Limitations |
|---|---|---|---|
| **pkurimella/agentforce-mcp-server** | MCP Server | Talk to agents via Agent API | No assertions, no testing, communication only |
| **xlengelle-sf/agentforce-mcp-xlengelle** | MCP Server | Talk to agents via Agent API | No assertions, no testing, communication only |
| **agentforce-mcp/simple-agentforce-mcp** | MCP Server | Talk to agents via Agent API | No assertions, no testing, communication only |
| **Jaganpro/sf-skills (agentforce-testing)** | Claude Code Skill | Claims multi-turn validation | Skill/prompt only, no MCP server, no API integration |
| **sf-ai-agentforce-observability** | MCP Market Skill | Post-hoc session analysis | Does not execute tests, observability only |

### Commercial Platforms

| Tool | Type | Capabilities | Why not sufficient |
|---|---|---|---|
| **Provar** | SaaS | Enterprise agent testing | Standalone product, not Claude Code integrated |
| **Copado** | SaaS | CI/CD + testing | Standalone product, not Claude Code integrated |
| **TestZeus** | SaaS | Agent testing | Standalone product, not Claude Code integrated |

---

## Gap Analysis

### What no tool does today

1. **AI-driven exploratory testing** -- No tool uses an LLM to dynamically generate test conversations, adapt based on agent responses, and discover issues through intelligent probing.

2. **MCP wrapper for Testing API** -- The Testing API's three Connect REST endpoints have no MCP wrapper. The DX MCP Server only wraps `sf agent test run` (CLI command), not the direct API.

3. **Test assertions on headless conversations** -- Community MCP servers let you talk to agents but cannot evaluate whether the agent did the right thing.

4. **Regression spec generation** -- No tool converts exploratory test findings into formal `AiEvaluationDefinition` YAML specs.

5. **Unified testing in Claude Code** -- No single plugin combines headless conversations + batch evaluation + reporting in the developer's coding workflow.

---

## Positioning Statement

The SFAgent Tools is:

- **NOT** a replacement for Salesforce's Testing Center, Testing API, or Agentforce DX
- **NOT** a replacement for the Salesforce DX MCP Server
- **NOT** a communication bridge to Agentforce agents (those exist)
- **NOT** a code-level testing tool (Vibes does that)

The plugin **IS**:

- An **orchestration layer** that uses Salesforce's official APIs for execution
- An **intelligence layer** where Claude drives the testing strategy
- A **documentation generator** that produces actionable test reports
- A **bridge** between exploratory testing and formal regression suites
- **Complementary** to every existing tool in the ecosystem

---

## Salesforce DX MCP Server Relationship

The official `@salesforce/mcp` server (v0.26.x, Beta, GA ~Feb 2026) provides 60+ tools across 14 toolsets. Relevant to this plugin:

**What it covers that we don't need to rebuild:**
- Metadata deployment/retrieval
- SOQL queries
- Apex test execution
- Code analysis
- LWC development tools
- User/permission management

**What it covers partially:**
- `run_agent_test` -- runs predefined batch tests via YAML specs (wraps `sf agent test run`)

**What it does NOT cover (our value):**
- Interactive headless conversations via Agent API
- Ad-hoc/exploratory testing
- Real-time response evaluation
- Test assertion engine
- Report generation
- YAML spec generation from exploratory findings

**Relationship**: Independent. Our plugin does NOT depend on the DX MCP Server (see ADR-010). Both can coexist if the user has them installed, but our plugin talks to Salesforce directly via `@salesforce/core` and sf CLI commands. We don't need their `run_agent_test` -- we wrap `sf agent test run` ourselves.

---

## Agentforce Vibes Relationship

Agentforce Vibes is Salesforce's enterprise vibe coding platform (GA since October 2025). Available in VS Code, Code Builder, Cursor, Windsurf.

**What it does**: AI-powered code generation, Apex unit tests, LWC test cases, code coverage, Code Analyzer, deployment.

**What it does NOT do**: Behavioral agent testing, headless conversations, response quality evaluation.

**Lifecycle positioning**:
- Vibes = **Build + Unit Test + Deploy**
- Our plugin = **Behavioral Test + Batch Evaluation**

These are complementary stages. A developer uses Vibes to build an agent, then uses our plugin to stress-test it.

**Architectural alignment**: Vibes uses `@salesforce/mcp` as its MCP server. Our plugin follows the same patterns (MCP extension, sf CLI auth, `--toolsets`/`--tools` selective enablement). Developers using Vibes will find our plugin familiar.
