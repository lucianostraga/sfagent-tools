#!/usr/bin/env node
/**
 * End-to-end test: multi-turn conversation with an Agentforce agent
 * via the SFAgent Tools MCP server.
 *
 * Usage: node scripts/test-conversation.mjs
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const TARGET_ORG = 'sfagent-dev';
const AGENT_API_NAME = 'Agentforce_Service_Agent';

let requestId = 0;

function nextId() {
  return ++requestId;
}

// Start the MCP server as a child process
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: new URL('..', import.meta.url).pathname,
});

const rl = createInterface({ input: server.stdout });

// Promise-based request/response
const pending = new Map();

rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  } catch {
    // ignore non-JSON lines
  }
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = nextId();
    pending.set(id, resolve);
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    server.stdin.write(msg + '\n');
  });
}

async function callTool(name, args) {
  const resp = await send('tools/call', { name, arguments: args });
  const text = resp?.result?.content?.[0]?.text;
  return text ? JSON.parse(text) : resp;
}

// ---- Main test ----

async function main() {
  console.log('=== SFAgent Tools - Multi-Turn Conversation Test ===\n');

  // 1. Initialize MCP
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-runner', version: '1.0.0' },
  });
  send('notifications/initialized');
  console.log('✓ MCP server initialized\n');

  // 2. Start session
  console.log('--- Starting session ---');
  const session = await callTool('start_session', {
    targetOrg: TARGET_ORG,
    agentApiName: AGENT_API_NAME,
  });
  console.log(`Session ID: ${session.sessionId}`);
  console.log(`Status: ${session.status}\n`);

  const sessionId = session.sessionId;

  // 3. Multi-turn conversation
  const messages = [
    "Hi, I need help with a case about a software license that's not activating",
    "My email is sarah.johnson@acme.com",
    "The case is about error code LIC-4092 when trying to activate our enterprise license",
    "Can you check the status of that case?",
  ];

  for (const msg of messages) {
    console.log(`--- Turn ${messages.indexOf(msg) + 1} ---`);
    console.log(`👤 User: ${msg}`);

    const result = await callTool('send_message', { sessionId, message: msg });
    console.log(`🤖 Agent: ${result.agentResponse}`);
    console.log(`   (sequence: ${result.sequenceId}, total messages: ${result.totalMessagesInSession})\n`);
  }

  // 4. End session and get transcript
  console.log('--- Ending session ---');
  const endResult = await callTool('end_session', { sessionId });
  console.log(`Status: ${endResult.status}`);
  console.log(`Total messages in transcript: ${endResult.totalMessages}\n`);

  console.log('=== Test Complete ===');

  server.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  server.kill();
  process.exit(1);
});

// Timeout safety
setTimeout(() => {
  console.error('Test timed out after 3 minutes');
  server.kill();
  process.exit(1);
}, 180000);
