# Testing Notes and Findings

Captured during MVP development on 2026-03-28.

---

## Agent API vs sf agent preview

**Agent API** (`/einstein/ai-agent/v1/`) returns 404 on scratch orgs. It requires an External Client App (ECA) with OAuth Client Credentials flow configured in the org. This is a significant setup step that breaks our "plug and play" goal.

**sf agent preview** (CLI, beta) works immediately on scratch orgs using the existing sf CLI auth. No additional org-side setup needed.

**Decision**: Use `sf agent preview start/send/end` as the primary conversation mechanism. Document Agent API as an advanced alternative for production-like testing with ECA setup.

### sf agent preview CLI reference

```bash
# Start session
sf agent preview start --api-name <AGENT_API_NAME> --target-org <ORG> --json

# Send message
sf agent preview send --session-id <ID> --api-name <AGENT_API_NAME> --utterance "<MESSAGE>" --target-org <ORG> --json

# End session
sf agent preview end --session-id <ID> --target-org <ORG> --json
```

Flags discovered through testing:
- `--api-name` (not `--name`) is required for both start and send
- `--utterance` (not `--message`) is the message flag
- `--session-id` must be passed to send along with `--api-name`
- `--use-live-actions` flag available but not used (preview mocks actions by default)

---

## Batch Testing Limitation: EinsteinServiceAgent type

`sf agent test create` fails with "Only AGENT subject type is supported" when the agent has `<agentType>EinsteinServiceAgent</agentType>`.

This means **batch testing via AiEvaluationDefinition is not currently supported for Service Agents** through the CLI. It may work through the Testing Center UI or the Connect REST API directly, but the `sf agent test create` command rejects it.

**Impact**: The `run_batch_test` and `get_test_results` MCP tools will only work with agents of type `Agent` (not `EinsteinServiceAgent`). This is a Salesforce platform limitation, not a plugin bug.

**Workaround**: Use the interactive testing approach (start_session → send_message → end_session) which works with all agent types via `sf agent preview`.

---

## Scratch Org Feature Requirements

Final working scratch org definition:

```json
{
  "orgName": "SFAgent Tools Dev",
  "edition": "Developer",
  "language": "en_US",
  "features": [
    "EnableSetPasswordInApi",
    "Einstein1AIPlatform",
    "ServiceCloud",
    "LiveAgent",
    "Knowledge"
  ],
  "settings": {
    "einsteinGptSettings": { "enableEinsteinGptPlatform": true },
    "agentPlatformSettings": { "enableAgentPlatform": true },
    "knowledgeSettings": { "enableKnowledge": true },
    "omniChannelSettings": { "enableOmniChannel": true }
  }
}
```

### What failed
- `EinsteinGPTForDevelopers` -- invalid feature name
- `botSettings.enableBots` -- requires legal terms acceptance in UI first
- Agent API on scratch orgs -- returns 404 (needs ECA)
- `BotDefinition.Status` field -- does not exist

### Permission sets needed
- `AgentPlatformBuilder`
- `AgentforceServiceAgentBuilder`
- `CopilotSalesforceAdmin`
- `EinsteinGPTPromptTemplateManager`

### Data Cloud
Not available on devhub `lucianostraga@icloud.com`. Needed for Knowledge Libraries. Sign up for new Developer Edition at developer.salesforce.com/signup for Data Cloud access.

---

## Service Customer Verification Topic

The agent's first response is always identity verification:
> "Before I can assist you with your case, I need to verify your identity. Could you please provide your email address or username?"

This is expected behavior from the **Service Customer Verification** topic. For testing other topics, the user can:
1. Deactivate the agent, remove the verification topic, reactivate
2. Provide email/verification in the conversation before testing other topics
3. Use `sf agent preview` with `--use-live-actions` flag (but this requires real data)

---

## Live Plugin Testing in Claude Code

To test the plugin locally:

```bash
# From the agentforce-claude repo root
claude --plugin-dir ./sfagent-tools
```

Then in Claude Code:
```
/sfagent-tools:test
/sfagent-tools:explore
/sfagent-tools:report
```

Or let the SKILL.md auto-activate by asking Claude to test your agent.

### Alternative: add to .mcp.json manually

Add to your project's `.claude/settings.json` or `~/.claude.json`:
```json
{
  "mcpServers": {
    "sfagent-tools": {
      "command": "node",
      "args": ["/absolute/path/to/sfagent-tools/dist/index.js"]
    }
  }
}
```
