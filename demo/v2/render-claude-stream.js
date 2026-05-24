#!/usr/bin/env node
// Reads claude --print --output-format stream-json from stdin and renders
// it in the SAME format as Claude Code's real interactive TUI:
//   ⏺ <ai narration text>
//
//     Called sfagent-tools (ctrl+o to expand)
//
//   ⏺ <next narration text>
//   ...
//
// Tool inputs/outputs are deliberately COLLAPSED (just like the real TUI)
// so viewers see the flow without drowning in JSON.

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[38;2;215;119;87m',  // Claude pink for ⏺
  gray: '\x1b[38;2;136;136;136m',
  text: '\x1b[37m',
};

let buffer = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) handleLine(line);
});
process.stdin.on('end', () => {
  if (buffer) handleLine(buffer);
});

// Group consecutive tool calls so we can emit "Called sfagent-tools 2 times"
let pendingToolCalls = 0;
function flushPendingTools() {
  if (pendingToolCalls === 0) return;
  const suffix = pendingToolCalls === 1 ? '' : ` ${pendingToolCalls} times`;
  process.stdout.write(`  ${C.gray}Called sfagent-tools${suffix} (ctrl+o to expand)${C.reset}\n\n`);
  pendingToolCalls = 0;
}

function handleLine(line) {
  if (!line.trim()) return;
  let evt;
  try {
    evt = JSON.parse(line);
  } catch {
    return;
  }

  if (evt.type === 'assistant' && evt.message?.content) {
    for (const block of evt.message.content) {
      if (block.type === 'tool_use') {
        // Only count sfagent-tools calls. Skip internal tools like ToolSearch.
        if (block.name?.startsWith('mcp__sfagent-tools__')) {
          pendingToolCalls++;
        }
      } else if (block.type === 'text' && block.text?.trim()) {
        // Flush any pending tool calls before showing new text
        flushPendingTools();
        // AI narration starts with ⏺
        const text = block.text.trim();
        process.stdout.write(`${C.cyan}⏺${C.reset} ${text}\n\n`);
      }
    }
  }
  // tool_result events are skipped — we just collapse them like the real TUI
}

process.on('exit', flushPendingTools);
