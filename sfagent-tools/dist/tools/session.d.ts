import { z } from 'zod';
import type { AgentSession } from '../types/index.js';
export declare const startSessionSchema: z.ZodObject<{
    targetOrg: z.ZodString;
    agentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
    agentId: string;
}, {
    targetOrg: string;
    agentId: string;
}>;
export declare const endSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare function startSession(args: z.infer<typeof startSessionSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function endSession(args: z.infer<typeof endSessionSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function getActiveSession(sessionId: string): {
    session: AgentSession;
    accessToken: string;
    instanceUrl: string;
} | undefined;
export declare function updateActiveSession(sessionId: string, session: AgentSession): void;
//# sourceMappingURL=session.d.ts.map