import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { listOrgsSchema, listOrgs } from './tools/orgs.js';
import { listAgentsSchema, listAgents } from './tools/agents.js';
import { startSessionSchema, startSession, endSessionSchema, endSession } from './tools/session.js';
import { sendMessageSchema, sendMessage } from './tools/messaging.js';
import { runBatchTestSchema, runBatchTest } from './tools/batch-test.js';
import { getTestResultsSchema, getTestResults } from './tools/test-results.js';
import { getAgentMetadataSchema, getAgentMetadata } from './tools/agent-metadata.js';
import { loadConfigSchema, loadConfig } from './tools/config.js';

const server = new McpServer({
  name: 'sfagent-tools',
  version: '0.1.0',
});

// Tool: list_orgs
server.tool(
  'list_orgs',
  'List all Salesforce orgs authenticated via sf CLI. Shows alias, username, type (sandbox/scratch/production), and connection status.',
  listOrgsSchema.shape,
  async () => listOrgs()
);

// Tool: list_agents
server.tool(
  'list_agents',
  'List Agentforce agents in a Salesforce org. Returns agent API names needed for start_session. Warns if targeting a production org.',
  listAgentsSchema.shape,
  async (args) => listAgents(listAgentsSchema.parse(args))
);

// Tool: start_session
server.tool(
  'start_session',
  'Start a headless conversation session with an Agentforce agent via sf agent preview. Returns a sessionId for use with send_message. Blocks production orgs. Use the agentApiName from list_agents.',
  startSessionSchema.shape,
  async (args) => startSession(startSessionSchema.parse(args))
);

// Tool: send_message
server.tool(
  'send_message',
  'Send a message to an active Agentforce agent session and receive the full response. Uses sf agent preview send internally.',
  sendMessageSchema.shape,
  async (args) => sendMessage(sendMessageSchema.parse(args))
);

// Tool: end_session
server.tool(
  'end_session',
  'End an active agent session and return the full conversation transcript with all messages exchanged.',
  endSessionSchema.shape,
  async (args) => endSession(endSessionSchema.parse(args))
);

// Tool: run_batch_test
server.tool(
  'run_batch_test',
  'Run a predefined Agentforce test suite (AiEvaluationDefinition) via the sf CLI. Waits for completion and returns the run ID. Blocks production orgs.',
  runBatchTestSchema.shape,
  async (args) => runBatchTest(runBatchTestSchema.parse(args))
);

// Tool: get_test_results
server.tool(
  'get_test_results',
  'Fetch detailed results of a completed batch test run. Returns pass/fail verdicts for topic routing, action sequences, and response quality.',
  getTestResultsSchema.shape,
  async (args) => getTestResults(getTestResultsSchema.parse(args))
);

// Tool: get_agent_metadata
server.tool(
  'get_agent_metadata',
  'Retrieve complete agent configuration: topics (with descriptions), actions per topic, and agent structure. Use this to understand what the agent can do before generating tests.',
  getAgentMetadataSchema.shape,
  async (args) => getAgentMetadata(getAgentMetadataSchema.parse(args))
);

// Tool: load_config
server.tool(
  'load_config',
  'Load user expectations from sfagent-config.yaml. Returns topic-specific rules, global rules, and custom test scenarios. If no config file found, returns a sample template. Call this before generating tests to incorporate user expectations.',
  loadConfigSchema.shape,
  async (args) => loadConfig(loadConfigSchema.parse(args))
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('SFAgent Tools MCP server failed to start:', error);
  process.exit(1);
});
