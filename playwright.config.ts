import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000, // 2 minutes per test (increased from default 30s)
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000, // 30 seconds for actions like click, fill
  },
  projects: [
    // Setup project - runs first to authenticate
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Unauthenticated tests (public pages like TV display)
    {
      name: 'public',
      testMatch: /.*public.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated vendor tests (use saved auth state)
    {
      name: 'vendor-authenticated',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*public.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Use the auth state from setup
        storageState: 'playwright/.auth/vendor.json',
      },
      dependencies: ['setup'], // Run setup first
    },
  ],
  // webServer: { // Disabled - manually manage dev server
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  // },
});
