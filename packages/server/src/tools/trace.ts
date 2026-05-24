import { z } from 'zod';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getSfProjectDir } from '../utils/sf-project.js';

// Wraps `sf agent trace list` and `sf agent trace read`, shipped in the
// Salesforce CLI on 2026-05-20. Trace files are auto-recorded LOCALLY for
// every `sf agent preview` session (in the SFDX project's .sfdx/agents/
// directory). They are NOT fetched from the org — the commands don't take
// --target-org. See:
// https://github.com/forcedotcom/cli/blob/main/releasenotes/README.md
//
// Salesforce CLI 2.135 has a known bug: `sf agent trace read` throws
// TraceParseError on empty trace files (which happen for sessions that
// didn't invoke actions). We fall back to reading the raw JSON files
// directly so the tool still returns something useful.

export const listTracesSchema = z.object({
  agentApiName: z
    .string()
    .optional()
    .describe('Optional: only show traces for this agent (matches the API name used in start_session)'),
  sessionId: z
    .string()
    .optional()
    .describe('Optional: only show the trace for this specific session'),
  since: z
    .string()
    .optional()
    .describe('Optional: only show traces recorded on or after this date (ISO format)'),
});

export const readTraceSchema = z.object({
  sessionId: z
    .string()
    .describe('Session ID to read the trace for (returned by start_session)'),
  format: z
    .enum(['summary', 'detail', 'raw'])
    .optional()
    .describe('Output level of detail. Default: summary'),
  dimension: z
    .enum(['actions', 'grounding', 'routing', 'errors'])
    .optional()
    .describe('Optional: when format=detail, drill into one dimension'),
  turn: z
    .number()
    .int()
    .optional()
    .describe('Optional: only show the trace for one conversation turn (1-based)'),
});

export async function listTraces(args: z.infer<typeof listTracesSchema>) {
  const flags: string[] = [];
  if (args.agentApiName) flags.push(`--agent "${args.agentApiName}"`);
  if (args.sessionId) flags.push(`--session-id "${args.sessionId}"`);
  if (args.since) flags.push(`--since "${args.since}"`);

  try {
    const stdout = execSync(`sf agent trace list ${flags.join(' ')} --json`, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: getSfProjectDir(),
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
          text: `Failed to list traces. The 'sf agent trace' command requires Salesforce CLI from 2026-05-20 or later, and traces are only available for sessions started by this MCP server. Error: ${message}`,
        },
      ],
    };
  }
}

function findTraceFilesForSession(sessionId: string): string[] {
  const agentsDir = join(getSfProjectDir(), '.sfdx', 'agents');
  if (!existsSync(agentsDir)) return [];

  const matches: string[] = [];
  for (const agentId of readdirSync(agentsDir)) {
    const sessionDir = join(agentsDir, agentId, 'sessions', sessionId, 'traces');
    if (existsSync(sessionDir)) {
      for (const f of readdirSync(sessionDir)) {
        if (f.endsWith('.json')) matches.push(join(sessionDir, f));
      }
    }
  }
  return matches;
}

export async function readTrace(args: z.infer<typeof readTraceSchema>) {
  const flags: string[] = [`--session-id "${args.sessionId}"`];
  if (args.format) flags.push(`--format ${args.format}`);
  if (args.dimension) flags.push(`--dimension ${args.dimension}`);
  if (args.turn !== undefined) flags.push(`--turn ${args.turn}`);

  // 1. Try sf CLI first
  try {
    const stdout = execSync(`sf agent trace read ${flags.join(' ')} --json`, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: getSfProjectDir(),
    });
    return {
      content: [{ type: 'text' as const, text: stdout }],
    };
  } catch {
    // sf CLI failed (typically TraceParseError on empty files).
    // Fall back to reading the raw JSON files directly.
  }

  // 2. Fallback: read trace files from disk
  const files = findTraceFilesForSession(args.sessionId);
  if (files.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No trace files found for session "${args.sessionId}". Sessions only have traces if they were started by this MCP server (start_session) and ran on a Salesforce CLI from 2026-05-20 or later.`,
        },
      ],
    };
  }

  const traces = files.map((path) => {
    const stat = statSync(path);
    let content: unknown = null;
    try {
      const raw = readFileSync(path, 'utf-8');
      content = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      content = null;
    }
    return {
      file: path,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      content,
      isEmpty: stat.size <= 2,
    };
  });

  const emptyCount = traces.filter((t) => t.isEmpty).length;
  const note =
    emptyCount === traces.length
      ? 'All trace files are empty. This usually means the agent did not invoke any actions during this session (e.g. it only asked for verification or refused the request). To capture richer traces, run a conversation that triggers actions like order lookups, case creation, or knowledge searches.'
      : `${emptyCount}/${traces.length} trace files are empty.`;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            sessionId: args.sessionId,
            traceFileCount: traces.length,
            note,
            traces,
          },
          null,
          2
        ),
      },
    ],
  };
}
