import { z } from 'zod';
import { getTestResults as fetchResults } from '../utils/testing-api.js';
export const getTestResultsSchema = z.object({
    targetOrg: z.string().describe('Org alias or username'),
    jobId: z.string().describe('Job/run ID from run_batch_test'),
});
export async function getTestResults(args) {
    const results = await fetchResults(args.targetOrg, args.jobId);
    const summary = {
        totalTests: results.length,
        passed: results.filter((r) => r.overallResult === 'pass').length,
        failed: results.filter((r) => r.overallResult === 'fail').length,
    };
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    summary,
                    results,
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=test-results.js.map