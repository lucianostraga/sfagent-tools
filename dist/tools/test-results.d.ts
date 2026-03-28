import { z } from 'zod';
export declare const getTestResultsSchema: z.ZodObject<{
    targetOrg: z.ZodString;
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
    jobId: string;
}, {
    targetOrg: string;
    jobId: string;
}>;
export declare function getTestResults(args: z.infer<typeof getTestResultsSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=test-results.d.ts.map