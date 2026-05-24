import { z } from 'zod';
import { execSync } from 'node:child_process';

// Wraps `sf agent trace list` and `sf agent trace read`, shipped in the
// Salesforce CLI on 2026-05-20. Trace files are auto-recorded for every
// `sf agent preview` session and capture per-turn actions, subagent
// navigation, and tool calls. See:
// https://github.com/forcedotcom/cli/blob/main/releasenotes/README.md

export const listTracesSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  agentApiName: z
    .string()
    .optional()
    .describe('Optional: only show traces for this published agent'),
  authoringBundle: z
    .string()
    .optional()
    .describe('Optional: only show traces for this authoring bundle (drafts)'),
});

export const readTraceSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  sessionId: z
    .string()
    .describe('Session ID to read the trace for (returned by start_session)'),
});

export async function listTraces(args: z.infer<typeof listTracesSchema>) {
  const flags = [`--target-org "${args.targetOrg}"`];
  if (args.agentApiName) flags.push(`--api-name "${args.agentApiName}"`);
  if (args.authoringBundle) flags.push(`--authoring-bundle "${args.authoringBundle}"`);

  try {
    const stdout = execSync(`sf agent trace list ${flags.join(' ')} --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return {
      content: [{ type: 'text' as const, text: stdout }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Failed to list traces. The 'sf agent trace' command requires Salesforce CLI from 2026-05-20 or later. Error: ${message}`,
        },
      ],
    };
  }
}

export async function readTrace(args: z.infer<typeof readTraceSchema>) {
  try {
    const stdout = execSync(
      `sf agent trace read --session-id "${args.sessionId}" --target-org "${args.targetOrg}" --json`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return {
      content: [{ type: 'text' as const, text: stdout }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Failed to read trace for session "${args.sessionId}". The 'sf agent trace' command requires Salesforce CLI from 2026-05-20 or later. Error: ${message}`,
        },
      ],
    };
  }
}
