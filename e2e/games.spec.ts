import { test, expect, type APIRequestContext } from "@playwright/test";

async function skipUnlessGamesDeployed(request: APIRequestContext) {
  const res = await request.get("/api/games/semantic/status");
  if (!res.ok) {
    test.skip(true, "远程未部署 games API（/api/games/semantic/status），跳过");
    return;
  }
  let body: { code?: number };
  try {
    body = await res.json();
  } catch {
    test.skip(true, "远程 games API 响应非 JSON，跳过");
    return;
  }
  test.skip(body.code !== 0, "远程未部署 games API（/api/games/semantic/status），跳过");
}

test.describe("乐园", () => {
  test("导航有乐园且 /games 展示语义猜词入口", async ({ page, request }) => {
    await skipUnlessGamesDeployed(request);
    await page.goto("/");
    const navLink = page.locator("header nav").getByRole("link", { name: "乐园" });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/games/);
    await expect(page.getByRole("link", { name: /语义猜词/ })).toBeVisible();
  });
});
