import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { AgentSession, ConversationMessage } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '../..');

export async function createSession(
  targetOrg: string,
  agentApiName: string
): Promise<AgentSession> {
  const result = execSync(
    `sf agent preview start --api-name "${agentApiName}" --target-org "${targetOrg}" --json`,
    { encoding: 'utf-8', timeout: 60000, cwd: PROJECT_DIR }
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

  let result: string;
  try {
    result = execSync(
      `sf agent preview send --session-id "${session.sessionId}" --api-name "${agentApiName}" --utterance "${escapedMessage}" --target-org "${targetOrg}" --json`,
      { encoding: 'utf-8', timeout: 180000, cwd: PROJECT_DIR }
    );
  } catch (err: unknown) {
    const error = err as { status?: number; stdout?: string; message?: string };
    // If we got stdout before timeout, try to use it
    if (error.stdout) {
      result = error.stdout;
    } else {
      throw new Error(`Agent did not respond within 3 minutes: ${error.message ?? 'timeout'}`);
    }
  }

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
      { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_DIR }
    );
  } catch {
    // Session may have already expired -- that's ok
  }
}
