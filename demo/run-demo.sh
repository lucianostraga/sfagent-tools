#!/bin/bash
# Master script to generate the full SFAgent Tools demo video.
# Usage: cd demo && ./run-demo.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║   SFAgent Tools — Demo Video Generator       ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  1. Generate narration audio (Neural TTS)    ║"
echo "║  2. Record synced video (Playwright)         ║"
echo "║  3. Assemble final video (ffmpeg)            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check dependencies
echo "Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo "✗ Node.js required"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "✗ ffmpeg required (brew install ffmpeg)"; exit 1; }
[ -f ".venv/bin/python3" ] || { echo "✗ Python venv with edge-tts required"; exit 1; }
echo "✓ All dependencies found"
echo ""

# Step 1: Narration
echo "━━━ Step 1/3: Generating narration audio ━━━"
node narration.js
echo ""

# Step 2: Synced recording
echo "━━━ Step 2/3: Recording synced video ━━━"
echo "  (Browser windows will open — do not interact with them)"
node record-synced.js
echo ""

# Step 3: Assembly
echo "━━━ Step 3/3: Assembling final video ━━━"
bash assemble-video.sh
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║   ✓ Demo video generation complete!          ║"
echo "║   Output: demo/sfagent-tools-demo.mp4        ║"
echo "╚══════════════════════════════════════════════╝"
