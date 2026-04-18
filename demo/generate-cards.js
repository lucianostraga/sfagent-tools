#!/usr/bin/env node
/**
 * Generates title card and end card videos using Playwright.
 * Avoids ffmpeg drawtext filter dependency.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'recordings');

async function createCard(filename, html, durationMs) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  const htmlPath = path.join(OUTPUT_DIR, `${filename}.html`);
  fs.writeFileSync(htmlPath, html);
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(durationMs);
  await context.close();
  await browser.close();

  // Find and rename the video
  const videos = fs.readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith('page@') && f.endsWith('.webm'))
    .sort()
    .reverse();
  if (videos.length > 0) {
    const src = path.join(OUTPUT_DIR, videos[0]);
    const dest = path.join(OUTPUT_DIR, `${filename}.webm`);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
    console.log(`  Created: ${dest}`);
  }
}

const titleHTML = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body {
    background: #1e1e2e;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  }
  .container { text-align: center; }
  .title {
    color: #89b4fa;
    font-size: 72px;
    font-weight: 700;
    margin-bottom: 20px;
    animation: fadeIn 1s ease-in;
  }
  .subtitle {
    color: #cdd6f4;
    font-size: 36px;
    font-weight: 400;
    margin-bottom: 16px;
    animation: fadeIn 1.5s ease-in;
  }
  .tagline {
    color: #a6adc8;
    font-size: 24px;
    animation: fadeIn 2s ease-in;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style></head>
<body>
<div class="container">
  <div class="title">SFAgent Tools</div>
  <div class="subtitle">MCP Plugin for Claude Code</div>
  <div class="tagline">Automated Agentforce Testing</div>
</div>
</body></html>`;

const endHTML = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body {
    background: #1e1e2e;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  }
  .container { text-align: center; }
  .title {
    color: #89b4fa;
    font-size: 60px;
    font-weight: 700;
    margin-bottom: 24px;
  }
  .cta {
    color: #a6e3a1;
    font-size: 32px;
    margin-bottom: 16px;
  }
  .footer {
    color: #cdd6f4;
    font-size: 24px;
  }
</style></head>
<body>
<div class="container">
  <div class="title">SFAgent Tools</div>
  <div class="cta">Available on Claude Code Marketplace</div>
  <div class="footer">Install today &amp; automate your agent testing</div>
</div>
</body></html>`;

async function main() {
  console.log('Generating title card...');
  await createCard('title-card', titleHTML, 5000);
  console.log('Generating end card...');
  await createCard('end-card', endHTML, 5000);
  console.log('Done!');
}

main().catch(console.error);
