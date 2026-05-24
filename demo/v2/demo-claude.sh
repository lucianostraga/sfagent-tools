#!/bin/bash
# Claude Code demo — runs a real claude --print session against the real
# sfagent-tools MCP server and renders tool calls + agent response inline.
# Visual styling mimics the actual Claude Code TUI for authenticity.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Claude Code-style banner (matches the real TUI startup)
printf '\033[38;2;215;119;87m▗\033[48;2;215;119;87m\033[38;2;0;0;0m ▗   ▖ \033[49m\033[38;2;215;119;87m▖\033[0m  \033[1mClaude Code\033[22m  \033[38;2;153;153;153mv2.1.150\033[0m\n'
printf '  \033[48;2;215;119;87m       \033[0m  \033[38;2;153;153;153mOpus 4.7 (1M context) · Claude Max\033[0m\n'
printf '  \033[38;2;215;119;87m▘▘ ▝▝\033[0m  \033[38;2;153;153;153m~/work/agentforce-demo\033[0m\n'
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
sleep 1.2

# Type the user prompt as if a human is typing
printf '❯ '
PROMPT="Test my Agentforce agent in sfagent-dev. List the agents, start a session, send 'Can you help me with my order?', then end the session."
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.013
done
echo ""
sleep 0.6

# Run Claude and pipe through the stream renderer
claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions "$PROMPT" \
  | node "$SCRIPT_DIR/render-claude-stream.js"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1mReal conversation. Real agent. Real Salesforce.\033[0m\n'
printf '\033[2mInstall:\033[0m  claude plugin install sfagent-tools@sfagent-tools-marketplace\n'
sleep 2.5
