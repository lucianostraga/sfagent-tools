#!/bin/bash
# Claude Code demo — runs a real claude --print session against the real
# sfagent-tools MCP server. The user prompt is what a Salesforce dev would
# actually type; the AI naturally orchestrates the tools to answer it.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")/.."

clear
sleep 0.5

# Clean Claude Code banner
printf '\033[38;2;215;119;87m✳\033[0m  \033[1mClaude Code\033[22m  \033[38;2;153;153;153m(v2.1.150)\033[0m\n'
printf '\n'
printf '   \033[38;2;153;153;153mmodel:\033[0m     \033[1mclaude-opus-4-7\033[22m  \033[38;2;153;153;153m(1M context)\033[0m\n'
printf '   \033[38;2;153;153;153mdirectory:\033[0m ~/Documents/workspace/agentforce-claude\n'
printf '\n'
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
sleep 1.4

# Type the prompt — what a real dev would actually type
printf '❯ '
PROMPT="Run a quick sanity check on my Agentforce agent in sfagent-dev. Test 3 scenarios — a normal order question, an angry customer, and a customer threatening legal action. Tell me what works and what doesn't, then save the scenarios as a regression spec I can run in CI."
for (( i=0; i<${#PROMPT}; i++ )); do
  printf "%s" "${PROMPT:$i:1}"
  sleep 0.012
done
echo ""
sleep 0.7

# The actual full prompt to Claude (a bit more explicit so the AI does it tightly)
FULL_PROMPT="Run a quick sanity check on my Agentforce agent in sfagent-dev. Test 3 scenarios — a normal order question, an angry customer, and a customer threatening legal action. Tell me what works and what doesn't, then save the scenarios as a regression spec I can run in CI.

Be efficient — find the agent, exercise it through one session with all 3 messages, generate the test spec from that session, then summarize findings in 3 short bullets. The org is sfagent-dev; use sfagent-tools for everything. Use 'sanity-check' as the suiteName."

# Run Claude and pipe through the stream renderer
claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions "$FULL_PROMPT" \
  | node "$SCRIPT_DIR/render-claude-stream.js"

echo ""
sleep 1
printf '\033[38;2;136;136;136m────────────────────────────────────────────────────────────────────────────\033[0m\n'
printf '\033[1mAsk it like a teammate. It tests like a teammate.\033[0m\n'
printf '\033[2mInstall:\033[0m  claude plugin install sfagent-tools@sfagent-tools-marketplace\n'
sleep 2.5
