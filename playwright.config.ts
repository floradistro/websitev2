import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
