import type { AgentSession } from '../types/index.js';
export declare function createSession(instanceUrl: string, accessToken: string, agentId: string): Promise<AgentSession>;
export declare function sendMessage(instanceUrl: string, accessToken: string, session: AgentSession, messageText: string): Promise<{
    response: string;
    session: AgentSession;
}>;
export declare function endSession(instanceUrl: string, accessToken: string, sessionId: string): Promise<void>;
//# sourceMappingURL=agent-api.d.ts.map