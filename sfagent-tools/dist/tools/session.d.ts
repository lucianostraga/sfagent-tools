import { z } from 'zod';
import type { AgentSession } from '../types/index.js';
export declare const startSessionSchema: z.ZodObject<{
    targetOrg: z.ZodString;
    agentApiName: z.ZodString;
    scenarioName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    targetOrg: string;
    agentApiName: string;
    scenarioName?: string | undefined;
}, {
    targetOrg: string;
    agentApiName: string;
    scenarioName?: string | undefined;
}>;
export declare const endSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    scenarioResult: z.ZodOptional<z.ZodEnum<["pass", "fail", "error"]>>;
    scenarioNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    scenarioResult?: "pass" | "fail" | "error" | undefined;
    scenarioNote?: string | undefined;
}, {
    sessionId: string;
    scenarioResult?: "pass" | "fail" | "error" | undefined;
    scenarioNote?: string | undefined;
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
export declare function getActiveSession(sessionId: string): AgentSession | undefined;
export declare function updateActiveSession(sessionId: string, session: AgentSession): void;
//# sourceMappingURL=session.d.ts.map