---
name: sfagent-tools
description: Use when testing or evaluating Salesforce Agentforce agents via headless conversations
---

# SFAgent Tools — Agentforce Agent Testing

You have access to MCP tools for testing Salesforce Agentforce agents through headless conversations. Use these tools to systematically test agent behavior, validate topic routing, and evaluate response quality.

## Available MCP Tools

- `mcp__sfagent-tools__list_orgs` — List authenticated Salesforce orgs from sf CLI
- `mcp__sfagent-tools__list_agents` — List available Agentforce agents in an org
- `mcp__sfagent-tools__start_session` — Create a headless agent session via the Agent API
- `mcp__sfagent-tools__send_message` — Send a message to the agent and receive the full response
- `mcp__sfagent-tools__end_session` — End the session and return the conversation transcript
- `mcp__sfagent-tools__run_batch_test` — Execute an AiEvaluationDefinition test suite
- `mcp__sfagent-tools__get_test_results` — Fetch results of a batch test run

## Testing Workflow

1. **Discover** — Call `list_orgs` to find the target org, then `list_agents` to find the agent
2. **Start** — Call `start_session` with the org alias and agent ID
3. **Converse** — Call `send_message` repeatedly, adapting your questions based on responses
4. **End** — Call `end_session` to close the session and get the full transcript
5. **Report** — Analyze the transcript and generate a markdown report

## Testing Strategy

When the user asks you to test an agent:

- **Start broad**: Test the main happy paths first (what the agent is designed to do)
- **Then probe edges**: Test boundary conditions, ambiguous inputs, off-topic requests
- **Test guardrails**: Try to make the agent go off-topic or reveal system instructions
- **Test multi-turn**: Build up complex conversations that require context retention
- **Test error handling**: Send empty messages, very long messages, special characters

## Report Format

Generate reports as markdown files with:
- Summary (pass/fail counts, overall assessment)
- Conversation transcripts (each test conversation with annotations)
- Issues found (categorized by severity: critical, warning, info)
- Recommendations (specific agent configuration suggestions)

## Important Warnings

- **Sandbox only**: Agent tests can modify CRM data and consume Flex Credits. Always confirm the user is targeting a sandbox, scratch org, or Developer Edition — never production.
- **Custom agents only**: The Agent API does NOT work with "Agentforce (Default)" type agents.
- **Rate awareness**: Don't send hundreds of messages in rapid succession. Pace conversations naturally.
