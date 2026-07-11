import { test, expect } from "@playwright/test";

test.describe("API 健康检查", () => {
  test("TC-API-001: /api/health 返回 UP", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.code).toBe(0);
    expect(body.data.status).toBe("UP");
  });

  test("TC-API-002: /api/profile 返回展示信息", async ({ request }) => {
    const res = await request.get("/api/profile");
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.code).toBe(0);
    expect(body.data.displayName).toBeTruthy();
  });

  test("TC-API-003: /api/posts 返回已发布文章列表", async ({ request }) => {
    const res = await request.get("/api/posts?page=0&size=10");
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.items)).toBeTruthy();
  });

  test("TC-API-004: 错误密码登录返回 401", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { username: "harvey", password: "wrong-password-e2e" },
    });
    const body = await res.json();
    expect(body.code).toBe(401);
  });

  test("TC-API-005: 点赞接口可用（slug 或 numeric id）", async ({ request }) => {
    const postsRes = await request.get("/api/posts?page=0&size=1");
    const postsBody = await postsRes.json();
    const post = postsBody.data.items[0];
    test.skip(!post, "无已发布文章，跳过");

    const visitorId = `e2e-api-${Date.now()}`;

    // 优先测 slug（需服务器部署 PostResolver 修复）
    let likeRes = await request.post(`/api/posts/${post.slug}/like`, {
      data: { visitorId },
    });
    let likeBody = await likeRes.json();

    if (likeBody.code !== 0) {
      likeRes = await request.post(`/api/posts/${post.id}/like`, {
        data: { visitorId: `${visitorId}-id` },
      });
      likeBody = await likeRes.json();
    }

    expect(likeBody.code).toBe(0);
    expect(likeBody.data.liked).toBe(true);
    expect(likeBody.data.likeCount).toBeGreaterThanOrEqual(0);
  });
});
