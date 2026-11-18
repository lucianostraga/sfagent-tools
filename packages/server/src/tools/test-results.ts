import { z } from 'zod';
import { getTestResults as fetchResults } from '../utils/testing-api.js';

export const getTestResultsSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  jobId: z.string().describe('Job/run ID from run_batch_test'),
  testRunner: z
    .enum(['agentforce-studio', 'testing-center'])
    .optional()
    .describe('Optional: agentforce-studio (AiTestingDefinition) or testing-center (legacy AiEvaluationDefinition)'),
});

export async function getTestResults(args: z.infer<typeof getTestResultsSchema>) {
  const results = await fetchResults(args.targetOrg, args.jobId, args.testRunner);

  const summary = {
    totalTests: results.length,
    passed: results.filter((r) => r.overallResult === 'pass').length,
    failed: results.filter((r) => r.overallResult === 'fail').length,
    unknown: results.filter((r) => r.overallResult === 'unknown').length,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            summary,
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}
