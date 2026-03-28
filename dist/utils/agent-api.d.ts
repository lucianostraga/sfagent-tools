import type { AgentSession } from '../types/index.js';
export declare function createSession(targetOrg: string, agentApiName: string): Promise<AgentSession>;
export declare function sendMessage(targetOrg: string, agentApiName: string, session: AgentSession, messageText: string): Promise<{
    response: string;
    session: AgentSession;
}>;
export declare function endSession(targetOrg: string, sessionId: string): Promise<void>;
//# sourceMappingURL=agent-api.d.ts.map