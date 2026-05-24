#!/usr/bin/env node
// Render ONE per-tool mini-clip from a pre-captured claude --print stream-json file.
// Reads stdin (the stream-json), writes a paced visual to stdout.
// Designed for clips that show a SINGLE tool call: collapse the call, show the
// final answer briefly, total ~8-10 seconds.

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  pink: '\x1b[38;2;215;119;87m',
  gray: '\x1b[38;2;136;136;136m',
};

const PAUSE_AFTER_TEXT_MS = 2200;  // longer pause so reader can finish reading
const PAUSE_AFTER_TOOLS_MS = 1300;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const events = raw.split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);

  let pendingTools = 0;
  async function flushTools() {
    if (pendingTools === 0) return;
    const suffix = pendingTools === 1 ? '' : ` ${pendingTools} times`;
    process.stdout.write(`  ${C.gray}⎿ Called ${C.bold}sfagent-tools${C.reset}${C.gray}${suffix} (ctrl+o to expand)${C.reset}\n\n`);
    pendingTools = 0;
    await sleep(PAUSE_AFTER_TOOLS_MS);
  }

  for (const evt of events) {
    if (evt.type === 'assistant' && evt.message?.content) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_use' && block.name?.startsWith('mcp__sfagent-tools__')) {
          pendingTools++;
        } else if (block.type === 'text' && block.text?.trim()) {
          await flushTools();
          process.stdout.write(`${C.pink}⏺${C.reset} ${block.text.trim()}\n\n`);
          await sleep(PAUSE_AFTER_TEXT_MS);
        }
      }
    }
  }
  await flushTools();
}

main().catch(console.error);
