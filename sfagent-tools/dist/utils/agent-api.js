import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '../..');
export async function createSession(targetOrg, agentApiName) {
    const result = execSync(`sf agent preview start --api-name "${agentApiName}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 60000, cwd: PROJECT_DIR });
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
    let result;
    try {
        result = execSync(`sf agent preview send --session-id "${session.sessionId}" --api-name "${agentApiName}" --utterance "${escapedMessage}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 180000, cwd: PROJECT_DIR });
    }
    catch (err) {
        const error = err;
        // If we got stdout before timeout, try to use it
        if (error.stdout) {
            result = error.stdout;
        }
        else {
            throw new Error(`Agent did not respond within 3 minutes: ${error.message ?? 'timeout'}`);
        }
    }
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
        execSync(`sf agent preview end --session-id "${sessionId}" --target-org "${targetOrg}" --json`, { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_DIR });
    }
    catch {
        // Session may have already expired -- that's ok
    }
}
//# sourceMappingURL=agent-api.js.map