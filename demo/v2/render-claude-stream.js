#!/usr/bin/env node
// Matches the real Claude Code TUI format:
//   ⏺ <narration>
//
//     Called sfagent-tools N times (ctrl+o to expand)
//
//   ⏺ <final answer>
// Collapsed, compact, readable.

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  pink: '\x1b[38;2;215;119;87m',
  gray: '\x1b[38;2;136;136;136m',
};

const PAUSE_AFTER_TEXT_MS = 1800;

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
      try { queue.push(JSON.parse(line)); } catch {}
    }
  });
  process.stdin.on('end', () => {
    if (buffer.trim()) { try { queue.push(JSON.parse(buffer)); } catch {} }
    inputDone = true;
  });

  let pendingToolCalls = 0;

  async function flushPendingTools() {
    if (pendingToolCalls === 0) return;
    const suffix = pendingToolCalls === 1 ? '' : ` ${pendingToolCalls} times`;
    process.stdout.write(`  ${C.gray}⎿ Called ${C.bold}sfagent-tools${C.reset}${C.gray}${suffix} (ctrl+o to expand)${C.reset}\n\n`);
    pendingToolCalls = 0;
    await sleep(1100);
  }

  while (!inputDone || queue.length > 0) {
    if (queue.length === 0) { await sleep(30); continue; }
    const evt = queue.shift();
    if (evt.type === 'assistant' && evt.message?.content) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_use' && block.name?.startsWith('mcp__sfagent-tools__')) {
          pendingToolCalls++;
        } else if (block.type === 'text' && block.text?.trim()) {
          await flushPendingTools();
          const text = block.text.trim();
          process.stdout.write(`${C.pink}⏺${C.reset} ${text}\n\n`);
          await sleep(PAUSE_AFTER_TEXT_MS);
        }
      }
    }
  }
  await flushPendingTools();
}

processEvents().catch(console.error);
