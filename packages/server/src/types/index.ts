export interface SfOrg {
  alias: string;
  username: string;
  orgId: string;
  instanceUrl: string;
  connectedStatus: string;
  isSandbox: boolean;
  isScratch: boolean;
  isDevHub: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  apiName: string;
  status: string;
}

export interface ContextVariable {
  name: string;
  type: string;
  value: string | number | boolean;
}

export interface SessionOptions {
  // Run a local authoring bundle instead of the published agent.
  authoringBundle?: boolean;
  // Only for authoring bundles: run real Apex, Flows and prompts instead of simulating them.
  liveActions?: boolean;
  contextVariables?: ContextVariable[];
}

export interface AgentSession {
  sessionId: string;
  agentId: string;
  orgAlias: string;
  authoringBundle: boolean;
  sequenceId: number;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  sequenceId: number;
}

export interface SSEEvent {
  event: string;
  data: string;
}

// Run states differ by runner: Testing Center (legacy) uses NEW/IN_PROGRESS/COMPLETED/ERROR, Agentforce Studio
// uses CREATED/IN_PROGRESS/SUCCESS/FAILED. Both have TERMINATED.
export type RunState = 'running' | 'completed' | 'failed' | 'terminated' | 'unknown';

export interface BatchTestRun {
  runId: string;
  status: string;
  state: RunState;
  testName: string;
}

export interface ScorerResult {
  name: string;
  expected?: string;
  actual?: string;
  // Raw scorer output, for scorers that grade rather than compare (LLM ratings, latency).
  raw?: string;
  passed?: boolean;
}

// "Subagent" is the Agent Script v2.0 term (renamed from "topic" in April 2026).
// Legacy (AiEvaluationDefinition) results come as expected/actual pairs; Agentforce Studio (AiTestingDefinition)
// results come as scorers. Both are normalized here.
export interface TestResult {
  testCaseName: string;
  utterance: string;
  expectedSubagent: string;
  actualSubagent: string;
  subagentMatch: boolean;
  expectedActions: string[];
  actualActions: string[];
  actionsMatch: boolean;
  expectedOutcome: string;
  actualOutcome: string;
  outcomeMatch: boolean;
  scorers: ScorerResult[];
  overallResult: 'pass' | 'fail' | 'unknown';
}
