import { z } from 'zod';
import { isProductionOrg } from '../auth/sf-auth.js';
import { createSession, endSession as endAgentSession } from '../utils/agent-api.js';
import { startLiveTranscript, logScenarioStart, getLiveTranscriptPath } from '../utils/live-transcript.js';
// In-memory session store (sessions are short-lived, per-conversation)
const activeSessions = new Map();
export const startSessionSchema = z.object({
    targetOrg: z.string().describe('Org alias or username'),
    agentApiName: z.string().describe('API name of the agent (from list_agents, e.g. "Agentforce_Service_Agent")'),
    scenarioName: z.string().optional().describe('Optional: name of the test scenario (for live transcript logging)'),
});
export const endSessionSchema = z.object({
    sessionId: z.string().describe('Session ID returned by start_session'),
    scenarioResult: z.enum(['pass', 'fail', 'error']).optional().describe('Optional: result of this scenario for live transcript'),
    scenarioNote: z.string().optional().describe('Optional: note about the result'),
});
export async function startSession(args) {
    const isProd = await isProductionOrg(args.targetOrg);
    if (isProd) {
        return {
            content: [
                {
                    type: 'text',
                    text: '⚠️ BLOCKED: Refusing to start a test session against a PRODUCTION org. Use a sandbox or scratch org.',
                },
            ],
        };
    }
    // Initialize live transcript if this is the first session
    let liveTranscriptPath = getLiveTranscriptPath();
    if (!liveTranscriptPath) {
        liveTranscriptPath = startLiveTranscript(args.agentApiName, args.targetOrg);
    }
    // Log scenario start if name provided
    if (args.scenarioName) {
        logScenarioStart(args.scenarioName);
    }
    const session = await createSession(args.targetOrg, args.agentApiName);
    activeSessions.set(session.sessionId, session);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    sessionId: session.sessionId,
                    agentApiName: session.agentId,
                    targetOrg: args.targetOrg,
                    status: 'active',
                    liveTranscript: liveTranscriptPath,
                    message: 'Session started. Use send_message to converse with the agent. Live transcript is being written to the file above -- open it in a split pane to watch.',
                }, null, 2),
            },
        ],
    };
}
export async function endSession(args) {
    const session = activeSessions.get(args.sessionId);
    if (!session) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Session ${args.sessionId} not found. It may have already been ended.`,
                },
            ],
        };
    }
    await endAgentSession(session.orgAlias, args.sessionId);
    // Log scenario result if provided
    if (args.scenarioResult) {
        const { logScenarioResult } = await import('../utils/live-transcript.js');
        logScenarioResult(args.scenarioResult, args.scenarioNote ?? '');
    }
    const transcript = session.messages;
    activeSessions.delete(args.sessionId);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    sessionId: args.sessionId,
                    status: 'ended',
                    totalMessages: transcript.length,
                    transcript,
                }, null, 2),
            },
        ],
    };
}
// Exported for use by messaging tool
export function getActiveSession(sessionId) {
    return activeSessions.get(sessionId);
}
export function updateActiveSession(sessionId, session) {
    activeSessions.set(sessionId, session);
}
//# sourceMappingURL=session.js.map