const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/viewports',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/viewports-report' }]],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  outputDir: 'tests/viewports-results',
});
