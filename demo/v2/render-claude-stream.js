#!/usr/bin/env node
// Reads claude --print --output-format stream-json from stdin and renders
// a clean terminal display showing tool calls and the final response.
// This gives the demo viewer the same "you can see Claude calling tools"
// experience as the interactive UI, but in a recordable non-interactive flow.

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
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

function shortenJson(obj, maxLen = 200) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + C.dim + '\n  ...(truncated)' + C.reset;
}

let firstTool = true;
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
      if (block.type === 'tool_use' && block.name?.startsWith('mcp__sfagent-tools__')) {
        const toolName = block.name.replace('mcp__sfagent-tools__', '');
        if (firstTool) {
          process.stdout.write('\n');
          firstTool = false;
        }
        process.stdout.write(
          `${C.cyan}⏺${C.reset} ${C.bold}${toolName}${C.reset}${C.gray}(${JSON.stringify(block.input)})${C.reset}\n`
        );
      } else if (block.type === 'text' && block.text?.trim()) {
        process.stdout.write(`\n${C.green}${block.text.trim()}${C.reset}\n`);
      }
    }
  } else if (evt.type === 'user' && evt.message?.content) {
    for (const block of evt.message.content) {
      if (block.type === 'tool_result' && Array.isArray(block.content)) {
        for (const r of block.content) {
          if (r.type === 'text' && r.text) {
            const preview = shortenJson(r.text, 400);
            process.stdout.write(`${C.dim}  ⤷ ${preview.split('\n').join('\n  ')}${C.reset}\n`);
          }
        }
      }
    }
  }
}
