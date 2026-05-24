#!/bin/bash
# Claude Code demo — runs a real claude --print session and renders output
# IDENTICAL to the actual Claude Code interactive TUI format.
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
sleep 1.3

# User prompt (short, realistic)
printf '❯ '
PROMPT="test the agent in sfagent-dev — quick smoke test, real conversation"
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.022
done
echo ""
echo ""
sleep 0.5

# Run Claude with a focused prompt that produces visible value
FULL_PROMPT="Run a quick smoke test on the Agentforce agent in org sfagent-dev using sfagent-tools. Use exactly this flow, all on one session: start_session, send 'Can you help me with my order?', send 'My email is sarah.johnson@acme.com', send 'I want to speak to a manager now', generate_test_spec with suiteName 'smoke-test', end_session. Then in ONE short paragraph, tell me: which scenarios passed, which failed, and where the regression spec was saved. Be concise — this is a demo."

claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions "$FULL_PROMPT" \
  | node "$SCRIPT_DIR/render-claude-stream.js"

sleep 1
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}One sentence. Real conversation. Real findings. Ready for CI.${RESET}\n"
printf "${DIM}Install:${RESET}  claude plugin install sfagent-tools@sfagent-tools-marketplace\n"
sleep 2.5
