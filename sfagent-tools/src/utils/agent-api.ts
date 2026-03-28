import { randomUUID } from 'node:crypto';
import type { AgentSession, ConversationMessage } from '../types/index.js';

const AGENT_API_BASE = '/einstein/ai-agent/v1';

export async function createSession(
  instanceUrl: string,
  accessToken: string,
  agentId: string
): Promise<AgentSession> {
  const externalSessionKey = randomUUID();

  const response = await fetch(
    `${instanceUrl}${AGENT_API_BASE}/agents/${agentId}/sessions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalSessionKey,
        bypassUser: false,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create agent session: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = (await response.json()) as { sessionId: string };

  return {
    sessionId: data.sessionId,
    agentId,
    orgAlias: '',
    sequenceId: 0,
    messages: [],
  };
}

export async function sendMessage(
  instanceUrl: string,
  accessToken: string,
  session: AgentSession,
  messageText: string
): Promise<{ response: string; session: AgentSession }> {
  const sequenceId = session.sequenceId + 1;

  // Use the streaming endpoint and consume SSE internally
  const response = await fetch(
    `${instanceUrl}${AGENT_API_BASE}/sessions/${session.sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        message: {
          sequenceId,
          type: 'Text',
          text: messageText,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  // Parse SSE stream and accumulate the response
  const agentResponse = await consumeSSEStream(response);

  const userMessage: ConversationMessage = {
    role: 'user',
    content: messageText,
    timestamp: new Date().toISOString(),
    sequenceId,
  };

  const agentMessage: ConversationMessage = {
    role: 'agent',
    content: agentResponse,
    timestamp: new Date().toISOString(),
    sequenceId,
  };

  const updatedSession: AgentSession = {
    ...session,
    sequenceId,
    messages: [...session.messages, userMessage, agentMessage],
  };

  return { response: agentResponse, session: updatedSession };
}

async function consumeSSEStream(response: Response): Promise<string> {
  const body = response.body;
  if (!body) {
    throw new Error('No response body received from streaming endpoint');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    accumulated += decoder.decode(value, { stream: true });

    // Parse SSE events from accumulated buffer
    const lines = accumulated.split('\n');
    accumulated = lines.pop() ?? ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr) as {
            type?: string;
            text?: string;
            message?: string;
          };

          // Accumulate text from TextChunk and Inform events
          if (event.type === 'TextChunk' && event.text) {
            fullResponse += event.text;
          } else if (event.type === 'Inform' && event.message) {
            // Inform contains the complete message -- use it if we haven't accumulated chunks
            if (!fullResponse) {
              fullResponse = event.message;
            }
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }
  }

  return fullResponse || '(no response from agent)';
}

export async function endSession(
  instanceUrl: string,
  accessToken: string,
  sessionId: string
): Promise<void> {
  const response = await fetch(
    `${instanceUrl}${AGENT_API_BASE}/sessions/${sessionId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text();
    throw new Error(`Failed to end session: ${response.status} ${response.statusText} - ${errorBody}`);
  }
}
