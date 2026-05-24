#!/bin/bash
# Play ONE per-tool mini-clip from a pre-captured stream-json file.
# Usage: clip-play.sh <captured-file> <typed-prompt>
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CAPTURED="$1"
PROMPT="$2"

clear
sleep 0.3

PINK='\033[38;2;215;119;87m'
RESET='\033[0m'
DIM='\033[38;2;136;136;136m'
BOLD='\033[1m'

# Real Claude Code banner
printf "${PINK} ▐▛███▜▌${RESET}   ${BOLD}Claude Code${RESET} ${DIM}v2.1.150${RESET}\n"
printf "${PINK}▝▜█████▛▘${RESET}  ${DIM}Opus 4.7 (1M context) · Claude Max${RESET}\n"
printf "${PINK}  ▘▘ ▝▝  ${RESET}  ${DIM}~/Documents/workspace/agentforce-claude${RESET}\n"
echo ""
sleep 0.9

# Type the user prompt
printf '❯ '
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.028
done
echo ""
echo ""
sleep 0.5

# Render the captured Claude output
cat "$CAPTURED" | node "$SCRIPT_DIR/clip-render.js"

sleep 1.2
