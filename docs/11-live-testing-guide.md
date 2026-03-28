# Live Testing Guide

How to test the SFAgent Tools plugin in Claude Code.

---

## Quick Start

From the repo root:

```bash
claude --plugin-dir ./sfagent-tools
```

This starts Claude Code with the plugin loaded. You'll see the 7 MCP tools available and the skill activated.

---

## Using Slash Commands

### Test with a plan
```
/sfagent-tools:test specs/Agentforce_Service_Agent-testSpec.yaml
```
Claude reads the YAML test spec and executes each test case as a conversation.

### Exploratory testing
```
/sfagent-tools:explore
```
Claude asks which org/agent to target, then probes the agent with diverse scenarios.

### Generate report
```
/sfagent-tools:report
```
Generates a markdown report from the latest test session.

---

## Natural Language (Skill Auto-Activates)

You can also just ask Claude naturally:

- "Test my Agentforce agent on sfagent-dev"
- "Have a conversation with the Service Agent and see if it handles delivery issues correctly"
- "Run 10 different test scenarios against the agent and generate a report"
- "Test the agent's guardrails -- try to make it go off-topic"

The SKILL.md will auto-activate and Claude will use the MCP tools.

---

## What Claude Sees

When the plugin is loaded, Claude has access to:

```
mcp__sfagent-tools__list_orgs          -- discover orgs
mcp__sfagent-tools__list_agents        -- find agents
mcp__sfagent-tools__start_session      -- start headless session
mcp__sfagent-tools__send_message       -- send message, get response
mcp__sfagent-tools__end_session        -- end session, get transcript
mcp__sfagent-tools__run_batch_test     -- run AiEvaluationDefinition
mcp__sfagent-tools__get_test_results   -- fetch batch results
```

Claude orchestrates these naturally in multi-turn conversations.

---

## Verifying the Plugin Works

### Step 1: Check tools are loaded
In Claude Code, run `/mcp` to see the server status. You should see `sfagent-tools` with 7 tools.

### Step 2: Test org discovery
Ask Claude: "List my Salesforce orgs"
Expected: Claude calls `list_orgs` and shows your authenticated orgs.

### Step 3: Test agent discovery
Ask Claude: "List agents in sfagent-dev"
Expected: Claude calls `list_agents` and shows `Agentforce_Service_Agent`.

### Step 4: Test a conversation
Ask Claude: "Start a conversation with the Agentforce Service Agent on sfagent-dev and ask about a delivery issue"
Expected: Claude calls `start_session`, then `send_message` multiple times, then `end_session`.

---

## Known Behaviors

### Service Customer Verification
The agent will always ask for identity verification first. This is the Service Customer Verification topic. Expected responses:
- "Could you please provide your email address or username?"
- "Please enter the verification code sent to your email"

To test other topics, either:
1. Provide an email from the seed data (e.g., `sarah.johnson@acme.com`) and a fake verification code
2. Deactivate the verification topic in the agent's configuration

### Preview Mode Limitations
- Actions are simulated (mocked) by default -- the agent won't actually create/update records
- Use `--use-live-actions` flag for real actions (modify the agent-api.ts if needed)
- Preview doesn't strictly follow connection endpoint configuration
- Escalation to human agent is not supported in preview

### Batch Testing
- Only works with agents of type `Agent`, not `EinsteinServiceAgent`
- Service Agents created from templates are `EinsteinServiceAgent` type
- Use interactive testing (start_session/send_message/end_session) for Service Agents

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "No orgs found" | Run `sf org login web --alias my-org` |
| "No agents found" | Check Agentforce is enabled and agent is activated |
| "Session failed" | The agent must be activated (not deactivated) |
| MCP server not showing | Check `node --version` >= 20, rebuild with `npm run build` |
| Tools not appearing | Run `/reload-plugins` in Claude Code |
