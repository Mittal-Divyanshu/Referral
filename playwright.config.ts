import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Referral flows mutate shared database state, so tests must not race
  // each other. Correctness over speed for this suite.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
