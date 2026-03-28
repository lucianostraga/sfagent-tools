import { z } from 'zod';
export declare const listOrgsSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare function listOrgs(): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=orgs.d.ts.map