import { test as base, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { AgentforcePanel } from './agentforce-panel';

// Logs into the org with a one-time frontdoor URL from the sf CLI. The URL carries a session id,
// so it is never printed, logged or stored. Target org: SF_TARGET_ORG, or the project's default.
function frontdoorUrl(path: string): string {
  const args = ['org', 'open', '--url-only', '--path', path, '--json'];
  if (process.env.SF_TARGET_ORG) args.push('--target-org', process.env.SF_TARGET_ORG);
  // Playwright forces color in child processes; sf would then wrap its JSON in color codes.
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', SF_DISABLE_AUTOUPDATE: 'true' };
  const out = execFileSync('sf', args, { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out.slice(out.indexOf('{'))).result.url;
}

export const test = base.extend<{ lightningHome: Page; agentforce: AgentforcePanel }>({
  lightningHome: async ({ page }, use) => {
    await page.goto(frontdoorUrl('lightning/page/home'), { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/lightning\//);
    await use(page);
  },
  agentforce: async ({ lightningHome }, use) => {
    const panel = new AgentforcePanel(lightningHome);
    await panel.open();
    await use(panel);
  },
});

export { expect } from '@playwright/test';
