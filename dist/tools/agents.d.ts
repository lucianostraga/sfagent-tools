import { z } from 'zod';
export declare const listAgentsSchema: z.ZodObject<{
    targetOrg: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
}, {
    targetOrg: string;
}>;
export declare function listAgents(args: z.infer<typeof listAgentsSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=agents.d.ts.map