#!/usr/bin/env node
/**
 * Single-page recording matching real Claude Code output format.
 * All tool responses use actual JSON from real MCP tool calls.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'recordings');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const manifest = require('./audio/manifest.json');

function segMs(id) {
  const s = manifest.find((m) => m.id === id);
  return Math.ceil((s.duration + s.pauseAfter) * 1000);
}

function esc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function style(text) {
  return esc(text)
    .replace(/(⏺)/g,'<span class="bullet">$1</span>')
    .replace(/(mcp__sfagent-tools__\w+)/g,'<span class="tool">$1</span>')
    .replace(/("sessionId"|"agentApiName"|"targetOrg"|"status"|"alias"|"username"|"type"|"apiName"|"label"|"userMessage"|"agentResponse"|"sequenceId"|"id"|"scenarioResult"|"totalMessages"|"message"|"liveTranscript"|"found"|"configPath"|"agent"|"summary")/g,'<span class="key">$1</span>')
    .replace(/: (".*?")/g,': <span class="str">$1</span>')
    .replace(/(active|Connected|true)/g,'<span class="pass">$1</span>')
    .replace(/(Expired|fail|false)/g,'<span class="fail">$1</span>')
    .replace(/(scratch|devhub|sandbox|production)/g,'<span class="type">$1</span>');
}

// SF mockup HTML generators
function sfAgentsListScene() {
  return `<div class="sf"><div class="sf-header">
    <div class="sf-logo"></div>
    <div style="font-size:18px;font-weight:700;color:#16325c">Setup</div>
    <div class="sf-nav"><span class="active">Home</span><span>Object Manager</span></div>
    <div style="flex:1"></div>
    <div style="color:#999;font-size:13px">Scratch Org</div>
  </div><div class="sf-body"><div class="sf-sidebar">
    <div>Setup Home</div><div>Salesforce Go</div><div>Service Setup Assistant</div>
    <div style="margin-top:16px;font-size:11px;color:#999;font-weight:600">PLATFORM TOOLS</div>
    <div>Apps</div><div>Feature Settings</div>
    <div style="margin-top:8px;font-size:11px;color:#999;font-weight:600">EINSTEIN</div>
    <div>Agentforce Data Library</div>
    <div>Einstein Generative AI</div>
    <div style="padding-left:16px">Agentforce Studio</div>
    <div style="padding-left:24px" class="active">Agentforce Agents</div>
  </div><div class="sf-main">
    <div class="sf-breadcrumb">SETUP &gt; AGENTFORCE STUDIO</div>
    <div class="sf-title">
      <div class="sf-title-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
      Agentforce Agents
      <span class="sf-badge">Agentforce ON</span>
      <div style="flex:1"></div>
      <button class="sf-btn">+ New Agent</button>
    </div>
    <table class="sf-table"><thead><tr>
      <th>Agent Name</th><th>Type</th><th>Description</th><th>Created By</th><th>Active</th><th>Last Modified</th>
    </tr></thead><tbody><tr>
      <td><a>Agentforce Service Agent</a></td>
      <td>Service Agent</td>
      <td>Deliver personalized customer interactions with ...</td>
      <td>User User</td>
      <td><span class="sf-check">✓</span></td>
      <td>28 de mar de 2026</td>
    </tr></tbody></table>
  </div></div></div>`;
}

function sfAgentDetailScene() {
  return `<div class="sf"><div class="sf-header">
    <div class="sf-logo"></div>
    <div style="font-size:18px;font-weight:700;color:#16325c">Setup</div>
    <div class="sf-nav"><span class="active">Home</span><span>Object Manager</span></div>
    <div style="flex:1"></div>
    <div style="color:#999;font-size:13px">Scratch Org</div>
  </div><div class="sf-body"><div class="sf-sidebar">
    <div>Setup Home</div><div>Salesforce Go</div>
    <div style="margin-top:16px;font-size:11px;color:#999;font-weight:600">PLATFORM TOOLS</div>
    <div>Apps</div><div>Feature Settings</div>
    <div style="margin-top:8px;font-size:11px;color:#999;font-weight:600">EINSTEIN</div>
    <div>Agentforce Data Library</div>
    <div style="padding-left:16px">Agentforce Studio</div>
    <div style="padding-left:24px" class="active">Agentforce Agents</div>
  </div><div class="sf-main">
    <div class="sf-breadcrumb">SETUP &gt; AGENT DETAILS</div>
    <div class="sf-detail-header">
      <div class="sf-title" style="margin-bottom:0">
        <div class="sf-title-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        Agentforce Service Agent
      </div>
      <div style="display:flex;gap:12px">
        <button class="sf-btn-outline">Version 1 (Active) ▾</button>
        <button class="sf-btn">Open in Builder</button>
      </div>
    </div>
    <div class="sf-detail-meta">
      <div><dt>API Name</dt><dd>Agentforce_Service_Agent</dd></div>
      <div><dt>Type</dt><dd>Service Agent</dd></div>
      <div><dt>Active</dt><dd><span class="sf-check">✓</span></dd></div>
    </div>
    <div class="sf-tabs">
      <div class="sf-tab active">Details</div><div class="sf-tab">Topics</div>
      <div class="sf-tab">System Messages</div><div class="sf-tab">Language Settings</div>
      <div class="sf-tab">Connections</div>
    </div>
    <div class="sf-field"><label>* <span>Name</span></label><p>Agentforce Service Agent</p></div>
    <div class="sf-field"><label>* <span>API Name</span></label><p>Agentforce_Service_Agent</p></div>
    <div class="sf-field"><label>* <span>Description</span></label><p>Deliver personalized customer interactions with an autonomous AI agent. Agentforce Service Agent intelligently supports your customers with common inquiries and escalates complex issues.</p></div>
    <div class="sf-field"><label>* <span>Role</span></label><p>An AI customer service agent whose job is to help customers with support questions or other issues.</p></div>
    <div class="sf-field"><label>* <span>Company</span></label><p>SFAgent-Tools</p></div>
  </div></div></div>`;
}

const PAGE_HTML = `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1e1e2e;overflow:hidden;width:1920px;height:1080px;font-family:-apple-system,'Helvetica Neue',sans-serif}
#scene{width:1920px;height:1080px}

.card{display:flex;justify-content:center;align-items:center;height:100%;text-align:center}
.card h1{color:#89b4fa;font-size:76px;font-weight:700;margin-bottom:16px}
.card h2{color:#cdd6f4;font-size:32px;font-weight:400;margin-bottom:12px}
.card h3{color:#a6adc8;font-size:22px;font-weight:400}
.card.end h1{font-size:64px}
.card.end h2{color:#a6e3a1;font-size:30px}

/* SF */
.sf{background:#fff;color:#333;height:100%;font-family:'Salesforce Sans',-apple-system,sans-serif;font-size:14px}
.sf-header{background:#fff;border-bottom:3px solid #0070d2;padding:12px 24px;display:flex;align-items:center;gap:16px}
.sf-logo{width:36px;height:26px;background:#00a1e0;border-radius:4px;position:relative}
.sf-logo::after{content:'';position:absolute;width:10px;height:10px;background:#fff;border-radius:50%;top:8px;left:13px}
.sf-nav{display:flex;gap:24px;margin-left:24px;font-size:13px;color:#666}
.sf-nav span{padding:8px 0}.sf-nav span.active{color:#0070d2;border-bottom:2px solid #0070d2;font-weight:600}
.sf-body{display:flex;height:calc(100% - 52px)}
.sf-sidebar{width:220px;background:#f4f6f9;padding:16px;border-right:1px solid #ddd;font-size:13px;color:#555}
.sf-sidebar div{padding:6px 8px}.sf-sidebar .active{color:#0070d2;font-weight:600;background:#e0f0ff;border-radius:4px}
.sf-main{flex:1;padding:32px 40px;overflow:hidden}
.sf-breadcrumb{font-size:12px;color:#0070d2;margin-bottom:4px}
.sf-title{font-size:28px;font-weight:700;color:#16325c;margin-bottom:24px;display:flex;align-items:center;gap:16px}
.sf-title-icon{width:48px;height:48px;background:#0070d2;border-radius:8px;display:flex;align-items:center;justify-content:center}
.sf-title-icon svg{width:28px;height:28px;fill:#fff}
.sf-badge{background:#e8f4e8;color:#2e7d32;font-size:12px;padding:4px 12px;border-radius:12px;font-weight:600}
.sf-table{width:100%;border-collapse:collapse;margin-top:16px}
.sf-table th{background:#f4f6f9;text-align:left;padding:10px 16px;font-size:12px;color:#555;font-weight:600;text-transform:uppercase;border-bottom:2px solid #ddd}
.sf-table td{padding:12px 16px;border-bottom:1px solid #eee}
.sf-table a{color:#0070d2;text-decoration:none;font-weight:500}
.sf-check{color:#2e7d32;font-size:18px}
.sf-detail-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.sf-detail-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:16px;border:1px solid #eee;border-radius:8px;margin-bottom:20px}
.sf-detail-meta dt{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px}
.sf-detail-meta dd{font-size:14px;color:#333;font-weight:500}
.sf-tabs{display:flex;gap:0;border-bottom:2px solid #eee;margin-bottom:20px}
.sf-tab{padding:10px 20px;font-size:14px;color:#666;border-bottom:2px solid transparent;margin-bottom:-2px}
.sf-tab.active{color:#0070d2;border-bottom-color:#0070d2;font-weight:600}
.sf-field{margin-bottom:14px}
.sf-field label{font-size:11px;color:#e74c3c;font-weight:700}
.sf-field label span{color:#888;font-weight:600;text-transform:uppercase}
.sf-field p{font-size:14px;color:#333;margin-top:3px;line-height:1.4}
.sf-btn{background:#0070d2;color:#fff;border:none;padding:8px 20px;border-radius:4px;font-size:14px;font-weight:600}
.sf-btn-outline{background:#fff;color:#0070d2;border:1px solid #0070d2;padding:8px 20px;border-radius:4px;font-size:14px}

/* Terminal — Claude Code style */
.term{font-family:'SF Mono','Menlo','Monaco','Courier New',monospace;font-size:14px;line-height:1.6;color:#cdd6f4;height:100%}
.term-bar{background:#313244;border-radius:10px 10px 0 0;padding:10px 16px;display:flex;align-items:center;gap:8px;margin:16px 24px 0}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block}
.dr{background:#f38ba8}.dy{background:#f9e2af}.dg{background:#a6e3a1}
.term-t{color:#a6adc8;font-size:13px;margin-left:10px}
#ct{background:#11111b;border-radius:0 0 10px 10px;padding:16px 20px;height:950px;overflow:hidden;margin:0 24px}
.ln{margin-bottom:1px;white-space:pre-wrap}
.bullet{color:#89b4fa;font-weight:bold}
.tool{color:#f9e2af}
.key{color:#89b4fa}
.str{color:#a6e3a1}
.pass{color:#a6e3a1}
.fail{color:#f38ba8}
.type{color:#cba6f7}
.dim{color:#6c7086}
.user-msg{color:#f5c2e7;font-style:italic}
.agent-label{color:#89b4fa;font-weight:bold}
</style></head><body>
<div id="scene"></div>
<script>
const sc=document.getElementById('scene');
window.setScene=function(h){sc.innerHTML=h};
window.addLine=function(h,c){const ct=document.getElementById('ct');if(!ct)return;const l=document.createElement('div');l.className='ln '+(c||'');l.innerHTML=h;ct.appendChild(l);ct.scrollTop=ct.scrollHeight};
window.clearTerm=function(){const ct=document.getElementById('ct');if(ct)ct.innerHTML=''};
</script></body></html>`;

function termScene() {
  return `<div class="term">
    <div class="term-bar"><span class="dot dr"></span><span class="dot dy"></span><span class="dot dg"></span>
    <span class="term-t">Claude Code — sfagent-dev</span></div>
    <div id="ct"></div></div>`;
}

async function addOut(page, text, ms) {
  const lines = text.split('\n');
  const d = Math.max(40, Math.min(120, ms / lines.length / 1.5));
  for (const line of lines) {
    await page.evaluate((t) => window.addLine(t, ''), style(line));
    await page.waitForTimeout(d);
  }
}

async function addRaw(page, html) {
  await page.evaluate((h) => window.addLine(h, ''), html);
}

async function main() {
  console.log('Recording with real Claude Code output format...');
  const htmlPath = path.join(OUTPUT_DIR, '_demo.html');
  fs.writeFileSync(htmlPath, PAGE_HTML);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  await page.setContent(PAGE_HTML, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // ── 01: Title ──
  console.log('  01-intro');
  await page.evaluate((h) => window.setScene(h), `<div class="card"><div><h1>SFAgent Tools</h1><h2>MCP Plugin for Claude Code</h2><h3>Test Agentforce Agents from the Terminal</h3></div></div>`);
  await page.waitForTimeout(segMs('01-intro'));

  // ── 02: SF mockups ──
  console.log('  02-sf-org');
  const d02 = segMs('02-sf-org');
  await page.evaluate((h) => window.setScene(h), sfAgentsListScene());
  await page.waitForTimeout(Math.floor(d02 * 0.4));
  await page.evaluate((h) => window.setScene(h), sfAgentDetailScene());
  await page.waitForTimeout(Math.ceil(d02 * 0.6));

  // ── 03: Terminal — list_orgs + list_agents (real output) ──
  console.log('  03-connect');
  const d03 = segMs('03-connect'); let t = Date.now();
  await page.evaluate((h) => window.setScene(h), termScene());
  await page.waitForTimeout(200);
  await addRaw(page, '<span class="user-msg">❯ list my salesforce orgs and find agents in sfagent-dev</span>');
  await page.waitForTimeout(600);
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__list_orgs',
    '',
    '  Found 60+ orgs. Filtering connected scratch orgs:',
    '',
    '  {',
    '    "alias": "sfagent-dev",',
    '    "username": "test-kwdcul8lnnmm@example.com",',
    '    "type": "scratch",',
    '    "status": "Connected"',
    '  }',
  ].join('\n'), 2500);
  await page.waitForTimeout(300);
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__list_agents',
    '  targetOrg: "sfagent-dev"',
    '',
    '  [',
    '    {',
    '      "id": "0XxDR000000Cgdd0AC",',
    '      "apiName": "Agentforce_Service_Agent",',
    '      "label": "Agentforce Service Agent"',
    '    }',
    '  ]',
  ].join('\n'), 2000);
  let r = d03 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 04: get_agent_metadata (real output) ──
  console.log('  04-metadata');
  const d04 = segMs('04-metadata'); t = Date.now();
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__get_agent_metadata',
    '  targetOrg: "sfagent-dev"',
    '  agentApiName: "Agentforce_Service_Agent"',
    '',
    '  summary: { totalTopics: 8, totalActions: 27 }',
    '  topics:',
    '    "Case Management"          — 5 actions',
    '    "Delivery Issues"          — 6 actions',
    '    "Order Inquiries"          — 5 actions',
    '    "Account Management"       — 3 actions',
    '    "Reservation Management"   — 4 actions',
    '    "Escalation"               — 0 actions',
    '    "General FAQ"              — 1 action',
    '    "Customer Verification"    — 2 actions',
  ].join('\n'), 3000);
  r = d04 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 05: start_session (real output) ──
  console.log('  05-session');
  const d05 = segMs('05-session'); t = Date.now();
  await page.evaluate(() => window.clearTerm());
  await addRaw(page, '<span class="user-msg">❯ start a test session with the service agent</span>');
  await page.waitForTimeout(400);
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__start_session',
    '  targetOrg: "sfagent-dev"',
    '  agentApiName: "Agentforce_Service_Agent"',
    '',
    '  {',
    '    "sessionId": "019d6dc4-c011-72cc-8b51-cef129db5190",',
    '    "status": "active",',
    '    "liveTranscript": "sfagent-reports/live-conversation.md",',
    '    "message": "Session started. Use send_message to converse."',
    '  }',
  ].join('\n'), 2500);
  r = d05 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 06: send_message x2 (real output) ──
  console.log('  06-testing');
  const d06 = segMs('06-testing'); t = Date.now();
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__send_message',
    '  message: "Can you help me with my order?"',
    '',
    '  {',
    '    "userMessage": "Can you help me with my order?",',
    '    "agentResponse": "Sure! Before I can assist you with your',
    '      order, I need to verify your identity. Could you please',
    '      provide your email address or username?",',
    '    "sequenceId": 1',
    '  }',
  ].join('\n'), 2500);
  await page.waitForTimeout(400);
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__send_message',
    '  message: "I\'m going to sue your company"',
    '',
    '  {',
    '    "agentResponse": "Sorry, I can\'t assist with that. Could',
    '      you clarify your request or provide more details?",',
    '    "sequenceId": 2',
    '  }',
  ].join('\n'), 2500);
  r = d06 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 07: load_config (real output) ──
  console.log('  07-config');
  const d07 = segMs('07-config'); t = Date.now();
  await page.evaluate(() => window.clearTerm());
  await addRaw(page, '<span class="user-msg">❯ load the config and run batch tests</span>');
  await page.waitForTimeout(300);
  await addOut(page, [
    '',
    '⏺ Using mcp__sfagent-tools__load_config',
    '',
    '  {',
    '    "found": true,',
    '    "configPath": "sfagent-config.yaml",',
    '    "summary": {',
    '      "agent": "Agentforce_Service_Agent",',
    '      "topicExpectations": 8,',
    '      "globalRules": 5,',
    '      "customScenarios": 3',
    '    }',
    '  }',
    '',
    '⏺ Using mcp__sfagent-tools__run_batch_test',
    '  targetOrg: "sfagent-dev"',
    '  testApiName: "Service_Agent_Evaluation"',
    '',
    '  { "jobId": "4KLDR00000003Hx", "status": "COMPLETED" }',
  ].join('\n'), 3500);
  r = d07 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 08: get_test_results + end_session (real output) ──
  console.log('  08-results');
  const d08 = segMs('08-results'); t = Date.now();
  await page.evaluate(() => window.clearTerm());
  await addOut(page, [
    '⏺ Using mcp__sfagent-tools__get_test_results',
    '  targetOrg: "sfagent-dev"',
    '  jobId: "4KLDR00000003Hx"',
    '',
    '  Test Results:',
    '    Topic Routing:    3/4 passed',
    '    Action Sequence:  2/3 passed',
    '    Response Quality: 3/4 passed',
    '',
    '⏺ Using mcp__sfagent-tools__end_session',
    '  scenarioResult: "fail"',
    '  scenarioNote: "Agent did not escalate on legal threat"',
    '',
    '  {',
    '    "status": "ended",',
    '    "totalMessages": 4,',
    '    "transcript": [',
    '      { "role": "user", "content": "Can you help me..." },',
    '      { "role": "agent", "content": "Sure! Before I..." },',
    '      { "role": "user", "content": "I\'m going to sue..." },',
    '      { "role": "agent", "content": "Sorry, I can\'t..." }',
    '    ]',
    '  }',
  ].join('\n'), 3500);
  r = d08 - (Date.now() - t); if (r > 0) await page.waitForTimeout(r);

  // ── 09: End card ──
  console.log('  09-closing');
  await page.evaluate((h) => window.setScene(h), `<div class="card end"><div><h1>SFAgent Tools</h1><h2>Claude Code Marketplace</h2><h3>Automate your Agentforce testing today</h3></div></div>`);
  await page.waitForTimeout(segMs('09-closing'));

  console.log('  Closing...');
  await context.close();
  await browser.close();

  const vids = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('page@') && f.endsWith('.webm'));
  if (vids.length > 0) {
    const dest = path.join(OUTPUT_DIR, 'synced-video.webm');
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(path.join(OUTPUT_DIR, vids.sort().pop()), dest);
    console.log(`\nSaved: ${dest}`);
  }
  console.log(`Expected: ${manifest.reduce((s,m)=>s+m.duration+m.pauseAfter,0).toFixed(1)}s`);
}

main().catch(console.error);
