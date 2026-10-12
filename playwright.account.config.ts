import { defineConfig, devices } from '@playwright/test';
import base from './playwright.chat.config';
export default defineConfig({ ...base, testMatch: /account\.spec\.ts/, retries: 0, workers: 3, projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }], reporter: [['list']] });
