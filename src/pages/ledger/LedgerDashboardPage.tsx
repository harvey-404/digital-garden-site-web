import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  activateLedgerBudget,
  createLedgerExpense,
  getLedgerDashboard,
  listLedgerCategories,
} from "../../api/ledger";
import ExpenseForm, { formatYuan } from "../../components/ledger/ExpenseForm";
import MonthPicker, { useLedgerMonth } from "../../components/ledger/MonthPicker";
import Spinner from "../../components/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/PagePrimitives";
import type { LedgerCategoryVO, LedgerDashboardVO, LedgerExpenseRequest } from "../../types/ledger";

export default function LedgerDashboardPage() {
  const [month, setMonth] = useLedgerMonth();
  const [dashboard, setDashboard] = useState<LedgerDashboardVO | null>(null);
  const [categories, setCategories] = useState<LedgerCategoryVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, cats] = await Promise.all([
        getLedgerDashboard(month),
        listLedgerCategories(),
      ]);
      setDashboard(dash);
      setCategories(cats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateLedgerBudget(month);
      toast.success("已启用本月预算");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "启用失败");
    } finally {
      setActivating(false);
    }
  };

  const handleQuickAdd = async (body: LedgerExpenseRequest) => {
    await createLedgerExpense(body);
    toast.success("已记一笔");
    setShowQuickAdd(false);
    await load();
  };

  const ratePct = dashboard ? Math.min(100, Math.max(0, dashboard.rate * 100)) : 0;
  const overBudget = dashboard != null && dashboard.budgetActivated && dashboard.rate > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="概览" description="月度预算进度与分类占比。" />
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {loading && <Spinner />}

      {!loading && !dashboard && <EmptyState>无法加载本月数据</EmptyState>}

      {!loading && dashboard && (
        <>
          <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
              {month} 预算
            </h2>

            {!dashboard.budgetActivated ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  本月尚未启用预算。参考默认预算{" "}
                  <span className="font-medium text-[var(--color-heading)]">
                    ¥{formatYuan(dashboard.defaultBudgetAmount)}
                  </span>
                  ；记账首笔或手动启用后会按此金额创建。
                </p>
                <button
                  type="button"
                  disabled={activating}
                  onClick={() => void handleActivate()}
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                >
                  {activating ? "启用中…" : "启用本月"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)]">
                    已花{" "}
                    <span className="text-base font-medium text-[var(--color-heading)]">
                      ¥{formatYuan(dashboard.spent)}
                    </span>
                    {" / "}
                    ¥{formatYuan(dashboard.budgetAmount ?? 0)}
                  </span>
                  <span
                    className={
                      overBudget
                        ? "font-medium text-red-600"
                        : "text-[var(--color-text-muted)]"
                    }
                  >
                    {overBudget ? "已超支" : "剩余"} ¥{formatYuan(Math.abs(dashboard.remaining))}
                    {" · "}
                    {(dashboard.rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-[var(--color-code-bg)]"
                  role="progressbar"
                  aria-valuenow={Math.round(ratePct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      overBudget ? "bg-red-500" : "bg-[var(--color-accent)]"
                    }`}
                    style={{ width: `${Math.min(100, ratePct)}%` }}
                  />
                </div>
                {dashboard.spent === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">暂无消费</p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
              分类占比
            </h2>
            {dashboard.categoryBreakdown.length === 0 ? (
              <EmptyState>本月还没有分类消费</EmptyState>
            ) : (
              <ul className="space-y-3">
                {dashboard.categoryBreakdown.map((item) => {
                  const pct = Math.min(100, Math.max(0, item.rate * 100));
                  return (
                    <li key={item.categoryId} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-heading)]">{item.categoryName}</span>
                        <span className="text-[var(--color-text-muted)]">
                          ¥{formatYuan(item.amount)} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-code-bg)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)]/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
                快速记账
              </h2>
              {!showQuickAdd && (
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                >
                  记一笔
                </button>
              )}
            </div>
            {showQuickAdd ? (
              <ExpenseForm
                categories={categories}
                submitLabel="记一笔"
                onSubmit={handleQuickAdd}
                onCancel={() => setShowQuickAdd(false)}
              />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">点击「记一笔」快速添加消费。</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
