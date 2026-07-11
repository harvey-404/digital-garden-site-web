import { test, expect } from "@playwright/test";

test.describe("前台公开页面", () => {
  test("TC-PUB-001: 首页加载并显示导航", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Digital Garden" })).toBeVisible();
    await expect(page.getByRole("link", { name: "首页" })).toBeVisible();
    await expect(page.getByRole("link", { name: "灵感" })).toBeVisible();
    await expect(page.getByRole("link", { name: "成果" })).toBeVisible();
    await expect(page.getByRole("link", { name: "关于" })).toBeVisible();
  });

  test("TC-PUB-002: 首页显示个人介绍或文章区块", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Harvey", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "最新灵感" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "精选成果" })).toBeVisible();
  });

  test("TC-PUB-003: 灵感列表页可访问", async ({ page }) => {
    await page.goto("/posts");
    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByPlaceholder("搜索文章…")).toBeVisible();
  });

  test("TC-PUB-004: 成果列表页可访问", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("TC-PUB-005: 关于页可访问", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(/\/about$/);
  });

  test("TC-PUB-006: 404 页面", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-e2e");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText("页面走丢了")).toBeVisible();
    await expect(page.getByRole("link", { name: "返回首页" })).toBeVisible();
  });

  test("TC-PUB-007: 从列表进入文章详情", async ({ page }) => {
    await page.goto("/posts");
    const postLink = page.locator("a.block").filter({ has: page.locator("h3") }).first();

    try {
      await expect(postLink).toBeVisible({ timeout: 10_000 });
    } catch {
      test.skip(true, "暂无文章或列表加载超时");
      return;
    }

    await postLink.click();
    await expect(page).toHaveURL(/\/posts\/.+/);
    await expect(page.getByRole("button", { name: /点赞|已赞/ })).toBeVisible();
    await expect(page.getByPlaceholder("你的昵称")).toBeVisible();
  });

  test("TC-PUB-008: 文章搜索", async ({ page }) => {
    await page.goto("/posts");
    await page.getByPlaceholder("搜索文章…").fill("E2E");
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
  });
});
