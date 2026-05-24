#!/bin/bash
# Codex demo — replay captured output with the same collapsed style
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.4

RESET='\033[0m'
DIM='\033[38;2;136;136;136m'
BOLD='\033[1m'
BLUE='\033[38;2;100;180;240m'
GREEN='\033[38;2;16;163;127m'

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

# Replay captured Codex output with COLLAPSED tool calls (count them)
cat "$SCRIPT_DIR/captured/codex-output.txt" | python3 -c "
import sys, re, time
GREEN = '\\033[38;2;16;163;127m'
GRAY = '\\033[38;2;136;136;136m'
BOLD = '\\033[1m'
RESET = '\\033[0m'
PINK = '\\033[38;2;215;119;87m'

SKIP = re.compile(r'^(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning|session id:|tokens used|user\$|codex\$|Reading additional|Run a quick|Be concise|Use exactly|^\\s*\$)')

tool_count = 0

def flush_tools():
    global tool_count
    if tool_count == 0: return
    suffix = '' if tool_count == 1 else f' {tool_count} times'
    sys.stdout.write(f'  {GRAY}⎿ Called {BOLD}sfagent-tools{RESET}{GRAY}{suffix} (ctrl+o to expand){RESET}\\n\\n')
    sys.stdout.flush()
    time.sleep(1.1)
    tool_count = 0

for line in sys.stdin:
    s = line.rstrip()
    if SKIP.match(s):
        continue
    if re.match(r'^mcp: sfagent-tools/\\S+\\s+\\(completed\\)', s):
        tool_count += 1
        continue
    if s.startswith('mcp: sfagent-tools/'):
        continue
    # narration / final answer
    flush_tools()
    sys.stdout.write(f'{GREEN}⏺{RESET} {s}\\n\\n')
    sys.stdout.flush()
    time.sleep(1.8)

flush_tools()
"

sleep 1.2
printf "${DIM}────────────────────────────────────────────────────────────────────────────${RESET}\n"
printf "${BOLD}One sentence. Real conversation. Real findings. Ready for CI.${RESET}\n"
printf "${DIM}Install:${RESET}  codex mcp add sfagent-tools -- npx -y sfagent-tools-mcp-server@latest\n"
sleep 2.5
