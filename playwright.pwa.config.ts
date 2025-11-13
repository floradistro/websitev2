import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for PWA Testing
 *
 * This config tests the app in true PWA standalone mode,
 * simulating real iOS and Android device behavior.
 */
export default defineConfig({
  testDir: "./tests/pwa",
  testMatch: "**/*.pwa.spec.ts",
  fullyParallel: false, // PWA tests need to run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for PWA tests
  reporter: [
    ["html", { outputFolder: "playwright-report/pwa" }],
    ["list"],
  ],
  timeout: 60000, // 60 seconds per test (PWA needs time for SW registration)
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "pwa-ios",
      use: {
        ...devices["iPhone 13 Pro"],
        // Simulate iOS PWA standalone mode
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        hasTouch: true,
        isMobile: true,
        // Enable service workers
        serviceWorkers: "allow",
      },
    },
    {
      name: "pwa-android",
      use: {
        ...devices["Pixel 5"],
        // Simulate Android Chrome PWA
        viewport: { width: 393, height: 851 },
        userAgent:
          "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        hasTouch: true,
        isMobile: true,
        // Enable service workers
        serviceWorkers: "allow",
      },
    },
    {
      name: "pwa-tablet",
      use: {
        ...devices["iPad Pro"],
        // Simulate iPad PWA
        viewport: { width: 1024, height: 1366 },
        hasTouch: true,
        isMobile: false,
        serviceWorkers: "allow",
      },
    },
  ],

  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for build + start
  },
});
