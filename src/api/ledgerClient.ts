import type { ApiResult } from "../types";

export const LEDGER_TOKEN_KEY = "ledger_token";

export function getLedgerToken(): string | null {
  return localStorage.getItem(LEDGER_TOKEN_KEY);
}

export function clearLedgerToken(): void {
  localStorage.removeItem(LEDGER_TOKEN_KEY);
}

/**
 * Fetch wrapper for `/api/ledger/**` using the shared HttpOnly session cookie. Legacy tokens are ownership proof only.
 * On 403 ONBOARDING_REQUIRED, redirects to `/ledger/onboarding`.
 */
export async function ledgerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(!(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
  };
  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  }

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/ledger${path}`, {
    ...init,
    headers, credentials: "same-origin",
  });

  const body = (await res.json()) as ApiResult<T>;

  if (body.code === 401) {
    if (window.location.pathname === "/ledger" || window.location.pathname.startsWith("/ledger/")) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    throw new Error("登录已过期，请重新登录");
  }

  if (body.code === 403 && body.message?.includes("ONBOARDING")) {
    if ((window.location.pathname === "/ledger" || window.location.pathname.startsWith("/ledger/")) && !window.location.pathname.startsWith("/ledger/onboarding")) {
      window.location.href = "/ledger/onboarding";
    }
  }

  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? "请求失败");
  }

  return body.data;
}

export async function getLedgerBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/ledger${path}`, {
    credentials: "same-origin", signal,
  });
  if (!res.ok || !res.headers.get("Content-Type")?.startsWith("image/")) {
    let message = "图片无法读取";
    try { const error = await res.json(); message = error.message ?? message; } catch { /* Keep a useful fallback. */ }
    throw new Error(message);
  }
  return res.blob();
}
