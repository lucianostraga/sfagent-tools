import { z } from 'zod';
import { isProductionOrg } from '../auth/sf-auth.js';
import { runBatchTest as runTest } from '../utils/testing-api.js';

export const runBatchTestSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  testApiName: z.string().describe('API name of the test: an AiTestingDefinition (Agentforce Studio) or a legacy AiEvaluationDefinition'),
  testRunner: z
    .enum(['agentforce-studio', 'testing-center'])
    .optional()
    .describe('Optional: which runner the test belongs to. Without it the CLI looks the name up in both.'),
});

export async function runBatchTest(args: z.infer<typeof runBatchTestSchema>) {
  const isProd = await isProductionOrg(args.targetOrg);
  if (isProd) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '⚠️ BLOCKED: Refusing to run tests against a production org (or one whose type could not be verified). Use a sandbox, scratch org or Developer Edition.',
        },
      ],
    };
  }

  const result = await runTest(args.targetOrg, args.testApiName, args.testRunner);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            runId: result.runId,
            status: result.status,
            state: result.state,
            testName: result.testName,
            message: result.state === 'completed'
              ? 'Test run completed. Use get_test_results to fetch detailed results.'
              : `Test run status: ${result.status}. Run ID: ${result.runId}`,
          },
          null,
          2
        ),
      },
    ],
  };
}
