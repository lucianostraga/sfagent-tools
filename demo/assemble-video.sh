#!/bin/bash
# Simple assembly: one synced video + one audio track = final mp4.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RECORDINGS="$SCRIPT_DIR/recordings"
AUDIO_DIR="$SCRIPT_DIR/audio"
OUTPUT="$SCRIPT_DIR/sfagent-tools-demo.mp4"

echo "=== Assembling Demo Video ==="

# 1. Combine audio segments
echo "Combining audio..."
node -e "
  const { execSync } = require('child_process');
  const m = require('$AUDIO_DIR/manifest.json');
  for (const s of m) {
    const w = s.file.replace('.mp3', '.wav');
    execSync('ffmpeg -y -i \"' + s.file + '\" -ar 24000 -ac 1 \"' + w + '\" -loglevel error');
  }
"
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.5 "$AUDIO_DIR/silence-05.wav" -loglevel error
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.8 "$AUDIO_DIR/silence-08.wav" -loglevel error
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 1.5 "$AUDIO_DIR/silence-15.wav" -loglevel error

node -e "
  const m = require('$AUDIO_DIR/manifest.json');
  let l = '';
  for (const s of m) {
    l += \"file '\" + s.file.replace('.mp3', '.wav') + \"'\n\";
    const p = s.pauseAfter;
    if (p <= 0.5) l += \"file '$AUDIO_DIR/silence-05.wav'\n\";
    else if (p <= 0.8) l += \"file '$AUDIO_DIR/silence-08.wav'\n\";
    else l += \"file '$AUDIO_DIR/silence-15.wav'\n\";
  }
  process.stdout.write(l);
" > "$AUDIO_DIR/audio-list.txt"

ffmpeg -y -f concat -safe 0 -i "$AUDIO_DIR/audio-list.txt" -c:a aac -b:a 192k "$AUDIO_DIR/narration.m4a" -loglevel error
A=$(ffprobe -i "$AUDIO_DIR/narration.m4a" -show_entries format=duration -v quiet -of csv="p=0")
echo "  Audio: ${A}s"

# 2. Normalize video
echo "Normalizing video..."
ffmpeg -y -i "$RECORDINGS/synced-video.webm" \
  -vf "scale=1920:1080,fps=30" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -an \
  "$RECORDINGS/video.mp4" -loglevel error
V=$(ffprobe -i "$RECORDINGS/video.mp4" -show_entries format=duration -v quiet -of csv="p=0")
echo "  Video: ${V}s"

# 3. Mux
echo "Muxing..."
ffmpeg -y -i "$RECORDINGS/video.mp4" -i "$AUDIO_DIR/narration.m4a" \
  -c:v copy -c:a aac -shortest "$OUTPUT" -loglevel error

D=$(ffprobe -i "$OUTPUT" -show_entries format=duration -v quiet -of csv="p=0")
echo ""
echo "=== Done: $OUTPUT (${D}s) ==="
ls -lh "$OUTPUT"
