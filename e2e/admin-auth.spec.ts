import { test, expect } from "@playwright/test";
import { adminUser } from "./helpers/env";

test.describe("后台鉴权", () => {
  test("TC-AUTH-001: 未登录访问 /admin 重定向登录页", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "后台登录" })).toBeVisible();
  });

  test("TC-AUTH-002: 错误密码无法登录", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("用户名").fill(adminUser);
    await page.getByPlaceholder("密码").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("TC-AUTH-003: 正确密码登录成功", async ({ page }) => {
    const { requireAdminPassword } = await import("./helpers/env");
    await page.goto("/admin/login");
    await page.getByPlaceholder("用户名").fill(adminUser);
    await page.getByPlaceholder("密码").fill(requireAdminPassword());
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "概览" })).toBeVisible();
    await expect(page.getByRole("button", { name: /退出登录/ })).toBeVisible();
  });

  test("TC-AUTH-004: 退出登录", async ({ page }) => {
    const { requireAdminPassword } = await import("./helpers/env");
    await page.goto("/admin/login");
    await page.getByPlaceholder("用户名").fill(adminUser);
    await page.getByPlaceholder("密码").fill(requireAdminPassword());
    await page.getByRole("button", { name: "登录" }).click();
    await page.getByRole("button", { name: /退出登录/ }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
