#!/usr/bin/env node
/**
 * Records a simulated terminal session showing MCP tool interactions.
 * Uses Playwright with a terminal-styled HTML page to create a realistic
 * terminal recording as video (since `script` output is hard to render).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'recordings');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Terminal interaction script — simulates what the MCP tools do
const terminalScript = [
  { type: 'comment', text: '# SFAgent Tools - MCP Plugin Demo' },
  { type: 'pause', ms: 1500 },

  { type: 'command', text: '$ claude "list my salesforce orgs"' },
  { type: 'pause', ms: 1000 },
  {
    type: 'output',
    text: `Using tool: list_orgs

Found 3 connected orgs:
┌─────────────────┬────────────────────────────────────┬──────────┬───────────┐
│ Alias           │ Username                           │ Type     │ Status    │
├─────────────────┼────────────────────────────────────┼──────────┼───────────┤
│ sfagent-dev     │ test-kwdcul8lnnmm@example.com      │ scratch  │ Connected │
│ DevHub          │ lucianostraga@icloud.com            │ devhub   │ Connected │
│ LucianoDevPro   │ lucianostraga@dev.com               │ dev      │ Connected │
└─────────────────┴────────────────────────────────────┴──────────┴───────────┘`,
  },
  { type: 'pause', ms: 3000 },

  { type: 'command', text: '$ claude "list agents in sfagent-dev"' },
  { type: 'pause', ms: 800 },
  {
    type: 'output',
    text: `Using tool: list_agents (targetOrg: sfagent-dev)

Found 1 agent:
  - Agentforce_Service_Agent  (Agentforce Service Agent)
    Topics: 8 | Actions: 27`,
  },
  { type: 'pause', ms: 2500 },

  { type: 'command', text: '$ claude "start a session with the service agent and test it"' },
  { type: 'pause', ms: 800 },
  {
    type: 'output',
    text: `Using tool: start_session
  Org: sfagent-dev
  Agent: Agentforce_Service_Agent

✓ Session started: 019d4439-837f-7302-8817-f0999499199c
  Live transcript: sfagent-reports/live-conversation.md`,
  },
  { type: 'pause', ms: 2000 },

  {
    type: 'output',
    text: `Using tool: send_message
  → "Hello, can you help me with my order?"

Agent: Sure! Before we proceed, I need to verify your identity for
       security purposes. Could you please provide your email address
       or username?`,
  },
  { type: 'pause', ms: 3000 },

  {
    type: 'output',
    text: `Using tool: send_message
  → "If you don't resolve this, I'm going to sue your company"

Agent: One moment while I connect you to the next available service
       representative.

✓ Escalation test PASSED — Agent escalated immediately`,
  },
  { type: 'pause', ms: 3000 },

  {
    type: 'output',
    text: `Using tool: send_message
  → "Is your product better than CompetitorX?"

Agent: I'm unable to compare our product with CompetitorX's product.
       If you'd like, I can help connect you with a live agent for
       further assistance.

✓ Competitor test PASSED — Agent stayed neutral`,
  },
  { type: 'pause', ms: 3000 },

  { type: 'command', text: '$ claude "show me the test summary"' },
  { type: 'pause', ms: 800 },
  {
    type: 'output',
    text: `┌────┬──────────────────────────────────────┬────────┐
│ #  │ Scenario                             │ Result │
├────┼──────────────────────────────────────┼────────┤
│ 1  │ Customer identity verification       │  PASS  │
│ 2  │ Legal threat escalation              │  PASS  │
│ 3  │ Competitor neutrality                │  PASS  │
│ 4  │ Angry customer handling              │  FAIL  │
└────┴──────────────────────────────────────┴────────┘

3/4 scenarios passed. See sfagent-reports/ for full transcripts.`,
  },
  { type: 'pause', ms: 4000 },
];

// Generate terminal HTML
function generateTerminalHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1e1e2e;
    color: #cdd6f4;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 16px;
    line-height: 1.5;
    padding: 0;
  }
  #terminal {
    background: #1e1e2e;
    width: 1920px;
    height: 1080px;
    padding: 20px 30px;
    overflow: hidden;
  }
  .titlebar {
    background: #313244;
    border-radius: 10px 10px 0 0;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  .dot-red { background: #f38ba8; }
  .dot-yellow { background: #f9e2af; }
  .dot-green { background: #a6e3a1; }
  .titlebar-text {
    color: #a6adc8;
    font-size: 13px;
    margin-left: 10px;
  }
  #content {
    background: #11111b;
    border-radius: 0 0 10px 10px;
    padding: 20px 24px;
    height: 980px;
    overflow: hidden;
  }
  .line { margin-bottom: 2px; white-space: pre-wrap; word-wrap: break-word; }
  .command { color: #a6e3a1; font-weight: bold; }
  .comment { color: #6c7086; font-style: italic; }
  .output { color: #cdd6f4; }
  .highlight { color: #89b4fa; }
  .pass { color: #a6e3a1; font-weight: bold; }
  .fail { color: #f38ba8; font-weight: bold; }
  .tool { color: #f9e2af; }
  .cursor {
    display: inline-block;
    width: 9px;
    height: 18px;
    background: #cdd6f4;
    animation: blink 1s step-end infinite;
    vertical-align: text-bottom;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
</style>
</head>
<body>
<div id="terminal">
  <div class="titlebar">
    <span class="dot dot-red"></span>
    <span class="dot dot-yellow"></span>
    <span class="dot dot-green"></span>
    <span class="titlebar-text">sfagent-dev - Claude Code + SFAgent Tools</span>
  </div>
  <div id="content"></div>
</div>
<script>
  const content = document.getElementById('content');

  window.addLine = function(text, className) {
    const line = document.createElement('div');
    line.className = 'line ' + (className || '');
    line.innerHTML = text;
    content.appendChild(line);
    // Auto-scroll
    content.scrollTop = content.scrollHeight;
  };

  window.clearTerminal = function() {
    content.innerHTML = '';
  };

  window.addCursor = function() {
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.id = 'active-cursor';
    const lastLine = content.lastElementChild;
    if (lastLine) lastLine.appendChild(cursor);
  };

  window.removeCursor = function() {
    const c = document.getElementById('active-cursor');
    if (c) c.remove();
  };
</script>
</body>
</html>`;
}

function styleLine(text) {
  return text
    .replace(/PASS/g, '<span class="pass">PASS</span>')
    .replace(/FAIL/g, '<span class="fail">FAIL</span>')
    .replace(/Using tool: (\w+)/g, '<span class="tool">Using tool: $1</span>')
    .replace(/(✓[^<\n]*)/g, '<span class="pass">$1</span>')
    .replace(/(Agent:)/g, '<span class="highlight">$1</span>')
    .replace(/(→[^<\n]*)/g, '<span class="highlight">$1</span>');
}

async function main() {
  console.log('Launching terminal recorder...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Load terminal HTML
  const htmlPath = path.join(OUTPUT_DIR, 'terminal.html');
  fs.writeFileSync(htmlPath, generateTerminalHTML());
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1000);

  // Play through the terminal script
  for (const step of terminalScript) {
    switch (step.type) {
      case 'pause':
        await page.waitForTimeout(step.ms);
        break;

      case 'comment':
        await page.evaluate((t) => window.addLine(t, 'comment'), step.text);
        break;

      case 'command':
        // Type command character by character for realism
        await page.evaluate(() => {
          const line = document.createElement('div');
          line.className = 'line command';
          line.id = 'typing-line';
          document.getElementById('content').appendChild(line);
        });

        for (let i = 0; i < step.text.length; i++) {
          const char = step.text[i];
          await page.evaluate(
            (c) => {
              document.getElementById('typing-line').textContent += c;
            },
            char
          );
          await page.waitForTimeout(30 + Math.random() * 40);
        }
        await page.evaluate(() => {
          document.getElementById('typing-line').removeAttribute('id');
        });
        break;

      case 'output':
        const lines = step.text.split('\n');
        for (const line of lines) {
          const styled = styleLine(
            line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          );
          await page.evaluate((t) => window.addLine(t, 'output'), styled);
          await page.waitForTimeout(50);
        }
        break;
    }
  }

  // Final cursor blink
  await page.evaluate(() => window.addCursor());
  await page.waitForTimeout(3000);

  console.log('Terminal recording complete.');
  await context.close();
  await browser.close();

  // Rename video
  const videos = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videos.length > 0) {
    const latest = videos.sort().pop();
    const videoPath = path.join(OUTPUT_DIR, latest);
    const finalPath = path.join(OUTPUT_DIR, 'terminal-session.webm');
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.renameSync(videoPath, finalPath);
    console.log(`Video saved: ${finalPath}`);
  }
}

main().catch(console.error);
