import type { ApiResult } from "../types";

export const LEDGER_TOKEN_KEY = "ledger_token";

export function getLedgerToken(): string | null {
  return localStorage.getItem(LEDGER_TOKEN_KEY);
}

export function setLedgerToken(token: string): void {
  localStorage.setItem(LEDGER_TOKEN_KEY, token);
}

export function clearLedgerToken(): void {
  localStorage.removeItem(LEDGER_TOKEN_KEY);
}

/**
 * Fetch wrapper for `/api/ledger/**` using `ledger_token` (separate from admin `dg_token`).
 * On 403 ONBOARDING_REQUIRED, redirects to `/ledger/onboarding`.
 */
export async function ledgerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getLedgerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  }

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/ledger${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json()) as ApiResult<T>;

  if (body.code === 403 && body.message?.includes("ONBOARDING")) {
    if (!window.location.pathname.startsWith("/ledger/onboarding")) {
      window.location.href = "/ledger/onboarding";
    }
  }

  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? "请求失败");
  }

  return body.data;
}
