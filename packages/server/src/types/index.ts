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

export interface AgentSession {
  sessionId: string;
  agentId: string;
  orgAlias: string;
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

export interface BatchTestRun {
  runId: string;
  status: string;
  testName: string;
}

// "Subagent" is the Agent Script v2.0 term (renamed from "topic" in April 2026,
// per https://github.com/forcedotcom/cli/blob/main/releasenotes/README.md).
// The Testing API still returns the old field names on older API versions, so
// the parser accepts both shapes — see utils/testing-api.ts.
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
  overallResult: 'pass' | 'fail';
}
