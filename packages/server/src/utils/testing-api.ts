import { runSfOk } from './sf.js';
import type { BatchTestRun, RunState, ScorerResult, TestResult } from '../types/index.js';

export type TestRunner = 'agentforce-studio' | 'testing-center';

// Testing Center (legacy): NEW, IN_PROGRESS, COMPLETED, ERROR. Agentforce Studio: CREATED, IN_PROGRESS, SUCCESS,
// FAILED. Both: TERMINATED.
export function normalizeRunState(status: string | undefined): RunState {
  switch ((status ?? '').toUpperCase()) {
    case 'NEW':
    case 'CREATED':
    case 'IN_PROGRESS':
      return 'running';
    case 'COMPLETED':
    case 'SUCCESS':
      return 'completed';
    case 'ERROR':
    case 'FAILED':
      return 'failed';
    case 'TERMINATED':
      return 'terminated';
    default:
      return 'unknown';
  }
}

export async function runBatchTest(targetOrg: string, testApiName: string, testRunner?: TestRunner): Promise<BatchTestRun> {
  const args = ['agent', 'test', 'run', '--api-name', testApiName, '--target-org', targetOrg, '--wait', '20'];
  // Without a runner the CLI looks the name up in both formats; pass it when the caller knows it.
  if (testRunner) args.push('--test-runner', testRunner);
  const result = await runSfOk<{ jobId?: string; runId?: string; status?: string }>(args, 25 * 60_000);
  const status = result.status ?? 'UNKNOWN';
  return { runId: result.jobId ?? result.runId ?? '', status, state: normalizeRunState(status), testName: testApiName };
}

interface LegacyTestCase {
  name?: string;
  utterance?: string;
  expectedSubagent?: string;
  actualSubagent?: string;
  subagentMatch?: boolean;
  expectedTopic?: string;
  actualTopic?: string;
  topicMatch?: boolean;
  expectedActions?: string[];
  actualActions?: string[];
  actionsMatch?: boolean;
  expectedOutcome?: string;
  actualOutcome?: string;
  outcomeMatch?: boolean;
  result?: string;
}

interface StudioTestCase {
  testNumber?: number;
  inputs?: { utterance?: string };
  subjectResponse?: string;
  testScorerResults?: Array<{ scorerName?: string; scorerResponse?: string }>;
}

// Agentforce Studio scorers answer with a JSON string. Comparison scorers carry actualValue/expectedValue;
// grading scorers (LLM ratings, latency) carry a score or result instead.
export function parseScorer(name: string, response: string | undefined): ScorerResult {
  let data: Record<string, unknown> = {};
  try {
    data = response ? (JSON.parse(response) as Record<string, unknown>) : {};
  } catch {
    return { name, raw: response };
  }
  const expected = data.expectedValue !== undefined ? String(data.expectedValue) : undefined;
  const actual = data.actualValue !== undefined ? String(data.actualValue) : undefined;
  let passed: boolean | undefined;
  if (typeof data.result === 'string') passed = data.result.toUpperCase() === 'PASS';
  else if (expected !== undefined && actual !== undefined) passed = expected.trim() === actual.trim();
  return { name, expected, actual, raw: response, passed };
}

function utteranceFrom(tc: StudioTestCase): string {
  if (tc.inputs?.utterance) return tc.inputs.utterance;
  try {
    const subject = JSON.parse(tc.subjectResponse ?? '{}') as { userInput?: string };
    return subject.userInput ?? '';
  } catch {
    return '';
  }
}

export function parseTestResults(result: { testCases?: Array<LegacyTestCase & StudioTestCase> }): TestResult[] {
  return (result.testCases ?? []).map((tc) => {
    if (tc.testScorerResults) {
      const scorers = tc.testScorerResults.map((s) => parseScorer(s.scorerName ?? 'unknown', s.scorerResponse));
      const routing = scorers.find((s) => /subagent|topic/i.test(s.name));
      const verdicts = scorers.map((s) => s.passed).filter((p): p is boolean => p !== undefined);
      return {
        testCaseName: `test ${tc.testNumber ?? ''}`.trim(),
        utterance: utteranceFrom(tc),
        expectedSubagent: routing?.expected ?? '',
        actualSubagent: routing?.actual ?? '',
        subagentMatch: routing?.passed ?? false,
        expectedActions: [],
        actualActions: [],
        actionsMatch: false,
        expectedOutcome: '',
        actualOutcome: '',
        outcomeMatch: false,
        scorers,
        overallResult: verdicts.length === 0 ? 'unknown' : verdicts.every(Boolean) ? 'pass' : 'fail',
      };
    }
    return {
      testCaseName: tc.name ?? '',
      utterance: tc.utterance ?? '',
      expectedSubagent: tc.expectedSubagent ?? tc.expectedTopic ?? '',
      actualSubagent: tc.actualSubagent ?? tc.actualTopic ?? '',
      subagentMatch: tc.subagentMatch ?? tc.topicMatch ?? false,
      expectedActions: tc.expectedActions ?? [],
      actualActions: tc.actualActions ?? [],
      actionsMatch: tc.actionsMatch ?? false,
      expectedOutcome: tc.expectedOutcome ?? '',
      actualOutcome: tc.actualOutcome ?? '',
      outcomeMatch: tc.outcomeMatch ?? false,
      scorers: [],
      overallResult: tc.result === 'PASS' ? 'pass' : tc.result ? 'fail' : 'unknown',
    };
  });
}

export async function getTestResults(targetOrg: string, jobId: string, testRunner?: TestRunner): Promise<TestResult[]> {
  const args = ['agent', 'test', 'results', '--job-id', jobId, '--target-org', targetOrg, '--verbose'];
  if (testRunner) args.push('--test-runner', testRunner);
  const result = await runSfOk<{ testCases?: Array<LegacyTestCase & StudioTestCase> }>(args, 5 * 60_000);
  return parseTestResults(result);
}

export async function listTests(targetOrg: string): Promise<string[]> {
  const result = await runSfOk<Array<{ name?: string; apiName?: string; fullName?: string }>>(
    ['agent', 'test', 'list', '--target-org', targetOrg], 60_000);
  return result.map((t) => t.apiName ?? t.fullName ?? t.name ?? '');
}
