#!/bin/bash
# Claude Code demo — runs a real claude --print session against the real
# sfagent-tools MCP server and renders tool calls + agent response inline.
# Walks through ALL plugin capabilities tool by tool, grouped by purpose.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Clean Claude Code banner — text-only, renders crisply at any zoom level
printf '\033[38;2;215;119;87m✳\033[0m  \033[1mClaude Code\033[22m  \033[38;2;153;153;153m(v2.1.150)\033[0m\n'
printf '\n'
printf '   \033[38;2;153;153;153mmodel:\033[0m     \033[1mclaude-opus-4-7\033[22m  \033[38;2;153;153;153m(1M context)\033[0m\n'
printf '   \033[38;2;153;153;153mdirectory:\033[0m ~/Documents/workspace/agentforce-claude\n'
printf '\n'
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
sleep 1.4

# Type the user prompt as if a human is typing
printf '❯ '
SHORT_HINT='Walk me through every sfagent-tools capability against the Agentforce Service Agent in sfagent-dev — discovery, live testing, regression hand-off, diagnostics.'
for (( i=0; i<${#SHORT_HINT}; i++ )); do
  printf "%s" "${SHORT_HINT:$i:1}"
  sleep 0.011
done
echo ""
sleep 0.6

PROMPT='Walk me through every sfagent-tools capability against the Agentforce_Service_Agent in sfagent-dev, organized as 4 chapters. For each tool call, briefly say what it returned (one short line).

DISCOVERY:
1) list_orgs (filter to sfagent-dev only)
2) list_agents
3) get_agent_metadata (just show subagent count and names)
4) load_config

LIVE TESTING:
5) start_session
6) send_message "Can you help me with my order?"
7) send_message "My email is sarah.johnson@acme.com"

REGRESSION HAND-OFF:
8) generate_test_spec (suiteName: demo-suite)
9) end_session

DIAGNOSTICS:
10) list_traces (filter to Agentforce_Service_Agent)
11) read_trace for the session you just ended

Keep it tight — this is a demo.'

# Run Claude and pipe through the stream renderer
claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions "$PROMPT" \
  | node "$SCRIPT_DIR/render-claude-stream.js"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1m12 MCP tools. One plugin. Real agent. Real Salesforce.\033[0m\n'
printf '\033[2mInstall:\033[0m  claude plugin install sfagent-tools@sfagent-tools-marketplace\n'
sleep 2.5
