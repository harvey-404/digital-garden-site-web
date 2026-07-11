import { test as base, expect, type Page } from "@playwright/test";
import { adminUser, requireAdminPassword } from "../helpers/env";

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("用户名").fill(adminUser);
  await page.getByPlaceholder("密码").fill(requireAdminPassword());
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "概览" })).toBeVisible();
}

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
