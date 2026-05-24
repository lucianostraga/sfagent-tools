#!/bin/bash
# Codex demo — runs a real codex exec session against the same sfagent-tools
# MCP server. Codex shows MCP tool calls in its native output.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Title
echo -e "\033[1;32m▶ SFAgent Tools\033[0m \033[2m— same plugin, OpenAI Codex\033[0m"
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

# Codex exec already prints MCP tool calls cleanly
codex exec --dangerously-bypass-approvals-and-sandbox "$PROMPT" 2>&1 \
  | grep -v -E '^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user$|codex$|Reading additional)' \
  | sed -E "s/^mcp: sfagent-tools\/(.*)/$(printf '\033[36m')⏺$(printf '\033[0m') $(printf '\033[1m')\1$(printf '\033[0m')/"

echo ""
sleep 1
echo -e "\033[2m─────────────────────────────────────────\033[0m"
echo -e "\033[1mWorks in any MCP-compatible client.\033[0m"
echo -e "\033[2mInstall (Codex): add to ~/.codex/config.toml — npx sfagent-tools-mcp-server\033[0m"
sleep 2.5
