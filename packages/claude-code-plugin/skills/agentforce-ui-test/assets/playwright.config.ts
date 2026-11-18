import { defineConfig } from '@playwright/test';

// UI tests for what the agent renders. They log in with a fresh frontdoor URL on every run
// (sf org open --url-only), so no session is ever written to disk.
export default defineConfig({
  testDir: './tests/ui',
  timeout: 240_000,
  expect: { timeout: 120_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'results/ui/junit.xml' }],
    ['html', { outputFolder: 'results/ui/html', open: 'never' }],
  ],
  use: {
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
