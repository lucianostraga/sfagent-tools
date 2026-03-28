import type { BatchTestRun, TestResult } from '../types/index.js';
export declare function runBatchTest(targetOrg: string, testApiName: string): Promise<BatchTestRun>;
export declare function getTestResults(targetOrg: string, jobId: string): Promise<TestResult[]>;
export declare function listTests(targetOrg: string): Promise<string[]>;
//# sourceMappingURL=testing-api.d.ts.map