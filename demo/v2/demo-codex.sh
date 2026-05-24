#!/bin/bash
# Codex demo — REPLAYS pre-captured Codex output with controlled pacing
# so the resulting video lets viewers read at human pace.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.4

RESET='\033[0m'
DIM='\033[38;2;136;136;136m'
BOLD='\033[1m'
BLUE='\033[38;2;100;180;240m'

# Real Codex CLI banner
printf '╭──────────────────────────────────────────────────────────────────────────╮\n'
printf "│  ${BOLD}>_  OpenAI Codex${RESET}  ${DIM}(v0.133.0)${RESET}                                       │\n"
printf '│                                                                          │\n'
printf "│  ${DIM}model:${RESET}     ${BOLD}gpt-5.5 xhigh${RESET}    ${BLUE}/model${RESET} ${DIM}to change${RESET}                  │\n"
printf "│  ${DIM}directory:${RESET} ~/Documents/workspace/agentforce-claude                │\n"
printf '╰──────────────────────────────────────────────────────────────────────────╯\n'
echo ""
sleep 1.6

printf '❯ '
PROMPT="test the agent in sfagent-dev — quick smoke test, real conversation"
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.025
done
echo ""
echo ""
sleep 0.9

# Replay pre-captured Codex output with controlled pacing
cat "$SCRIPT_DIR/captured/codex-output.txt" | python3 -c "
import sys, re, time
GREEN = '\\033[38;2;16;163;127m'
GRAY = '\\033[38;2;136;136;136m'
BOLD = '\\033[1m'
RESET = '\\033[0m'

SKIP = re.compile(r'^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user\$|codex\$|Reading additional|Run a quick|Be concise|Use exactly|^\\s*\$)')

prev_was_text = False
for line in sys.stdin:
    s = line.rstrip()
    # Skip metadata
    if SKIP.match(s):
        continue
    # MCP tool call completion → render as collapsed individual line + pause
    m = re.match(r'^mcp: sfagent-tools/(\\S+)\\s+\\((completed)\\)', s)
    if m:
        tool = m.group(1)
        sys.stdout.write(f'  {GRAY}⎿ Called {RESET}{BOLD}sfagent-tools{RESET}{GRAY} - {tool}{RESET}\\n')
        sys.stdout.flush()
        time.sleep(0.45)
        prev_was_text = False
        continue
    # Skip 'started' MCP events (we use 'completed')
    if s.startswith('mcp: sfagent-tools/'):
        continue
    # Plain text — print with a pause so viewer can read
    print(s)
    sys.stdout.flush()
    # Long text = longer pause
    pause = 1.4 if len(s) > 50 else 0.5
    time.sleep(pause)
"

sleep 1.2
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}Same one sentence. Same real test. Same regression spec.${RESET}\n"
printf "${DIM}Install:${RESET}  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n"
sleep 2.5
