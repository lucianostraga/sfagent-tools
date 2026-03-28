import { writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const REPORT_DIR = 'sfagent-reports';
const LIVE_FILE = 'live-conversation.md';
let livePath = null;
let scenarioCount = 0;
let currentScenario = '';
function ensureDir() {
    // Write to the current working directory (user's project)
    const dir = join(process.cwd(), REPORT_DIR);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return dir;
}
export function startLiveTranscript(agentName, orgAlias) {
    const dir = ensureDir();
    livePath = join(dir, LIVE_FILE);
    scenarioCount = 0;
    currentScenario = '';
    const header = `# SFAgent Tools — Live Test Conversation

**Agent**: ${agentName}
**Org**: ${orgAlias}
**Started**: ${new Date().toISOString()}

> This file updates in real-time as tests run. Open it in a split pane to watch.

---

`;
    writeFileSync(livePath, header);
    return livePath;
}
export function logScenarioStart(name) {
    if (!livePath)
        return;
    scenarioCount++;
    currentScenario = name;
    const entry = `\n## Scenario ${scenarioCount}: ${name}\n\n`;
    appendToLive(entry);
}
export function logUserMessage(message) {
    if (!livePath)
        return;
    const entry = `**👤 User**: ${message}\n\n`;
    appendToLive(entry);
}
export function logAgentResponse(response) {
    if (!livePath)
        return;
    const entry = `**🤖 Agent**: ${response}\n\n`;
    appendToLive(entry);
}
export function logScenarioResult(result, note) {
    if (!livePath)
        return;
    const icon = result === 'pass' ? '✅' : result === 'fail' ? '❌' : '⚠️';
    const entry = `> ${icon} **${result.toUpperCase()}**: ${note}\n\n---\n`;
    appendToLive(entry);
}
export function logError(error) {
    if (!livePath)
        return;
    const entry = `> ⚠️ **ERROR**: ${error}\n\n---\n`;
    appendToLive(entry);
}
export function endLiveTranscript(summary) {
    if (!livePath)
        return;
    const entry = `\n## Summary

| Metric | Count |
|---|---|
| Total scenarios | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Errors | ${summary.errors} |

**Completed**: ${new Date().toISOString()}
`;
    appendToLive(entry);
    livePath = null;
}
function appendToLive(content) {
    if (!livePath)
        return;
    try {
        appendFileSync(livePath, content);
    }
    catch {
        // File write failed -- don't break the test
    }
}
export function getLiveTranscriptPath() {
    return livePath;
}
//# sourceMappingURL=live-transcript.js.map