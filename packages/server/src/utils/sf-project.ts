import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// `sf agent` subcommands (preview, trace, test) require a Salesforce DX
// project directory. The MCP server is installed via npm and the user's
// working dir might not be a Salesforce project. We materialize a minimal
// sfdx-project.json in a stable temp dir and use it as cwd for sf commands.
export function getSfProjectDir(): string {
  const dir = join(tmpdir(), 'sfagent-tools-mcp-sfdx');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'sfdx-project.json'),
      JSON.stringify(
        {
          packageDirectories: [{ path: 'force-app', default: true }],
          namespace: '',
          sfdcLoginUrl: 'https://login.salesforce.com',
          sourceApiVersion: '66.0',
        },
        null,
        2
      )
    );
    mkdirSync(join(dir, 'force-app'), { recursive: true });
  }
  return dir;
}
