import apiClient from "./client";
import { ledgerFetch } from "./ledgerClient";
import type {
  CreateLedgerUserResponse,
  DefaultBudgetRequest,
  LedgerAuthResponse,
  LedgerBudgetVO,
  LedgerCategoryRequest,
  LedgerCategoryVO,
  LedgerDashboardVO,
  LedgerExpenseRequest,
  LedgerExpenseVO,
  LedgerMeVO,
  LedgerUserAdminVO,
  OnboardingRequest,
  ProfileSettingsRequest,
} from "../types/ledger";

// ── Auth / onboarding / settings (ledger_token) ─────────────────────────────

/** Caller should `signIn(data.token)` via LedgerAuthContext after success. */
export function redeemInvite(inviteCode: string): Promise<LedgerAuthResponse> {
  return ledgerFetch<LedgerAuthResponse>("/auth/invite", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export function getLedgerMe(): Promise<LedgerMeVO> {
  return ledgerFetch<LedgerMeVO>("/auth/me");
}

export function completeOnboarding(body: OnboardingRequest): Promise<LedgerMeVO> {
  return ledgerFetch<LedgerMeVO>("/onboarding", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateLedgerProfile(body: ProfileSettingsRequest): Promise<LedgerMeVO> {
  return ledgerFetch<LedgerMeVO>("/settings/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function updateLedgerDefaultBudget(body: DefaultBudgetRequest): Promise<LedgerMeVO> {
  return ledgerFetch<LedgerMeVO>("/settings/default-budget", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export function getLedgerDashboard(month: string): Promise<LedgerDashboardVO> {
  return ledgerFetch<LedgerDashboardVO>(`/dashboard?month=${encodeURIComponent(month)}`);
}

// ── Expenses ────────────────────────────────────────────────────────────────

export function listLedgerExpenses(month: string): Promise<LedgerExpenseVO[]> {
  return ledgerFetch<LedgerExpenseVO[]>(`/expenses?month=${encodeURIComponent(month)}`);
}

export function createLedgerExpense(body: LedgerExpenseRequest): Promise<LedgerExpenseVO> {
  return ledgerFetch<LedgerExpenseVO>("/expenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateLedgerExpense(
  id: number,
  body: LedgerExpenseRequest,
): Promise<LedgerExpenseVO> {
  return ledgerFetch<LedgerExpenseVO>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteLedgerExpense(id: number): Promise<void> {
  return ledgerFetch<void>(`/expenses/${id}`, { method: "DELETE" });
}

// ── Budgets ─────────────────────────────────────────────────────────────────

export function listLedgerBudgets(): Promise<LedgerBudgetVO[]> {
  return ledgerFetch<LedgerBudgetVO[]>("/budgets");
}

export function activateLedgerBudget(month: string): Promise<LedgerBudgetVO> {
  return ledgerFetch<LedgerBudgetVO>("/budgets", {
    method: "POST",
    body: JSON.stringify({ month }),
  });
}

export function updateLedgerBudgetAmount(id: number, amount: number): Promise<LedgerBudgetVO> {
  return ledgerFetch<LedgerBudgetVO>(`/budgets/${id}`, {
    method: "PUT",
    body: JSON.stringify({ amount }),
  });
}

// ── Categories ──────────────────────────────────────────────────────────────

export function listLedgerCategories(): Promise<LedgerCategoryVO[]> {
  return ledgerFetch<LedgerCategoryVO[]>("/categories");
}

export function createLedgerCategory(body: LedgerCategoryRequest): Promise<LedgerCategoryVO> {
  return ledgerFetch<LedgerCategoryVO>("/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateLedgerCategory(
  id: number,
  body: LedgerCategoryRequest,
): Promise<LedgerCategoryVO> {
  return ledgerFetch<LedgerCategoryVO>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteLedgerCategory(id: number): Promise<void> {
  return ledgerFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

// ── Admin ledger users (dg_token via apiClient) ─────────────────────────────

export function adminCreateLedgerUser(): Promise<CreateLedgerUserResponse> {
  return apiClient.post("/admin/ledger/users") as unknown as Promise<CreateLedgerUserResponse>;
}

export function adminListLedgerUsers(): Promise<LedgerUserAdminVO[]> {
  return apiClient.get("/admin/ledger/users") as unknown as Promise<LedgerUserAdminVO[]>;
}

export function adminSetLedgerUserStatus(id: number, status: string): Promise<void> {
  return apiClient.put(`/admin/ledger/users/${id}/status`, {
    status,
  }) as unknown as Promise<void>;
}
