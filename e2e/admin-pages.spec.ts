import { test, expect } from "./fixtures/admin";

test.describe("后台管理页面", () => {
  test("TC-ADM-001: 概览页导航完整", async ({ adminPage }) => {
    await expect(adminPage.getByRole("link", { name: "概览" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "文章" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "成果" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "评论审核" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "关于我" })).toBeVisible();
  });

  test("TC-ADM-002: 文章管理页", async ({ adminPage }) => {
    await adminPage.getByRole("link", { name: "文章" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/posts$/);
    await expect(adminPage.getByRole("heading", { name: "文章管理" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "新建文章" })).toBeVisible();
  });

  test("TC-ADM-003: 成果管理页", async ({ adminPage }) => {
    await adminPage.getByRole("link", { name: "成果" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/projects$/);
    await expect(adminPage.getByRole("heading", { name: "成果管理" })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "新建成果" })).toBeVisible();
  });

  test("TC-ADM-004: 评论审核页", async ({ adminPage }) => {
    await adminPage.getByRole("link", { name: "评论审核" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/comments$/);
    await expect(adminPage.getByRole("heading", { name: "评论审核" })).toBeVisible();
    await expect(adminPage.getByRole("combobox")).toBeVisible();
  });

  test("TC-ADM-005: 关于我编辑页", async ({ adminPage }) => {
    await adminPage.getByRole("link", { name: "关于我" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/profile$/);
    await expect(adminPage.getByRole("heading", { name: "关于我" })).toBeVisible();
    await expect(adminPage.getByPlaceholder("显示名称")).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "保存" })).toBeVisible();
  });

  test("TC-ADM-006: 新建文章页表单", async ({ adminPage }) => {
    await adminPage.goto("/admin/posts/new");
    await expect(adminPage.getByRole("heading", { name: "新建文章" })).toBeVisible();
    await expect(adminPage.getByPlaceholder("标题")).toBeVisible();
    await expect(adminPage.getByPlaceholder(/slug/)).toBeVisible();
    await expect(adminPage.getByPlaceholder("正文（Markdown）")).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "发布" })).toBeVisible();
  });
});
