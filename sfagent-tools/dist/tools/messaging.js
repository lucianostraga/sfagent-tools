import { z } from 'zod';
import { sendMessage as sendAgentMessage } from '../utils/agent-api.js';
import { getActiveSession, updateActiveSession } from './session.js';
export const sendMessageSchema = z.object({
    sessionId: z.string().describe('Session ID from start_session'),
    message: z.string().describe('The message to send to the agent'),
});
export async function sendMessage(args) {
    const entry = getActiveSession(args.sessionId);
    if (!entry) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Session ${args.sessionId} not found. Call start_session first.`,
                },
            ],
        };
    }
    const { response, session: updatedSession } = await sendAgentMessage(entry.instanceUrl, entry.accessToken, entry.session, args.message);
    updateActiveSession(args.sessionId, updatedSession);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    userMessage: args.message,
                    agentResponse: response,
                    sequenceId: updatedSession.sequenceId,
                    totalMessagesInSession: updatedSession.messages.length,
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=messaging.js.map