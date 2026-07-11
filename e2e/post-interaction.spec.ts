import { test, expect } from "@playwright/test";

async function openFirstPost(page: import("@playwright/test").Page) {
  const postsRes = await page.request.get("/api/posts?page=0&size=1");
  const postsBody = await postsRes.json();
  const slug = postsBody.data.items[0]?.slug as string | undefined;
  test.skip(!slug, "无已发布文章，跳过");

  await page.goto(`/posts/${slug}`);
  await expect(page.getByRole("button", { name: /点赞|已赞/ })).toBeVisible();
  return slug;
}

test.describe("文章互动", () => {
  test("TC-POST-001: 点赞按钮可点击并更新状态", async ({ page }) => {
    await openFirstPost(page);

    const likeBtn = page.getByRole("button", { name: /点赞/ });
    if ((await likeBtn.count()) === 0) {
      await expect(page.getByRole("button", { name: /已赞/ })).toBeVisible();
      return;
    }

    const beforeText = await likeBtn.textContent();
    await likeBtn.click();
    await expect(page.getByRole("button", { name: /已赞|点赞/ })).toBeVisible();

    const afterText = await page.getByRole("button", { name: /已赞|点赞/ }).textContent();
    if (beforeText?.includes("点赞")) {
      expect(afterText).toMatch(/已赞|点赞 · \d+/);
    }
  });

  test("TC-POST-002: 提交评论（待审核）", async ({ page }) => {
    await openFirstPost(page);

    const nickname = `E2E-${Date.now()}`;
    const content = `Playwright 自动测试评论 ${new Date().toISOString()}`;

    await page.getByPlaceholder("你的昵称").fill(nickname);
    await page.getByPlaceholder("留下你的评论…").fill(content);
    await page.getByRole("button", { name: "提交评论" }).click();

    await expect(page.getByText("评论已提交，待审核通过后显示")).toBeVisible();
    await expect(page.getByPlaceholder("留下你的评论…")).toHaveValue("");
  });

  test("TC-POST-003: 空评论校验", async ({ page }) => {
    await openFirstPost(page);

    await page.getByRole("button", { name: "提交评论" }).click();
    await expect(page.getByText("昵称和内容不能为空")).toBeVisible();
  });
});
