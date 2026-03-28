import { z } from 'zod';
export declare const runBatchTestSchema: z.ZodObject<{
    targetOrg: z.ZodString;
    testApiName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
    testApiName: string;
}, {
    targetOrg: string;
    testApiName: string;
}>;
export declare function runBatchTest(args: z.infer<typeof runBatchTestSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=batch-test.d.ts.map