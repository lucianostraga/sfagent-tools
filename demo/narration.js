#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'audio');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const VENV_PYTHON = path.join(__dirname, '.venv', 'bin', 'python3');
const VOICE = 'en-US-AndrewMultilingualNeural';
const RATE = '+12%';

const segments = [
  {
    id: '01-intro',
    text: `SFAgent Tools — an MCP plugin for Claude Code that tests your Agentforce agents directly from the terminal.`,
    pauseAfter: 0.8,
  },
  {
    id: '02-sf-org',
    text: `Here's the Salesforce org with the Agentforce Service Agent — active, with its API name, description, and role configured.`,
    pauseAfter: 0.6,
  },
  {
    id: '03-connect',
    text: `From the terminal, we list authenticated orgs and discover agents. The plugin reads your SF CLI credentials — zero extra setup.`,
    pauseAfter: 0.5,
  },
  {
    id: '04-metadata',
    text: `Get agent metadata reveals the full structure: eight topics, twenty-seven actions. Case management, delivery issues, escalations — everything mapped out before testing.`,
    pauseAfter: 0.5,
  },
  {
    id: '05-session',
    text: `Start a headless session — the same engine as the Salesforce UI, but from your terminal. Every message is logged to a live markdown transcript.`,
    pauseAfter: 0.5,
  },
  {
    id: '06-testing',
    text: `Send test messages and get real responses. Identity verification, competitor questions, escalation triggers — tested in seconds, not minutes.`,
    pauseAfter: 0.5,
  },
  {
    id: '07-config',
    text: `Define expectations in a YAML config: topic rules, global rules, and custom scenarios. Run batch tests with AI evaluation definitions for automated pass-fail verdicts.`,
    pauseAfter: 0.5,
  },
  {
    id: '08-results',
    text: `Get clear results: pass-fail per scenario, full transcripts in markdown, and batch test reports — all exportable and repeatable.`,
    pauseAfter: 0.5,
  },
  {
    id: '09-closing',
    text: `Seven tools. One plugin. SFAgent Tools on the Claude Code marketplace. Automate your Agentforce testing today.`,
    pauseAfter: 1.5,
  },
];

console.log(`Voice: ${VOICE}, rate: ${RATE}`);
const manifest = [];
for (const seg of segments) {
  const outFile = path.join(OUTPUT_DIR, `${seg.id}.mp3`);
  console.log(`  ${seg.id}: "${seg.text.substring(0, 55)}..."`);
  const escaped = seg.text.replace(/"/g, '\\"').replace(/'/g, "'\\''");
  execSync(`${VENV_PYTHON} -m edge_tts --voice "${VOICE}" --text "${escaped}" --write-media "${outFile}" --rate="${RATE}"`, { stdio: 'pipe' });
  let duration = 4;
  try { duration = parseFloat(execSync(`ffprobe -i "${outFile}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim()) || 4; } catch {}
  manifest.push({ id: seg.id, file: outFile, duration, pauseAfter: seg.pauseAfter, text: seg.text });
}
fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
const total = manifest.reduce((s, m) => s + m.duration + m.pauseAfter, 0);
console.log(`\n${manifest.length} segments, ${total.toFixed(1)}s`);
