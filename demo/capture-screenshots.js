#!/usr/bin/env node
/**
 * Captures screenshots of the Agentforce Service Agent detail page.
 * Uses the direct agent URL and waits for full content to load.
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'recordings');
const TARGET_ORG = 'sfagent-dev';

function getOrgInfo() {
  const raw = execSync(`sf org display -o ${TARGET_ORG} --json`, { encoding: 'utf-8' });
  return JSON.parse(raw).result;
}

async function main() {
  const org = getOrgInfo();
  const base = org.instanceUrl;
  const frontdoor = `${base}/secur/frontdoor.jsp?sid=${org.accessToken}`;

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(frontdoor, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Go to agent list — wait longer for Lightning to fully render
  console.log('Agents list...');
  await page.goto(`${base}/lightning/setup/EinsteinCopilot/home`, {
    waitUntil: 'domcontentloaded', timeout: 60000,
  });
  await page.waitForTimeout(12000); // Give Lightning time
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ss-agents-list.png') });
  console.log('  ✓ ss-agents-list.png');

  // Click on the agent name in the table
  console.log('Clicking into agent...');
  let clicked = false;

  // Try clicking the link in the data table
  try {
    const link = page.locator('a').filter({ hasText: 'Agentforce Service Agent' }).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.click();
    clicked = true;
    console.log('  Clicked via link text');
  } catch (e) {
    console.log('  Link click failed:', e.message.substring(0, 80));
  }

  if (!clicked) {
    // Try the row
    try {
      const row = page.locator('tr').filter({ hasText: 'Agentforce Service Agent' }).first();
      await row.locator('a').first().click();
      clicked = true;
      console.log('  Clicked via table row');
    } catch (e) {
      console.log('  Row click failed:', e.message.substring(0, 80));
    }
  }

  if (!clicked) {
    console.log('  Navigating directly to agent builder...');
    // Try the agent builder URL directly
    await page.goto(
      `${base}/lightning/setup/EinsteinCopilot/page?address=%2F0XxDR000000Cgdd0AC%3Fview`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
  }

  // Wait for the agent detail page to load
  await page.waitForTimeout(15000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ss-agent-detail-1.png') });
  console.log('  ✓ ss-agent-detail-1.png');

  // Scroll to show topics
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ss-agent-detail-2.png') });
  console.log('  ✓ ss-agent-detail-2.png');

  // Scroll more
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ss-agent-detail-3.png') });
  console.log('  ✓ ss-agent-detail-3.png');

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
