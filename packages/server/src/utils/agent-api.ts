import { runSf, runSfOk } from './sf.js';
import type { AgentSession, ConversationMessage, SessionOptions } from '../types/index.js';

// Arguments that identify the agent: a published agent (--api-name) or a local authoring bundle.
function agentArgs(session: Pick<AgentSession, 'agentId' | 'authoringBundle'>): string[] {
  return session.authoringBundle ? ['--authoring-bundle', session.agentId] : ['--api-name', session.agentId];
}

export function buildPreviewStartArgs(targetOrg: string, agentApiName: string, opts: SessionOptions = {}): string[] {
  const args = ['agent', 'preview', 'start', '--target-org', targetOrg];
  if (opts.authoringBundle) {
    // Authoring bundles need an explicit mode; simulated actions are the safe default.
    args.push('--authoring-bundle', agentApiName, opts.liveActions ? '--use-live-actions' : '--simulate-actions');
  } else {
    // Published agents always run their actions for real.
    args.push('--api-name', agentApiName);
  }
  if (opts.contextVariables && opts.contextVariables.length > 0) {
    args.push('--context-variables-json', JSON.stringify(opts.contextVariables));
  }
  return args;
}

export async function createSession(
  targetOrg: string,
  agentApiName: string,
  opts: SessionOptions = {}
): Promise<AgentSession> {
  const result = await runSfOk<{ sessionId: string }>(buildPreviewStartArgs(targetOrg, agentApiName, opts), 120_000);
  if (!result.sessionId) {
    throw new Error('No sessionId returned from sf agent preview start');
  }
  return {
    sessionId: result.sessionId,
    agentId: agentApiName,
    orgAlias: targetOrg,
    authoringBundle: opts.authoringBundle ?? false,
    sequenceId: 0,
    messages: [],
  };
}

interface PreviewMessage {
  type: string;
  message?: string;
  collect?: Array<{ targetType?: string; targetProperty?: string }>;
}

// Turns the agent's messages into one text. Any message type with text counts (Inform, Inquire, ...).
// When the agent asks for input through a Custom Lightning Type editor, the user would see a form that a
// headless session cannot render: say so instead of hiding it.
export function summarizeAgentMessages(messages: PreviewMessage[]): { text: string; rendersUi: string[] } {
  const text = messages
    .filter((m) => m.message)
    .map((m) => m.message as string)
    .join('\n\n');
  const rendersUi = messages
    .flatMap((m) => m.collect ?? [])
    .map((c) => `${c.targetType ?? 'unknown'}${c.targetProperty ? ` (${c.targetProperty})` : ''}`);
  return { text, rendersUi };
}

export async function sendMessage(
  targetOrg: string,
  session: AgentSession,
  messageText: string
): Promise<{ response: string; rendersUi: string[]; session: AgentSession }> {
  const sequenceId = session.sequenceId + 1;
  const out = await runSf<{ messages?: PreviewMessage[] }>(
    ['agent', 'preview', 'send', '--session-id', session.sessionId, ...agentArgs(session),
      '--utterance', messageText, '--target-org', targetOrg],
    180_000
  );
  if (out.status !== 0) {
    throw new Error(out.message ?? 'The agent did not respond');
  }

  const { text, rendersUi } = summarizeAgentMessages(out.result?.messages ?? []);
  const response = text || '(no response from agent)';
  const now = new Date().toISOString();
  const userMessage: ConversationMessage = { role: 'user', content: messageText, timestamp: now, sequenceId };
  const agentMessage: ConversationMessage = { role: 'agent', content: response, timestamp: now, sequenceId };

  return {
    response,
    rendersUi,
    session: { ...session, sequenceId, messages: [...session.messages, userMessage, agentMessage] },
  };
}

export async function endSession(targetOrg: string, session: AgentSession): Promise<void> {
  try {
    await runSf(['agent', 'preview', 'end', '--session-id', session.sessionId, ...agentArgs(session),
      '--target-org', targetOrg], 60_000);
  } catch {
    // The session may have already expired: that's ok.
  }
}
