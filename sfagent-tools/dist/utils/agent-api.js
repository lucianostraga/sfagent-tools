import { execSync } from 'node:child_process';
export async function createSession(targetOrg, agentApiName) {
    const result = execSync(`sf agent preview start --api-name "${agentApiName}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 60000 });
    const parsed = JSON.parse(result);
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
export async function sendMessage(targetOrg, agentApiName, session, messageText) {
    const sequenceId = session.sequenceId + 1;
    // Escape double quotes and backslashes in the message for the CLI
    const escapedMessage = messageText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const result = execSync(`sf agent preview send --session-id "${session.sessionId}" --api-name "${agentApiName}" --utterance "${escapedMessage}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 120000 });
    const parsed = JSON.parse(result);
    const agentMessages = parsed.result?.messages ?? [];
    const responseText = agentMessages
        .filter((m) => m.type === 'Inform' && m.message)
        .map((m) => m.message)
        .join('\n\n');
    const userMessage = {
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
        sequenceId,
    };
    const agentMessage = {
        role: 'agent',
        content: responseText || '(no response from agent)',
        timestamp: new Date().toISOString(),
        sequenceId,
    };
    const updatedSession = {
        ...session,
        sequenceId,
        messages: [...session.messages, userMessage, agentMessage],
    };
    return { response: responseText || '(no response from agent)', session: updatedSession };
}
export async function endSession(targetOrg, sessionId) {
    try {
        execSync(`sf agent preview end --session-id "${sessionId}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 30000 });
    }
    catch {
        // Session may have already expired -- that's ok
    }
}
//# sourceMappingURL=agent-api.js.map