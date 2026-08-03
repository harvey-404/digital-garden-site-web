import { test, expect, type APIRequestContext } from "@playwright/test";
import { test as adminTest, expect as adminExpect } from "./fixtures/admin";
import { adminPassword, adminUser, requireAdminPassword } from "./helpers/env";

async function skipUnlessAlbumDeployed(request: APIRequestContext) {
  const res = await request.get("/api/album/places?page=0&size=1");
  if (!res.ok) {
    test.skip(true, "远程未部署 album API（/api/album/places），跳过");
    return;
  }
  let body: { code?: number };
  try {
    body = await res.json();
  } catch {
    test.skip(true, "远程 album API 响应非 JSON，跳过");
    return;
  }
  test.skip(body.code !== 0, "远程未部署 album API（/api/album/places），跳过");
}

test.describe("足迹 /album", () => {
  test("TC-ALB-001: 导航有足迹且 /album 加载地图", async ({ page, request }) => {
    await skipUnlessAlbumDeployed(request);
    await page.goto("/");
    const navLink = page.locator("header nav").getByRole("link", { name: "足迹" });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/album/);
    await expect(page.locator("#album-amap").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("足迹地图")).toBeVisible();
  });

  test("TC-ALB-002: 直接访问 /album 显示地图容器", async ({ page, request }) => {
    await skipUnlessAlbumDeployed(request);
    await page.goto("/album");
    await expect(page).toHaveURL(/\/album/);
    await expect(page.locator("#album-amap").first()).toBeVisible({ timeout: 15_000 });
  });
});

adminTest.describe("足迹 admin → public", () => {
  adminTest.beforeEach(() => {
    adminTest.skip(!adminPassword, "缺少 E2E_ADMIN_PASSWORD，跳过可写 API 测试");
  });

  adminTest("TC-ALB-003: 发布地点后在 /album 列表可见", async ({ adminPage, request }) => {
    await skipUnlessAlbumDeployed(request);
    const login = await request.post("/api/auth/login", {
      data: { username: adminUser, password: requireAdminPassword() },
    });
    const loginJson = await login.json();
    adminExpect(loginJson.code).toBe(0);
    const token = loginJson.data.token as string;

    const placeName = `E2E-足迹-${Date.now()}`;
    const create = await request.post("/api/admin/album/places", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: placeName,
        address: "Playwright 测试地址",
        city: "西安",
        lat: 34.2184,
        lng: 108.9642,
        note: "e2e smoke",
        sortOrder: 0,
        status: "PUBLISHED",
      },
    });
    const created = await create.json();
    adminExpect(created.code).toBe(0);

    await adminPage.goto("/album");
    await adminExpect(adminPage.locator("#album-amap").first()).toBeVisible({ timeout: 15_000 });
    await adminExpect(adminPage.getByRole("heading", { level: 3, name: placeName })).toBeVisible({
      timeout: 15_000,
    });
  });
});
