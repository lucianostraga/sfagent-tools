#!/bin/bash
# Codex demo — runs a real codex exec session, matches real Codex startup,
# paces the collapsed tool-call lines so they're readable.
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

# Pipe codex output through a small filter that:
# - drops Codex's own banner (we already painted ours)
# - shows each MCP tool call individually as it COMPLETES, with a pause
#   between calls so the viewer can read each one
codex exec --dangerously-bypass-approvals-and-sandbox "$FULL_PROMPT" 2>&1 | python3 -c "
import sys, re, time
GREEN = '\\033[38;2;16;163;127m'
GRAY = '\\033[38;2;136;136;136m'
BOLD = '\\033[1m'
RESET = '\\033[0m'
SKIP = re.compile(r'^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user\$|codex\$|Reading additional|Run a quick|Be concise|Use exactly|And in ONE)')
for line in sys.stdin:
    s = line.rstrip()
    if SKIP.match(s):
        continue
    m = re.match(r'^mcp: sfagent-tools/(\\S+)\\s+\\((completed)\\)', s)
    if m:
        tool = m.group(1)
        sys.stdout.write(f'  {GRAY}⎿ Called {RESET}{BOLD}sfagent-tools{RESET}{GRAY} - {tool}{RESET}\\n')
        sys.stdout.flush()
        time.sleep(0.4)
        continue
    if s.startswith('mcp: sfagent-tools/'):
        # 'started' lines — skip, we wait for 'completed'
        continue
    print(s)
    sys.stdout.flush()
"

sleep 1
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}Same one sentence. Same real test. Same regression spec.${RESET}\n"
printf "${DIM}Install:${RESET}  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n"
sleep 2.5
