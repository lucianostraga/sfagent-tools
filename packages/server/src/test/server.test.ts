import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRunState, parseScorer, parseTestResults } from '../utils/testing-api.js';
import { buildPreviewStartArgs, summarizeAgentMessages } from '../utils/agent-api.js';
import { parseSfJson } from '../utils/sf.js';
import { isProductionOrgType } from '../auth/sf-auth.js';
import { toStudioYaml } from '../tools/test-spec.js';

test('run states from both runners are normalized', () => {
  assert.equal(normalizeRunState('COMPLETED'), 'completed'); // Testing Center
  assert.equal(normalizeRunState('SUCCESS'), 'completed'); // Agentforce Studio
  assert.equal(normalizeRunState('FAILED'), 'failed');
  assert.equal(normalizeRunState('ERROR'), 'failed');
  assert.equal(normalizeRunState('IN_PROGRESS'), 'running');
  assert.equal(normalizeRunState('Completed'), 'completed');
  assert.equal(normalizeRunState(undefined), 'unknown');
});

test('Agentforce Studio results are read from scorers (real response, 2026-11-18)', () => {
  const [result] = parseTestResults({
    testCases: [
      {
        testNumber: 1,
        subjectResponse: JSON.stringify({ userInput: 'I need to submit a support case' }),
        testScorerResults: [
          {
            scorerName: 'Subagent Evaluation',
            scorerResponse: '{"actualValue":"case_submission","expectedValue":"case_submission"}',
          },
        ],
      },
    ],
  });
  assert.equal(result.utterance, 'I need to submit a support case');
  assert.equal(result.actualSubagent, 'case_submission');
  assert.equal(result.subagentMatch, true);
  assert.equal(result.overallResult, 'pass');
});

test('a mismatched scorer fails the case; a grading-only scorer is unknown', () => {
  assert.equal(parseScorer('Subagent Evaluation', '{"actualValue":"faq","expectedValue":"case_submission"}').passed, false);
  const latency = parseScorer('Output Latency', '{"score":1234}');
  assert.equal(latency.passed, undefined);
  const [onlyLatency] = parseTestResults({ testCases: [{ testScorerResults: [{ scorerName: 'Output Latency', scorerResponse: '{"score":1234}' }] }] });
  assert.equal(onlyLatency.overallResult, 'unknown');
});

test('legacy Testing Center results still parse, including the old "topic" names', () => {
  const [result] = parseTestResults({
    testCases: [{ name: 'tc1', utterance: 'hi', expectedTopic: 'faq', actualTopic: 'faq', topicMatch: true, result: 'PASS' }],
  });
  assert.equal(result.expectedSubagent, 'faq');
  assert.equal(result.subagentMatch, true);
  assert.equal(result.overallResult, 'pass');
});

test('preview arguments never go through a shell and keep the utterance-free start safe', () => {
  const args = buildPreviewStartArgs('my-org"; rm -rf ~; "', 'Agent', { contextVariables: [{ name: '$Context.X', type: 'Text', value: 'a b' }] });
  assert.deepEqual(args.slice(0, 5), ['agent', 'preview', 'start', '--target-org', 'my-org"; rm -rf ~; "']);
  assert.equal(args[args.indexOf('--context-variables-json') + 1], '[{"name":"$Context.X","type":"Text","value":"a b"}]');
});

test('authoring bundles simulate actions unless live actions are asked for', () => {
  assert.ok(buildPreviewStartArgs('o', 'A', { authoringBundle: true }).includes('--simulate-actions'));
  assert.ok(buildPreviewStartArgs('o', 'A', { authoringBundle: true, liveActions: true }).includes('--use-live-actions'));
  assert.ok(buildPreviewStartArgs('o', 'A').includes('--api-name'));
});

test('agent replies of any type are kept, and CLT forms are reported (real response, 2026-11-18)', () => {
  const { text, rendersUi } = summarizeAgentMessages([
    {
      type: 'Inquire',
      message: 'Please provide the details for your support case.',
      collect: [{ targetType: 'copilotActionInput/submit_case_179h90000001m7S', targetProperty: 'case_data' }],
    },
  ]);
  assert.equal(text, 'Please provide the details for your support case.');
  assert.deepEqual(rendersUi, ['copilotActionInput/submit_case_179h90000001m7S (case_data)']);
});

test('CLI JSON is read even after a warning line', () => {
  const out = parseSfJson<{ ok: boolean }>(' ›   Warning: @salesforce/cli update available\n{"status":0,"result":{"ok":true}}');
  assert.equal(out.result?.ok, true);
});

test('production guard: sandboxes, scratch orgs and Developer Edition pass; anything else is blocked', () => {
  assert.equal(isProductionOrgType({ IsSandbox: true, OrganizationType: 'Developer Edition' }), false); // scratch
  assert.equal(isProductionOrgType({ IsSandbox: false, OrganizationType: 'Developer Edition' }), false);
  assert.equal(isProductionOrgType({ IsSandbox: true, OrganizationType: 'Enterprise Edition' }), false);
  assert.equal(isProductionOrgType({ IsSandbox: false, OrganizationType: 'Enterprise Edition' }), true);
  assert.equal(isProductionOrgType(undefined), true); // could not verify: fail closed
});

test('Agentforce Studio spec: valid API name, description and a scorer per case', () => {
  const yaml = toStudioYaml({
    name: 'case-submission',
    agent: 'CustomLightningTypes',
    cases: [
      { id: 'a', utterance: 'I need to submit a support case', expectedSubagent: 'case_submission' },
      { id: 'b', utterance: 'second turn', conversationHistory: [{ role: 'user', message: 'hi' }] },
    ],
  });
  assert.match(yaml, /^name: case_submission$/m);
  assert.match(yaml, /^description: /m);
  assert.match(yaml, /expected: case_submission/);
  // The multi-turn case has no subagent to label the agent turns with, so it is skipped.
  assert.doesNotMatch(yaml, /second turn/);
});
