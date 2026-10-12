export interface Account { id: number; email: string; displayName: string; timezone: string; links: { ledger: boolean; tracker: boolean } }
export async function accountRequest<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/account${path}`, { credentials: 'same-origin', method: data === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  let body: { code: number; message: string; data: T };
  try { body = await response.json(); } catch { throw new Error('账号服务暂时无法连接，请稍后重试'); }
  if (!response.ok || body.code !== 0) throw Object.assign(new Error(body.message || '账号操作失败，请重试'), { status: response.status, code: body.code });
  return body.data;
}
export function safeNext(value: string | null, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin && !/^\/(login|register|reset-password)(\/|$)/.test(url.pathname) ? url.pathname + url.search + url.hash : fallback; } catch { return fallback; }
}
export const accountSignal = () => { localStorage.setItem('dg_account_changed', String(Date.now())); window.dispatchEvent(new Event('account:changed')); };
