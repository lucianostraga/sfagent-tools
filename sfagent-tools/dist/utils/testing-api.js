import { execSync } from 'node:child_process';
export async function runBatchTest(targetOrg, testApiName) {
    try {
        const result = execSync(`sf agent test run --api-name "${testApiName}" --target-org "${targetOrg}" --wait 10 --result-format json --json`, { encoding: 'utf-8', timeout: 600000 });
        const parsed = JSON.parse(result);
        return {
            runId: parsed.result.jobId ?? parsed.result.runId ?? '',
            status: parsed.result.status ?? 'Unknown',
            testName: testApiName,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to run batch test "${testApiName}": ${message}`);
    }
}
export async function getTestResults(targetOrg, jobId) {
    try {
        const result = execSync(`sf agent test results --job-id "${jobId}" --target-org "${targetOrg}" --result-format json --json`, { encoding: 'utf-8', timeout: 120000 });
        const parsed = JSON.parse(result);
        const testCases = parsed.result.testCases ?? [];
        return testCases.map((tc) => ({
            testCaseName: tc.name ?? '',
            utterance: tc.utterance ?? '',
            expectedTopic: tc.expectedTopic ?? '',
            actualTopic: tc.actualTopic ?? '',
            topicMatch: tc.topicMatch ?? false,
            expectedActions: tc.expectedActions ?? [],
            actualActions: tc.actualActions ?? [],
            actionsMatch: tc.actionsMatch ?? false,
            expectedOutcome: tc.expectedOutcome ?? '',
            actualOutcome: tc.actualOutcome ?? '',
            outcomeMatch: tc.outcomeMatch ?? false,
            overallResult: tc.result === 'PASS' ? 'pass' : 'fail',
        }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get test results for job "${jobId}": ${message}`);
    }
}
export async function listTests(targetOrg) {
    try {
        const result = execSync(`sf agent test list --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 30000 });
        const parsed = JSON.parse(result);
        return parsed.result.map((t) => t.apiName ?? t.name ?? '');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list tests: ${message}`);
    }
}
//# sourceMappingURL=testing-api.js.map