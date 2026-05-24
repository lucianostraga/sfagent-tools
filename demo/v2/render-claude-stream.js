#!/usr/bin/env node
// Reads claude --print --output-format stream-json from stdin and renders
// output that matches the real Claude Code interactive TUI format:
//   ⏺ <ai narration text>
//
//     Called sfagent-tools - <tool_name>
//     Called sfagent-tools - <tool_name>
//     ...
//
//   ⏺ <next narration text>
//
// Each tool call is shown individually (not collapsed to "N times") so the
// viewer can SEE the flow of actions. A small delay between events makes
// the video human-readable instead of flashing past.

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  pink: '\x1b[38;2;215;119;87m',  // Claude brand pink
  gray: '\x1b[38;2;136;136;136m',
};

// Paces — keep the demo human-readable
const DELAY_TOOL_MS = 350;     // between consecutive tool calls
const DELAY_TEXT_MS = 1300;    // after a text block (so viewer can read)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processEvents() {
  let buffer = '';
  const queue = [];
  let inputDone = false;

  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        queue.push(JSON.parse(line));
      } catch {}
    }
  });
  process.stdin.on('end', () => {
    if (buffer.trim()) {
      try { queue.push(JSON.parse(buffer)); } catch {}
    }
    inputDone = true;
  });

  // Pull events off the queue with paced output
  while (!inputDone || queue.length > 0) {
    if (queue.length === 0) {
      await sleep(30);
      continue;
    }
    const evt = queue.shift();
    if (evt.type === 'assistant' && evt.message?.content) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_use' && block.name?.startsWith('mcp__sfagent-tools__')) {
          const toolName = block.name.replace('mcp__sfagent-tools__', '');
          process.stdout.write(`  ${C.gray}⎿ Called ${C.reset}${C.bold}sfagent-tools${C.reset}${C.gray} - ${toolName}${C.reset}\n`);
          await sleep(DELAY_TOOL_MS);
        } else if (block.type === 'text' && block.text?.trim()) {
          const text = block.text.trim();
          process.stdout.write(`\n${C.pink}⏺${C.reset} ${text}\n\n`);
          await sleep(DELAY_TEXT_MS);
        }
      }
    }
  }
}

processEvents().catch((err) => {
  console.error('Renderer error:', err);
  process.exit(1);
});
