#!/bin/bash
# Claude Code demo — REPLAYS pre-captured Claude output through the paced
# renderer. Same authentic stream-json content (recorded once via real
# `claude --print` against the real MCP server) but with controlled timing
# so the resulting video lets viewers read at human pace.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.4

# Real Claude Code 3-line ASCII logo + version/model/cwd block
PINK='\033[38;2;215;119;87m'
RESET='\033[0m'
DIM='\033[38;2;136;136;136m'
BOLD='\033[1m'

printf "${PINK} ▐▛███▜▌${RESET}   ${BOLD}Claude Code${RESET} ${DIM}v2.1.150${RESET}\n"
printf "${PINK}▝▜█████▛▘${RESET}  ${DIM}Opus 4.7 (1M context) · Claude Max${RESET}\n"
printf "${PINK}  ▘▘ ▝▝  ${RESET}  ${DIM}~/Documents/workspace/agentforce-claude${RESET}\n"
echo ""
sleep 1.6

# User prompt
printf '❯ '
PROMPT="test the agent in sfagent-dev — quick smoke test, real conversation"
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.025
done
echo ""
echo ""
sleep 0.9

# Replay the pre-captured real Claude output through the paced renderer
cat "$SCRIPT_DIR/captured/claude-stream.jsonl" | node "$SCRIPT_DIR/render-claude-stream.js"

sleep 1.2
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}One sentence. Real conversation. Real findings. Ready for CI.${RESET}\n"
printf "${DIM}Install:${RESET}  claude plugin install sfagent-tools@sfagent-tools-marketplace\n"
sleep 2.5
