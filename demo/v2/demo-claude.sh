#!/bin/bash
# Claude Code demo — runs a real claude --print session against the real
# sfagent-tools MCP server and renders tool calls + agent response inline.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Title
echo -e "\033[1;36m▶ SFAgent Tools\033[0m \033[2m— test Agentforce agents from your CLI\033[0m"
sleep 1.2
echo ""
echo -e "\033[2muser:\033[0m"
sleep 0.3
PROMPT="Test my Agentforce agent: connect to sfagent-dev, list the agents, start a session with Agentforce_Service_Agent, send 'Can you help me with my order?', then end the session and show me the response."
# Type the prompt with realistic pacing
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.012
done
echo ""
echo ""
sleep 0.8

# Run Claude and pipe through the stream renderer
claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions "$PROMPT" \
  | node "$SCRIPT_DIR/render-claude-stream.js"

echo ""
sleep 1
echo -e "\033[2m─────────────────────────────────────────\033[0m"
echo -e "\033[1mReal conversation. Real agent. Real Salesforce.\033[0m"
echo -e "\033[2mInstall: /plugin marketplace add lucianostraga/sfagent-tools\033[0m"
sleep 2.5
