import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
const cache = path.join(os.homedir(), "AppData/Local/ms-playwright");
const installed = fs.existsSync(cache) ? fs.readdirSync(cache).filter(p => /^chromium-\d+$/.test(p)).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1])) : [];
const executablePath = installed.map(p => path.join(cache, p, "chrome-win64/chrome.exe")).find(p => fs.existsSync(p));
export default defineConfig({
  testDir: "./e2e", testMatch: /ledger-chat\.spec\.ts/, fullyParallel: true,
  timeout: 30000, reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report/chat" }]],
  use: { baseURL: "http://127.0.0.1:5177", locale: "zh-CN", screenshot: "only-on-failure", trace: "retain-on-failure", launchOptions: executablePath ? { executablePath } : {} },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5177", url: "http://127.0.0.1:5177", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
