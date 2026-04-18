#!/usr/bin/env node
/**
 * Records a Playwright video of the Salesforce scratch org,
 * navigating to the Agentforce agent setup to prove it exists.
 * Uses sf CLI frontdoor URL for passwordless login.
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'recordings');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TARGET_ORG = process.env.TARGET_ORG || 'sfagent-dev';

function getOrgInfo() {
  const raw = execSync(`sf org display -o ${TARGET_ORG} --json`, { encoding: 'utf-8' });
  const { result } = JSON.parse(raw);
  return {
    instanceUrl: result.instanceUrl,
    accessToken: result.accessToken,
  };
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Getting org credentials...');
  const { instanceUrl, accessToken } = getOrgInfo();
  const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;

  console.log(`Org: ${instanceUrl}`);
  console.log('Launching browser...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  try {
    // Step 1: Login via frontdoor
    console.log('Logging into Salesforce...');
    await page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(5000);

    // Step 2: Navigate to Setup
    console.log('Navigating to Setup...');
    await page.goto(`${instanceUrl}/lightning/setup/SetupOneHome/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await wait(6000);

    // Step 3: Navigate to Einstein Agents (Agentforce)
    console.log('Navigating to Agents...');
    await page.goto(
      `${instanceUrl}/lightning/setup/EinsteinCopilot/home`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    await wait(8000);

    // Take a screenshot for reference
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'agents-list.png') });
    console.log('Screenshot: agents-list.png');

    // Step 4: Click on the Agentforce Service Agent to show details
    console.log('Looking for Agentforce Service Agent...');
    const agentLink = page.locator('a', { hasText: 'Agentforce Service Agent' }).first();
    if (await agentLink.isVisible({ timeout: 5000 })) {
      await agentLink.click();
      await wait(5000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'agent-detail.png') });
      console.log('Screenshot: agent-detail.png');

      // Step 5: Scroll through topics
      console.log('Scrolling through agent topics...');
      await page.mouse.wheel(0, 300);
      await wait(2000);
      await page.mouse.wheel(0, 300);
      await wait(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'agent-topics.png') });
      console.log('Screenshot: agent-topics.png');

      // Step 6: Scroll back up slowly for visual effect
      await page.mouse.wheel(0, -200);
      await wait(1500);
    } else {
      console.log('Agent link not found, trying alternative navigation...');
      // Try direct URL pattern
      await page.goto(
        `${instanceUrl}/lightning/setup/EinsteinCopilot/page?address=%2F0XxDR000000Cgdd0AC`,
        { waitUntil: 'domcontentloaded', timeout: 60000 }
      );
      await wait(4000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'agent-detail-alt.png') });
    }

    // Final pause to capture the full view
    await wait(3000);

    console.log('Salesforce recording complete.');
  } catch (err) {
    console.error('Error during recording:', err.message);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error.png') });
  } finally {
    await context.close();
    await browser.close();
  }

  // Find the recorded video file
  const videos = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videos.length > 0) {
    const videoPath = path.join(OUTPUT_DIR, videos[videos.length - 1]);
    const finalPath = path.join(OUTPUT_DIR, 'salesforce-org.webm');
    fs.renameSync(videoPath, finalPath);
    console.log(`Video saved: ${finalPath}`);
  }
}

main().catch(console.error);
