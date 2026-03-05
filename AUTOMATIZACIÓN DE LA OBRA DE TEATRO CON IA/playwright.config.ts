// Este archivo es usado por Playwright CLI pero nuestros tests usan Cucumber + Playwright
// La importación abajo puede marcar error en VS Code pero funciona correctamente en CLI
// @ts-ignore
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    headless: false,
    actionTimeout: 0,
    navigationTimeout: 30 * 1000,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
