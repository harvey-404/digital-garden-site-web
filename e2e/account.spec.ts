import { test, expect, type Page } from '@playwright/test';
const account = { id: 7, email: 'reader@example.com', displayName: '读者', timezone: 'Asia/Shanghai', links: { ledger: false, tracker: false } };
async function mock(page: Page, initial = false, conflict = false) {
  let signed = initial; const calls: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; if (!path.startsWith('/api/')) return route.continue(); calls.push(path);
    let data: unknown = []; let code = 0, message = '', status = 200;
    if (path === '/api/account/me') { data = account; if (!signed) { code = 401; status = 401; } }
    else if (path === '/api/account/status') data = { mailConfigured: false };
    else if (path === '/api/account/login' || path === '/api/account/register') { signed = true; data = account; }
    else if (path === '/api/account/logout') signed = false;
    else if (path.includes('/api/account/links/')) { if (conflict) { code = 409; status = 409; message = '旧账号已绑定其他邮箱'; } else data = account; }
    else if (path === '/api/account/code') { code = 503; status = 503; message = '邮件服务尚未配置'; }
    else if (path === '/api/account/reset-password') signed = false;
    else if (path === '/api/tracker/auth/me') data = { id: 9, username: '读者', timezone: 'Asia/Shanghai' };
    else if (path === '/api/tracker/timer') data = null;
    await route.fulfill({ status, json: { code, message, data } });
  }); return calls;
}
test('login links old proof before entering tracker and keeps sessions out of storage', async ({ page }) => {
  const calls = await mock(page);
  await page.addInitScript(() => { if (!sessionStorage.getItem('proof-seeded')) { localStorage.setItem('tracker_token', 'old-proof'); localStorage.setItem('dg_token', 'admin-independent'); sessionStorage.setItem('proof-seeded', '1'); } });
  await page.goto('/tracker/login');
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel('邮箱', { exact: true }).fill('reader@example.com');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/tracker$/);
  await expect(page.getByRole('heading', { name: '我的日常.' })).toBeVisible();
  expect(calls.indexOf('/api/account/links/tracker')).toBeLessThan(calls.indexOf('/api/tracker/auth/me'));
  expect(await page.evaluate(() => localStorage.getItem('tracker_token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('dg_token'))).toBe('admin-independent');
});
test('binding conflicts retain ownership proof and block tool provisioning', async ({ page }) => {
  const calls = await mock(page, true, true);
  await page.addInitScript(() => localStorage.setItem('tracker_token', 'old-proof'));
  await page.goto('/tracker');
  await expect(page.getByRole('alert').first()).toContainText('旧账号已绑定其他邮箱');
  expect(calls).not.toContain('/api/tracker/auth/me');
  expect(await page.evaluate(() => localStorage.getItem('tracker_token'))).toBe('old-proof');
});
test('registration explains missing mail and surfaces actual send error', async ({ page }) => {
  await mock(page); await page.goto('/register');
  await expect(page.getByText(/邮件服务尚未配置/).first()).toBeVisible();
  await page.getByLabel('邮箱', { exact: true }).fill('reader@example.com');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await expect(page.getByRole('alert')).toContainText('邮件服务尚未配置');
});
test('rejects external next destination and revokes shared session on logout', async ({ page }) => {
  await mock(page); await page.goto('/login?next=https://evil.example/');
  await page.getByLabel('邮箱', { exact: true }).fill('reader@example.com');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByRole('button', { name: '退出全站登录' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('verified registration sends purpose and returns to original account page', async ({ page }) => {
  await mock(page);
  let purpose = '';
  await page.route('**/api/account/code', async route => { purpose = route.request().postDataJSON().purpose; await route.fulfill({ json: { code: 0, message: '', data: { retryAfterSeconds: 60 } } }); });
  await page.goto('/register');
  await page.getByLabel('邮箱', { exact: true }).fill('reader@example.com');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await expect(page.getByRole('status')).toContainText('验证码已发送');
  expect(purpose).toBe('register');
  await page.locator('input[autocomplete="one-time-code"]').fill('123456');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByRole('button', { name: '验证并注册' }).click();
  await expect(page).toHaveURL(/\/account$/);
});
test('password reset returns to login and shows revoked sessions message', async ({ page }) => {
  await mock(page, true); await page.goto('/reset-password');
  await page.getByLabel('邮箱', { exact: true }).fill('reader@example.com');
  await page.locator('input[autocomplete="one-time-code"]').fill('123456');
  await page.getByLabel('新密码', { exact: true }).fill('new-password123');
  await page.getByRole('button', { name: '保存新密码' }).click();
  await expect(page).toHaveURL(/\/login\?reset=1/);
  await expect(page.getByRole('status')).toContainText('其他登录会话已失效');
});
test('manual legacy binding uses ownership credentials without storing passwords', async ({ page }) => {
  await mock(page, true); let proof: unknown;
  await page.route('**/api/account/links/tracker', async route => { proof = route.request().postDataJSON(); await route.fulfill({ json: { code: 0, message: '', data: account } }); });
  await page.goto('/account');
  await page.getByLabel('旧打卡用户名').fill('old_reader');
  await page.getByLabel('旧打卡密码').fill('old-password');
  await page.getByRole('button', { name: '绑定原打卡账号' }).click();
  await expect(page.getByRole('status')).toContainText('原账号数据已绑定');
  expect(proof).toEqual({ username: 'old_reader', password: 'old-password' });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('old-password');
});
test('focus revalidates shared logout and redirects protected tracker', async ({ page }) => {
  await mock(page, true); await page.goto('/tracker');
  await expect(page.getByRole('heading', { name: '我的日常.' })).toBeVisible();
  await page.route('**/api/account/me', route => route.fulfill({ status: 401, json: { code: 401, message: '登录已过期', data: null } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/login\?next=/);
});
test('ledger cookie fetch follows proof linking and does not send bearer credential', async ({ page }) => {
  const calls = await mock(page, true); let authorization: string | undefined;
  await page.addInitScript(() => localStorage.setItem('ledger_token', 'old-ledger-proof'));
  await page.route('**/api/ledger/auth/me', async route => { authorization = route.request().headers().authorization; calls.push('/api/ledger/auth/me'); await route.fulfill({ json: { code: 0, message: '', data: { userSn: 'L001', displayName: '原账本', defaultBudgetAmount: 1000, status: 'ACTIVE', onboardingDone: true } } }); });
  await page.goto('/ledger/settings');
  await expect(page.getByRole('heading', { name: '设置', exact: true })).toBeVisible();
  expect(calls.indexOf('/api/account/links/ledger')).toBeLessThan(calls.indexOf('/api/ledger/auth/me'));
  expect(authorization).toBeUndefined();
  expect(await page.evaluate(() => localStorage.getItem('ledger_token'))).toBeNull();
});
test('ledger account read can recover after transient service error', async ({ page }) => {
  await mock(page, true); let attempts = 0;
  await page.route('**/api/ledger/auth/me', async route => { attempts++; await route.fulfill(attempts === 1 ? { status: 503, json: { code: 503, message: '账本暂时繁忙', data: null } } : { json: { code: 0, message: '', data: { userSn: 'L001', displayName: '账本', defaultBudgetAmount: 1000, status: 'ACTIVE', onboardingDone: true } } }); });
  await page.goto('/ledger/settings');
  await expect(page.getByRole('alert')).toContainText('账本暂时繁忙');
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByRole('heading', { name: '设置', exact: true })).toBeVisible();
});
test('account forms fit narrow mobile viewport', async ({ page }) => {
  await mock(page); await page.setViewportSize({ width: 320, height: 740 }); await page.goto('/register');
  await expect(page.getByRole('heading', { name: '创建邮箱账号' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('partial migration retains only failed proof and account center stays reachable', async ({ page }) => {
  await mock(page, true, true);
  await page.addInitScript(() => { localStorage.setItem('ledger_token', 'ledger-proof'); localStorage.setItem('tracker_token', 'tracker-proof'); });
  await page.route('**/api/account/links/ledger', route => route.fulfill({ json: { code: 0, message: '', data: account } }));
  await page.goto('/tracker');
  await expect(page.getByRole('alert')).toContainText('旧账号已绑定其他邮箱');
  expect(await page.evaluate(() => localStorage.getItem('ledger_token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('tracker_token'))).toBe('tracker-proof');
  await page.getByRole('link', { name: '前往账号中心' }).click();
  await expect(page.getByRole('heading', { name: '账号中心' })).toBeVisible();
  await expect(page.getByLabel('旧打卡用户名')).toBeVisible();
});
