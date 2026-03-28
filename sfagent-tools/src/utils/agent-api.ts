import { execSync } from 'node:child_process';
import type { AgentSession, ConversationMessage } from '../types/index.js';

export async function createSession(
  targetOrg: string,
  agentApiName: string
): Promise<AgentSession> {
  const result = execSync(
    `sf agent preview start --api-name "${agentApiName}" --target-org "${targetOrg}" --json`,
    { encoding: 'utf-8', timeout: 60000 }
  );

  const parsed = JSON.parse(result) as {
    status: number;
    result: { sessionId: string };
  };

  if (!parsed.result?.sessionId) {
    throw new Error('No sessionId returned from sf agent preview start');
  }

  return {
    sessionId: parsed.result.sessionId,
    agentId: agentApiName,
    orgAlias: targetOrg,
    sequenceId: 0,
    messages: [],
  };
}

export async function sendMessage(
  targetOrg: string,
  agentApiName: string,
  session: AgentSession,
  messageText: string
): Promise<{ response: string; session: AgentSession }> {
  const sequenceId = session.sequenceId + 1;

  // Escape double quotes and backslashes in the message for the CLI
  const escapedMessage = messageText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const result = execSync(
    `sf agent preview send --session-id "${session.sessionId}" --api-name "${agentApiName}" --utterance "${escapedMessage}" --target-org "${targetOrg}" --json`,
    { encoding: 'utf-8', timeout: 120000 }
  );

  const parsed = JSON.parse(result) as {
    status: number;
    result: {
      messages: Array<{
        type: string;
        message: string;
        id?: string;
        feedbackId?: string;
        isContentSafe?: boolean;
      }>;
    };
  };

  const agentMessages = parsed.result?.messages ?? [];
  const responseText = agentMessages
    .filter((m) => m.type === 'Inform' && m.message)
    .map((m) => m.message)
    .join('\n\n');

  const userMessage: ConversationMessage = {
    role: 'user',
    content: messageText,
    timestamp: new Date().toISOString(),
    sequenceId,
  };

  const agentMessage: ConversationMessage = {
    role: 'agent',
    content: responseText || '(no response from agent)',
    timestamp: new Date().toISOString(),
    sequenceId,
  };

  const updatedSession: AgentSession = {
    ...session,
    sequenceId,
    messages: [...session.messages, userMessage, agentMessage],
  };

  return { response: responseText || '(no response from agent)', session: updatedSession };
}

export async function endSession(
  targetOrg: string,
  sessionId: string
): Promise<void> {
  try {
    execSync(
      `sf agent preview end --session-id "${sessionId}" --target-org "${targetOrg}" --json`,
      { encoding: 'utf-8', timeout: 30000 }
    );
  } catch {
    // Session may have already expired -- that's ok
  }
}
