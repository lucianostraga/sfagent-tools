#!/bin/bash
# Codex demo — runs a real codex exec session. Same realistic dev prompt
# as the Claude demo to prove cross-client parity.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Real Codex CLI startup banner
printf '╭──────────────────────────────────────────────────────────────────────────╮\n'
printf '│  \033[1m>_  OpenAI Codex\033[22m  \033[38;2;153;153;153m(v0.133.0)\033[0m                                       │\n'
printf '│                                                                          │\n'
printf '│  \033[38;2;153;153;153mmodel:\033[0m     \033[1mgpt-5.5 xhigh\033[22m    \033[38;2;100;180;240m/model\033[0m \033[38;2;153;153;153mto change\033[0m                  │\n'
printf '│  \033[38;2;153;153;153mdirectory:\033[0m ~/Documents/workspace/agentforce-claude                │\n'
printf '╰──────────────────────────────────────────────────────────────────────────╯\n'
sleep 1.4

# Type the prompt
printf '❯ '
PROMPT="Run a quick sanity check on my Agentforce agent in sfagent-dev. Test 3 scenarios — a normal order question, an angry customer, and a customer threatening legal action. Tell me what works and what doesn't, then save the scenarios as a regression spec I can run in CI."
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.012
done
echo ""
sleep 0.7

FULL_PROMPT="Run a quick sanity check on my Agentforce agent in sfagent-dev. Test 3 scenarios — a normal order question, an angry customer, and a customer threatening legal action. Tell me what works and what doesn't, then save the scenarios as a regression spec I can run in CI.

Be efficient — find the agent, exercise it through one session with all 3 messages, generate the test spec from that session, then summarize findings in 3 short bullets. The org is sfagent-dev; use sfagent-tools for everything. Use 'sanity-check' as the suiteName."

# Codex exec already prints MCP tool calls cleanly — filter its banner + the
# echo of the prompt; colorize the MCP lines
codex exec --dangerously-bypass-approvals-and-sandbox "$FULL_PROMPT" 2>&1 \
  | grep -v -E '^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user$|codex$|Reading additional|Run a quick|Be efficient)' \
  | sed -E "s/^mcp: sfagent-tools\/(.*)/$(printf '\033[36m')⏺$(printf '\033[0m') $(printf '\033[1m')\1$(printf '\033[0m')/"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1mSame ask. Different AI. Same agent, same answer.\033[0m\n'
printf '\033[2mInstall:\033[0m  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n'
sleep 2.5
