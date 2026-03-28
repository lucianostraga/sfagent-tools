# SFAgent Tools

AI-powered testing and evaluation for Salesforce Agentforce agents.

Run headless conversations, validate behavior, and generate reports — all from Claude Code.

## What It Does

Drop a test plan, run a command, and Claude will have conversations with your Agentforce agent — testing edge cases, validating guardrails, checking topic routing — then generate a detailed report of what works and what doesn't.

**Claude is the tester.** It doesn't just run scripted inputs — it thinks about what to test, adapts based on responses, and probes edge cases it discovers during conversation.

## Install

```
/plugin install sfagent-tools
```

## Prerequisites

You need two things (both standard for any Salesforce developer):

- **Salesforce CLI** (`sf`) with at least one authenticated org
- **Node.js** >= 20

Your Salesforce org needs:
- Einstein and Agentforce enabled
- At least one activated **custom** agent (not "Agentforce Default" type)
- Sandbox, scratch org, or Developer Edition recommended

## Usage

### Test an agent with a plan

```
/sfagent-tools:test path/to/test-plan.yaml
```

### Exploratory testing

```
/sfagent-tools:explore
```

Claude will ask which org and agent to target, then start probing.

### Generate a report

```
/sfagent-tools:report
```

## How It Works

The plugin bundles an MCP server that provides 7 tools:

| Tool | Purpose |
|---|---|
| `list_orgs` | Discover authenticated Salesforce orgs |
| `list_agents` | Find active Agentforce agents in an org |
| `start_session` | Start a headless Agent API session |
| `send_message` | Send a message, get the full response |
| `end_session` | Close session, return transcript |
| `run_batch_test` | Run AiEvaluationDefinition test suites |
| `get_test_results` | Fetch batch test results |

Claude orchestrates these tools to have multi-turn conversations with your agent, evaluate responses, and produce reports.

## Security

- **Zero credentials stored.** Auth is delegated entirely to sf CLI (`@salesforce/core`).
- **Production blocked.** The plugin warns and blocks test sessions against production orgs.
- **No secrets in config.** Only org aliases and agent IDs — never tokens or passwords.

## Compatibility

| Tool | Relationship |
|---|---|
| Salesforce DX MCP Server | Independent — no dependency, no conflict |
| Agentforce Vibes | Complementary — Vibes builds, we test behavior |
| sf agent test / preview | We wrap these — you can also use them directly |
| Testing Center UI | Same APIs — tests appear in Testing Center too |

## License

Apache 2.0
