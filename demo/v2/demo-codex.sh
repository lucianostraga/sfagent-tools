#!/bin/bash
# Codex demo — runs a real codex exec session, matches real Codex startup.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.4

RESET='\033[0m'
DIM='\033[38;2;136;136;136m'
BOLD='\033[1m'
BLUE='\033[38;2;100;180;240m'

# Real Codex CLI banner (rounded box, matches `codex` boot)
printf '╭──────────────────────────────────────────────────────────────────────────╮\n'
printf "│  ${BOLD}>_  OpenAI Codex${RESET}  ${DIM}(v0.133.0)${RESET}                                       │\n"
printf '│                                                                          │\n'
printf "│  ${DIM}model:${RESET}     ${BOLD}gpt-5.5 xhigh${RESET}    ${BLUE}/model${RESET} ${DIM}to change${RESET}                  │\n"
printf "│  ${DIM}directory:${RESET} ~/Documents/workspace/agentforce-claude                │\n"
printf '╰──────────────────────────────────────────────────────────────────────────╯\n'
echo ""
sleep 1.3

printf '❯ '
PROMPT="test the agent in sfagent-dev — quick smoke test, real conversation"
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.022
done
echo ""
echo ""
sleep 0.5

FULL_PROMPT="Run a quick smoke test on the Agentforce agent in org sfagent-dev using sfagent-tools. Use exactly this flow, all on one session: start_session, send 'Can you help me with my order?', send 'My email is sarah.johnson@acme.com', send 'I want to speak to a manager now', generate_test_spec with suiteName 'smoke-test', end_session. Then in ONE short paragraph, tell me: which scenarios passed, which failed, and where the regression spec was saved. Be concise — this is a demo."

# Codex exec already prints MCP tool calls cleanly. Filter banner/echo, then
# collapse each "mcp: sfagent-tools/X started" + "mcp: ... completed" pair
# into a single "⏺ Called sfagent-tools (ctrl+o to expand)" line to match
# the real Codex collapsed-call display.
codex exec --dangerously-bypass-approvals-and-sandbox "$FULL_PROMPT" 2>&1 \
  | awk '
      /^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user$|codex$|Reading additional|Run a quick|Be efficient|Use exactly)/ { next }
      /^mcp: sfagent-tools\// {
        if ($0 ~ /\(completed\)/) {
          printf "\033[38;2;16;163;127m⏺\033[0m \033[38;2;136;136;136mCalled sfagent-tools (ctrl+o to expand)\033[0m\n\n"
        }
        next
      }
      { print }
    '

sleep 1
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}Same one sentence. Same real test. Same regression spec.${RESET}\n"
printf "${DIM}Install:${RESET}  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n"
sleep 2.5
