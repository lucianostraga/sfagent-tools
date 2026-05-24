#!/bin/bash
# Codex demo — runs a real codex exec session against the same sfagent-tools
# MCP server. Visual styling mimics the actual Codex CLI startup.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Codex CLI-style banner
printf '\033[38;2;16;163;127m⚡\033[0m  \033[1mOpenAI Codex\033[22m  \033[38;2;153;153;153mv0.133.0\033[0m\n'
printf '   \033[38;2;153;153;153mgpt-5.5 · xhigh reasoning · workspace-write\033[0m\n'
printf '   \033[38;2;153;153;153m~/work/agentforce-demo\033[0m\n'
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
sleep 1.2

# Type the prompt
printf '❯ '
PROMPT="Test my Agentforce agent in sfagent-dev. List the agents, start a session, send 'Can you help me with my order?', then end the session."
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.013
done
echo ""
sleep 0.6

# Codex exec already prints MCP tool calls cleanly — filter out the banner so
# we don't double up on it, and colorize the MCP lines
codex exec --dangerously-bypass-approvals-and-sandbox "$PROMPT" 2>&1 \
  | grep -v -E '^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user$|codex$|Reading additional|Test my Agentforce)' \
  | sed -E "s/^mcp: sfagent-tools\/(.*)/$(printf '\033[36m')⏺$(printf '\033[0m') $(printf '\033[1m')\1$(printf '\033[0m')/"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1mSame plugin. Different AI. Same agent.\033[0m\n'
printf '\033[2mInstall:\033[0m  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n'
sleep 2.5
