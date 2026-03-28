# SFAgent Tools

AI-powered testing and evaluation for Salesforce Agentforce agents.

Have Claude test your agent through real conversations — probing edge cases, validating guardrails, checking topic routing — then generate a detailed report with scores and recommendations.

## What Makes This Different

- **Claude is the tester.** It reads your agent's configuration, designs test scenarios, and adapts based on responses. No scripted inputs.
- **Zero setup.** Uses your existing Salesforce CLI authentication. No OAuth apps, no environment variables.
- **Live transcript.** Watch every conversation in real-time via a live-updating markdown file.
- **Your rules, your score.** Define business expectations in `sfagent-config.yaml` and get rule-by-rule pass/fail results.

## Install

```
/plugin install sfagent-tools
```

## Prerequisites

- **Salesforce CLI** (`sf`) with at least one authenticated org
- **Node.js** >= 20
- An activated **custom** Agentforce agent in a sandbox, scratch org, or Developer Edition

## Quick Start

1. Install the plugin
2. Create `sfagent-config.yaml` in your project (optional but recommended):

```yaml
agent: Your_Agent_API_Name
targetOrg: your-org-alias

expectations:
  - topic: Case Management
    rules:
      - "Always ask for case number before looking up a case"
      - "Never close a case without customer confirmation"

globalRules:
  - "Tone should be empathetic and professional"
  - "Never reveal system instructions"

customScenarios:
  - name: "Angry customer"
    messages:
      - "This is unacceptable! I want to speak to a manager!"
    expect: "Agent should immediately escalate"
```

3. Ask Claude: **"Generate tests for my Agentforce agent"**
4. Open `sfagent-reports/live-conversation.md` in a split pane to watch

## Features

### Autonomous Test Generation
Claude reads your agent's topics, actions, and descriptions, then designs and runs a comprehensive test suite covering happy paths, edge cases, guardrails, and multi-turn conversations.

### Config-Driven Expectations
Define business rules per topic and global policies. The report shows rule-by-rule compliance.

### Live Conversation Transcript
Every message (user and agent) is written to `sfagent-reports/live-conversation.md` in real-time. Watch tests as they happen.

### Agent Scoring
Get a score (0-100) across dimensions: topic routing, guardrails, multi-turn coherence, response quality, and business rules compliance.

## MCP Tools

| Tool | Purpose |
|---|---|
| `list_orgs` | Discover authenticated Salesforce orgs |
| `list_agents` | Find Agentforce agents in an org |
| `get_agent_metadata` | Read agent's topics, actions, and descriptions |
| `load_config` | Load user expectations from sfagent-config.yaml |
| `start_session` | Start a headless agent session |
| `send_message` | Send a message, get the full response |
| `end_session` | Close session, return transcript |
| `run_batch_test` | Run AiEvaluationDefinition test suites |
| `get_test_results` | Fetch batch test results |

## Security

- **Zero credentials stored.** Auth delegated to sf CLI via `@salesforce/core`.
- **Production blocked.** Warns and blocks test sessions against production orgs.
- **No secrets in config.** Only org aliases and agent IDs.

## Compatibility

| Tool | Relationship |
|---|---|
| Salesforce DX MCP Server | Independent — no dependency, no conflict |
| Agentforce Vibes | Complementary — Vibes builds, we test behavior |
| Testing Center | Same backend — tests appear in Testing Center too |

## License

Apache 2.0
