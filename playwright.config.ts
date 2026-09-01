import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/ultimate-tic-tac-toe/";
const operaExecutable = process.env.PLAYWRIGHT_OPERA_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  // Chromium and the minimax workers compete for the same CPU budget in the
  // Docker/Actions runners. Serial browser projects keep interaction timing
  // deterministic while the unit suite still runs in parallel.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    ...(operaExecutable
      ? [{
          name: "opera",
          use: {
            ...devices["Desktop Chrome"],
            launchOptions: { executablePath: operaExecutable },
          },
        }]
      : []),
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
