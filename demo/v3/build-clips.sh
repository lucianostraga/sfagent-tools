#!/bin/bash
# Batch-build all per-tool mini-clips.
# For each tool:
#   1. Capture real claude --print stream-json against a focused prompt
#   2. Record the paced replay with asciinema
#   3. Render to GIF + MP4
#   4. Copy to demo/clips/ for the README
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$ROOT_DIR"

CAPTURES="$SCRIPT_DIR/captures"
CLIPS="$SCRIPT_DIR/clips"
OUTPUT="$ROOT_DIR/demo/clips"
mkdir -p "$CAPTURES" "$CLIPS" "$OUTPUT"

# Tool name | displayed prompt (what user types) | full AI instruction
build_clip() {
  local tool="$1"
  local typed="$2"
  local instruction="$3"

  local capture_file="$CAPTURES/${tool}.jsonl"
  local cast_file="$CLIPS/${tool}.cast"
  local gif_file="$CLIPS/${tool}.gif"
  local mp4_file="$CLIPS/${tool}.mp4"

  echo "── [$tool] capturing real Claude output…"
  if [ ! -s "$capture_file" ]; then
    claude --print --verbose --output-format stream-json --allow-dangerously-skip-permissions \
      "$instruction" > "$capture_file" 2>&1
  else
    echo "   (using existing capture)"
  fi
  echo "   captured $(wc -l < "$capture_file") lines"

  echo "── [$tool] recording asciinema clip…"
  asciinema rec --overwrite --cols 100 --rows 18 \
    --command "$SCRIPT_DIR/clip-play.sh $capture_file '$typed'" \
    "$cast_file" 2>&1 | tail -1

  echo "── [$tool] rendering to GIF + MP4…"
  agg "$cast_file" "$gif_file" 2>&1 | tail -1
  ffmpeg -y -i "$gif_file" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "$mp4_file" 2>&1 | tail -1

  cp "$gif_file" "$OUTPUT/sfagent-${tool}.gif"
  cp "$mp4_file" "$OUTPUT/sfagent-${tool}.mp4"
  local size=$(stat -f%z "$OUTPUT/sfagent-${tool}.gif" 2>/dev/null || stat -c%s "$OUTPUT/sfagent-${tool}.gif")
  echo "   ✓ $OUTPUT/sfagent-${tool}.gif (${size} bytes)"
  echo ""
}

CONCISE="Be very concise — this is a single-tool demo. Just one short narration line, then run the tool, then one short summary line. Don't repeat the prompt or explain too much."

# 1. list_orgs
build_clip "list_orgs" \
  "list my salesforce orgs" \
  "Use sfagent-tools to list my Salesforce orgs. Show me ONLY the sfagent-dev scratch org info as a one-line summary. $CONCISE"

# 2. list_agents
build_clip "list_agents" \
  "what agents are in sfagent-dev?" \
  "Use sfagent-tools to list the Agentforce agents in sfagent-dev. Show me just the agent's name and API name. $CONCISE"

# 3. get_agent_metadata
build_clip "get_agent_metadata" \
  "what subagents does Agentforce_Service_Agent have?" \
  "Use sfagent-tools to fetch metadata for Agentforce_Service_Agent in sfagent-dev. Show me ONLY the subagent count and the names of the 8 subagents (no actions, no descriptions). $CONCISE"

# 4. load_config
build_clip "load_config" \
  "load my sfagent-config.yaml" \
  "Use sfagent-tools to load my sfagent-config.yaml. Show me ONLY the agent name, target org, and counts (topic expectations, global rules, custom scenarios). $CONCISE"

# 5. start_session
build_clip "start_session" \
  "start a test session with the agent" \
  "Use sfagent-tools start_session to open a session with Agentforce_Service_Agent in sfagent-dev. Show me ONLY the sessionId returned. $CONCISE"

# 6. send_message
build_clip "send_message" \
  "ask the agent if it can help with my order" \
  "Use sfagent-tools: start a session with Agentforce_Service_Agent in sfagent-dev, send 'Can you help me with my order?', then end the session. Show me ONLY the agent's reply text. $CONCISE"

# 7. end_session
build_clip "end_session" \
  "end the session and show transcript" \
  "Use sfagent-tools: start a session with Agentforce_Service_Agent in sfagent-dev, send 'hi', then end_session. Show me ONLY the total message count and a one-line confirmation that the session was ended. $CONCISE"

# 8. generate_test_spec
build_clip "generate_test_spec" \
  "save this conversation as a regression spec" \
  "Use sfagent-tools: start a session with Agentforce_Service_Agent in sfagent-dev, send 'Can you help me with my order?', then call generate_test_spec with suiteName 'order-help' before ending the session. Show me ONLY the output path of the spec and the case count. $CONCISE"

# 9. list_traces
build_clip "list_traces" \
  "show me trace files for the agent" \
  "Use sfagent-tools list_traces to show traces for Agentforce_Service_Agent. Show me ONLY the count of trace files found and the most recent session ID. $CONCISE"

# 10. read_trace
build_clip "read_trace" \
  "read the trace for the latest session" \
  "Use sfagent-tools: call list_traces for Agentforce_Service_Agent to find the most recent session, then call read_trace on it. Show me ONLY a one-line summary of what the trace contains (or notes if empty). $CONCISE"

echo "✓ All clips built. See $OUTPUT/"
ls -lh "$OUTPUT"
