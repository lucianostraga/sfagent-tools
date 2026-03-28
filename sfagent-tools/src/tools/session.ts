import { z } from 'zod';
import { getOrgConnection, isProductionOrg } from '../auth/sf-auth.js';
import { createSession, endSession as endAgentSession } from '../utils/agent-api.js';
import type { AgentSession } from '../types/index.js';

// In-memory session store (sessions are short-lived, per-conversation)
const activeSessions = new Map<string, { session: AgentSession; accessToken: string; instanceUrl: string }>();

export const startSessionSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  agentId: z.string().describe('18-character Salesforce Agent ID (from list_agents)'),
});

export const endSessionSchema = z.object({
  sessionId: z.string().describe('Session ID returned by start_session'),
});

export async function startSession(args: z.infer<typeof startSessionSchema>) {
  const isProd = await isProductionOrg(args.targetOrg);
  if (isProd) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '⚠️ BLOCKED: Refusing to start a test session against a PRODUCTION org. Use a sandbox or scratch org.',
        },
      ],
    };
  }

  const { accessToken, instanceUrl } = await getOrgConnection(args.targetOrg);

  const session = await createSession(instanceUrl, accessToken, args.agentId);
  session.orgAlias = args.targetOrg;

  activeSessions.set(session.sessionId, { session, accessToken, instanceUrl });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            sessionId: session.sessionId,
            agentId: session.agentId,
            targetOrg: args.targetOrg,
            status: 'active',
            message: 'Session started. Use send_message to converse with the agent.',
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function endSession(args: z.infer<typeof endSessionSchema>) {
  const entry = activeSessions.get(args.sessionId);

  if (!entry) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Session ${args.sessionId} not found. It may have already been ended.`,
        },
      ],
    };
  }

  try {
    await endAgentSession(entry.instanceUrl, entry.accessToken, args.sessionId);
  } catch {
    // Session may have already expired -- that's ok
  }

  const transcript = entry.session.messages;
  activeSessions.delete(args.sessionId);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            sessionId: args.sessionId,
            status: 'ended',
            totalMessages: transcript.length,
            transcript,
          },
          null,
          2
        ),
      },
    ],
  };
}

// Exported for use by messaging tool
export function getActiveSession(sessionId: string) {
  return activeSessions.get(sessionId);
}

export function updateActiveSession(sessionId: string, session: AgentSession) {
  const entry = activeSessions.get(sessionId);
  if (entry) {
    entry.session = session;
  }
}
