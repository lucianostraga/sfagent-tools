import { execFile } from 'node:child_process';
import { getSfProjectDir } from './sf-project.js';

// Runs the Salesforce CLI without a shell. Every value (org alias, agent name, session id, the user's
// utterance) travels as its own argument, so nothing is ever interpreted by a shell.
export interface SfResult<T = unknown> {
  status: number;
  result?: T;
  message?: string;
  name?: string;
}

const SF_ENV = {
  ...process.env,
  NO_COLOR: '1',
  FORCE_COLOR: '0',
  SF_DISABLE_AUTOUPDATE: 'true',
  SF_AUTOUPDATE_DISABLE: 'true',
};

// The CLI can print warnings before its JSON; read from the first brace.
export function parseSfJson<T>(stdout: string): SfResult<T> {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error(`The Salesforce CLI returned no JSON: ${stdout.slice(0, 200)}`);
  return JSON.parse(stdout.slice(start)) as SfResult<T>;
}

export function runSf<T = unknown>(args: string[], timeoutMs: number): Promise<SfResult<T>> {
  const fullArgs = args.includes('--json') ? args : [...args, '--json'];
  return new Promise((resolve, reject) => {
    execFile(
      'sf',
      fullArgs,
      { cwd: getSfProjectDir(), env: SF_ENV, timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' },
      (error, stdout) => {
        // sf exits non-zero on command errors but still prints a JSON error object on stdout.
        if (stdout && stdout.includes('{')) {
          try {
            resolve(parseSfJson<T>(stdout));
            return;
          } catch {
            // fall through to the process error
          }
        }
        reject(error ?? new Error('The Salesforce CLI returned no output'));
      }
    );
  });
}

// Throws with the CLI's own message when the command failed.
export async function runSfOk<T = unknown>(args: string[], timeoutMs: number): Promise<T> {
  const out = await runSf<T>(args, timeoutMs);
  if (out.status !== 0 || out.result === undefined) {
    throw new Error(out.message ?? `sf ${args.slice(0, 3).join(' ')} failed (status ${out.status})`);
  }
  return out.result;
}
