import { z } from 'zod';
export declare const getAgentMetadataSchema: z.ZodObject<{
    targetOrg: z.ZodString;
    agentApiName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
    agentApiName: string;
}, {
    targetOrg: string;
    agentApiName: string;
}>;
export declare function getAgentMetadata(args: z.infer<typeof getAgentMetadataSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=agent-metadata.d.ts.map