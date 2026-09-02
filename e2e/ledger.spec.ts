import { test, expect, type APIRequestContext } from "@playwright/test";
import { adminPassword, adminUser, requireAdminPassword } from "./helpers/env";

/** Spec §11 acceptance (manual / covered elsewhere) — see ledger-task-16-report.md */
// 1 JWT legacy admin  2 role isolation  3 disabled  4 onboarding gate
// 5 activate/create budget  6 cross-month  7 dashboard===expenses sum
// 8 category breakdown month  9 暂无消费  10 future recorded_at
// 11 category duplicate  12 amount validation  13 invite normalize  14 Shanghai boundary

const EXPENSE_AMOUNT = 36.5;
const EXPENSE_DISPLAY = "¥36.50";

type ApiEnvelope<T = unknown> = {
  code?: number;
  message?: string;
  data?: T;
};

async function skipUnlessLedgerDeployed(request: APIRequestContext) {
  const res = await request.post("/api/ledger/auth/invite", {
    data: { inviteCode: "AAAA-AAAA-AAAA" },
  });
  let body: ApiEnvelope;
  try {
    body = await res.json();
  } catch {
    test.skip(true, "远程 ledger API 响应非 JSON，跳过");
    return;
  }
  const msg = String(body.message ?? "");
  const notDeployed =
    body.code === 500 ||
    msg.includes("static resource") ||
    msg.includes("No static resource");
  test.skip(notDeployed, "远程未部署 ledger API（/api/ledger/auth/invite），跳过");
}

async function adminLogin(request: APIRequestContext): Promise<string> {
  const login = await request.post("/api/auth/login", {
    data: {
      username: adminUser,
      password: requireAdminPassword(),
    },
  });
  const loginJson = (await login.json()) as ApiEnvelope<{ token: string }>;
  expect(loginJson.code, loginJson.message ?? "admin login failed").toBe(0);
  expect(loginJson.data?.token).toBeTruthy();
  return loginJson.data!.token;
}

async function createLedgerUser(request: APIRequestContext, token: string): Promise<string> {
  const create = await request.post("/api/admin/ledger/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const created = (await create.json()) as ApiEnvelope<{
    userSn: string;
    inviteCode: string;
  }>;
  expect(created.code, created.message ?? "create ledger user failed").toBe(0);
  expect(created.data?.inviteCode).toBeTruthy();
  return created.data!.inviteCode;
}

test.describe("账本 ledger smoke", () => {
  let inviteCode = "";

  test.beforeAll(async ({ request }) => {
    if (!adminPassword) {
      test.skip(true, "缺少 E2E_ADMIN_PASSWORD，跳过（复制 .env.e2e.example → .env.e2e 或设置环境变量）");
      return;
    }
    await skipUnlessLedgerDeployed(request);
    const token = await adminLogin(request);
    inviteCode = await createLedgerUser(request, token);
  });

  test.beforeEach(() => {
    test.skip(!adminPassword, "缺少 E2E_ADMIN_PASSWORD，跳过");
    test.skip(!inviteCode, "未取得 inviteCode（ledger 未部署或 beforeAll 跳过）");
  });

  test("TC-LEDGER-001: invite → onboarding → activate → expense → dashboard spent", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await page.goto("/");
    const navLedger = page.locator("header nav").getByRole("link", { name: "记账" });
    await expect(navLedger).toBeVisible();
    await navLedger.click();
    await expect(page).toHaveURL(/\/ledger\/login/);

    await expect(page.getByRole("heading", { name: "记账登录" })).toBeVisible();
    await page.getByPlaceholder("XXXX-XXXX-XXXX").fill(inviteCode);
    await page.getByRole("button", { name: "进入账本" }).click();

    await expect(page).toHaveURL(/\/ledger\/onboarding/);
    await expect(page.getByRole("heading", { name: "完善账本" })).toBeVisible();
    await page.getByPlaceholder("怎么称呼你").fill("E2E Ledger");
    await page.getByPlaceholder("例如 3000").fill("3000");
    await page.getByRole("button", { name: "开始记账" }).click();

    await expect(page).toHaveURL(/\/ledger\/?(\?|$)/);
    await expect(page.getByRole("heading", { name: "概览" })).toBeVisible();

    await page.getByRole("button", { name: "启用本月" }).click();
    await expect(page.getByText("暂无消费")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "记一笔" }).click();
    await page.getByPlaceholder("例如 36.5").fill(String(EXPENSE_AMOUNT));
    await page.getByPlaceholder("吃了什么、买了什么…").fill("e2e smoke");
    await page.locator("form").getByRole("button", { name: "记一笔" }).click();

    await expect(page.getByText(/已花/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(EXPENSE_DISPLAY)).toBeVisible();
    await expect(page.getByText("暂无消费")).toHaveCount(0);

    await expect(page.locator("header nav").getByRole("link", { name: "记账" })).toHaveAttribute(
      "href",
      "/ledger",
    );
  });
});
