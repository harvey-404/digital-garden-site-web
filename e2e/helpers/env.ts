export const baseURL = process.env.E2E_BASE_URL ?? "http://101.37.33.184";

export const adminUser = process.env.E2E_ADMIN_USER ?? "harvey";

export const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";

export function requireAdminPassword(): string {
  if (!adminPassword) {
    throw new Error(
      "缺少 E2E_ADMIN_PASSWORD。请复制 .env.e2e.example 为 .env.e2e 并填写后台密码，或在运行前设置环境变量。"
    );
  }
  return adminPassword;
}
