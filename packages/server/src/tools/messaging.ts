import { z } from 'zod';
import { sendMessage as sendAgentMessage } from '../utils/agent-api.js';
import { getActiveSession, updateActiveSession } from './session.js';
import { logUserMessage, logAgentResponse } from '../utils/live-transcript.js';

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

  // Log to live transcript
  logUserMessage(args.message);

  const { response, rendersUi, session: updatedSession } = await sendAgentMessage(
    session.orgAlias,
    session,
    args.message
  );

  // Log agent response to live transcript
  logAgentResponse(response);

  updateActiveSession(args.sessionId, updatedSession);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            userMessage: args.message,
            agentResponse: response,
            ...(rendersUi.length > 0 && {
              rendersUi,
              uiNote:
                'The agent asked for input through a Custom Lightning Type editor. A real user sees a form here that a ' +
                'headless session cannot render: test it in the browser with the agentforce-ui-test skill.',
            }),
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
