import { z } from 'zod';
import { sendMessage as sendAgentMessage } from '../utils/agent-api.js';
import { getActiveSession, updateActiveSession } from './session.js';
import { logUserMessage, logAgentResponse } from '../utils/live-transcript.js';
export const sendMessageSchema = z.object({
    sessionId: z.string().describe('Session ID from start_session'),
    message: z.string().describe('The message to send to the agent'),
});
export async function sendMessage(args) {
    const session = getActiveSession(args.sessionId);
    if (!session) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Session ${args.sessionId} not found. Call start_session first.`,
                },
            ],
        };
    }
    // Log to live transcript
    logUserMessage(args.message);
    const { response, session: updatedSession } = await sendAgentMessage(session.orgAlias, session.agentId, session, args.message);
    // Log agent response to live transcript
    logAgentResponse(response);
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