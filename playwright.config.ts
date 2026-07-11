import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import os from "node:os";

const baseURL = process.env.E2E_BASE_URL ?? "http://101.37.33.184";

const chromiumExecutable = path.join(
  os.homedir(),
  "AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe"
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "e2e-report" }],
    ["json", { outputFile: "e2e-report/results.json" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "zh-CN",
    launchOptions: {
      executablePath: chromiumExecutable,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
