import { z } from 'zod';
import { sendMessage as sendAgentMessage } from '../utils/agent-api.js';
import { getActiveSession, updateActiveSession } from './session.js';

export const sendMessageSchema = z.object({
  sessionId: z.string().describe('Session ID from start_session'),
  message: z.string().describe('The message to send to the agent'),
});

export async function sendMessage(args: z.infer<typeof sendMessageSchema>) {
  const session = getActiveSession(args.sessionId);

  if (!session) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Session ${args.sessionId} not found. Call start_session first.`,
        },
      ],
    };
  }

  const { response, session: updatedSession } = await sendAgentMessage(
    session.orgAlias,
    session.agentId,
    session,
    args.message
  );

  updateActiveSession(args.sessionId, updatedSession);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            userMessage: args.message,
            agentResponse: response,
            sequenceId: updatedSession.sequenceId,
            totalMessagesInSession: updatedSession.messages.length,
          },
          null,
          2
        ),
      },
    ],
  };
}
