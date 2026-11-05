import { defineConfig, devices } from '@playwright/test';

// Production preview: vite build + vite preview.
const PORT = 4173;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    colorScheme: 'light',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  // Overrides go AFTER the device spread, or the device preset wins.
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
    { name: 'ipad-landscape', use: { ...devices['iPad Pro 11 landscape'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
});
