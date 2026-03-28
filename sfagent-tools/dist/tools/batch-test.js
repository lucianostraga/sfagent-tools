import { z } from 'zod';
import { isProductionOrg } from '../auth/sf-auth.js';
import { runBatchTest as runTest } from '../utils/testing-api.js';
export const runBatchTestSchema = z.object({
    targetOrg: z.string().describe('Org alias or username'),
    testApiName: z.string().describe('API name of the AiEvaluationDefinition to run'),
});
export async function runBatchTest(args) {
    const isProd = await isProductionOrg(args.targetOrg);
    if (isProd) {
        return {
            content: [
                {
                    type: 'text',
                    text: '⚠️ BLOCKED: Refusing to run tests against a PRODUCTION org. Use a sandbox or scratch org.',
                },
            ],
        };
    }
    const result = await runTest(args.targetOrg, args.testApiName);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    runId: result.runId,
                    status: result.status,
                    testName: result.testName,
                    message: result.status === 'Completed'
                        ? 'Test run completed. Use get_test_results to fetch detailed results.'
                        : `Test run status: ${result.status}. Run ID: ${result.runId}`,
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=batch-test.js.map