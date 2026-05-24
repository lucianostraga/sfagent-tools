#!/bin/bash
# Codex demo — runs a real codex exec session against the same sfagent-tools
# MCP server. Banner matches the actual Codex CLI startup format.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Real Codex CLI startup banner (rounded box, exactly matches `codex` boot)
printf '╭──────────────────────────────────────────────────────────────────────────╮\n'
printf '│  \033[1m>_  OpenAI Codex\033[22m  \033[38;2;153;153;153m(v0.133.0)\033[0m                                       │\n'
printf '│                                                                          │\n'
printf '│  \033[38;2;153;153;153mmodel:\033[0m     \033[1mgpt-5.5 xhigh\033[22m    \033[38;2;100;180;240m/model\033[0m \033[38;2;153;153;153mto change\033[0m                  │\n'
printf '│  \033[38;2;153;153;153mdirectory:\033[0m ~/Documents/workspace/agentforce-claude                │\n'
printf '╰──────────────────────────────────────────────────────────────────────────╯\n'
sleep 1.4

# Type the prompt
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

# Codex exec already prints MCP tool calls cleanly — filter out its own banner
# (we already painted ours), and colorize the MCP lines
codex exec --dangerously-bypass-approvals-and-sandbox "$PROMPT" 2>&1 \
  | grep -v -E '^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user$|codex$|Reading additional|Walk me through|DISCOVERY|LIVE TESTING|REGRESSION|DIAGNOSTICS|^[0-9]+\)|^Keep it tight)' \
  | sed -E "s/^mcp: sfagent-tools\/(.*)/$(printf '\033[36m')⏺$(printf '\033[0m') $(printf '\033[1m')\1$(printf '\033[0m')/"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1m12 MCP tools. Same plugin. Different AI. Same agent.\033[0m\n'
printf '\033[2mInstall:\033[0m  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n'
sleep 2.5
