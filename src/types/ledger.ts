/** Amounts as number; times as Unix seconds (Asia/Shanghai month boundaries). */

export interface LedgerAuthResponse {
  token: string;
  userSn: string;
  onboardingDone: boolean;
}

export interface LedgerMeVO {
  userSn: string;
  displayName: string;
  defaultBudgetAmount: number;
  status: string;
  onboardingDone: boolean;
}

export interface OnboardingRequest {
  displayName: string;
  defaultBudgetAmount: number;
}

export interface ProfileSettingsRequest {
  displayName: string;
}

export interface DefaultBudgetRequest {
  defaultBudgetAmount: number;
}

export interface LedgerExpenseVO {
  id: number;
  budgetId: number;
  categoryId: number;
  description: string;
  amount: number;
  recordedAt: number;
}

export interface LedgerExpenseRequest {
  categoryId: number;
  description?: string;
  amount: number;
  recordedAt: number;
}

export interface LedgerBudgetVO {
  id: number;
  budgetDtm: number;
  amount: number;
  spent: number;
  rate: number;
  /** Present when spent === 0; value 「暂无消费」 */
  spentLabel: string | null;
}

export interface LedgerCategoryVO {
  id: number;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface LedgerCategoryRequest {
  name: string;
  icon?: string;
  sortOrder?: number;
}

export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  amount: number;
  rate: number;
}

export interface LedgerDashboardVO {
  month: string;
  budgetId: number | null;
  budgetDtm: number | null;
  /** Monthly budget amount when activated; null if month not enabled. */
  budgetAmount: number | null;
  /** User default budget; shown as reference when month not enabled. */
  defaultBudgetAmount: number;
  budgetActivated: boolean;
  spent: number;
  rate: number;
  remaining: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CreateLedgerUserResponse {
  userSn: string;
  inviteCode: string;
}

export interface LedgerUserAdminVO {
  id: number;
  userSn: string;
  inviteCode: string;
  displayName: string;
  defaultBudgetAmount: number;
  status: string;
  inDtm: number;
  updateDtm: number;
}
