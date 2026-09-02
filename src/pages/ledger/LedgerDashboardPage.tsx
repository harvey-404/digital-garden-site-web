import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  activateLedgerBudget,
  createLedgerExpense,
  getLedgerDashboard,
  listLedgerCategories,
  listLedgerExpenses,
} from "../../api/ledger";
import ExpenseForm, { formatYuan } from "../../components/ledger/ExpenseForm";
import { useLedgerMonth } from "../../components/ledger/MonthPicker";
import Spinner from "../../components/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/PagePrimitives";
import type {
  LedgerCategoryVO,
  LedgerDashboardVO,
  LedgerExpenseRequest,
  LedgerExpenseVO,
} from "../../types/ledger";

const RECENT_LIMIT = 5;

function BudgetRing({
  rate,
  overBudget,
  activated,
}: {
  rate: number;
  overBudget: boolean;
  activated: boolean;
}) {
  const size = 88;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = activated ? Math.min(1, Math.max(0, rate)) : 0;
  const offset = c * (1 - clamped);
  const color = overBudget ? "#dc2626" : "var(--color-accent)";
  const label = activated ? `${Math.round(rate * 100)}%` : "—";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-code-bg)"
          strokeWidth={stroke}
        />
        {activated && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        )}
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${
          overBudget ? "text-red-600" : "text-[var(--color-accent)]"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

export default function LedgerDashboardPage() {
  const [month] = useLedgerMonth();
  const [dashboard, setDashboard] = useState<LedgerDashboardVO | null>(null);
  const [categories, setCategories] = useState<LedgerCategoryVO[]>([]);
  const [recent, setRecent] = useState<LedgerExpenseVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const categoryMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, cats, expenses] = await Promise.all([
        getLedgerDashboard(month),
        listLedgerCategories(),
        listLedgerExpenses(month),
      ]);
      setDashboard(dash);
      setCategories(cats);
      const sorted = [...expenses].sort((a, b) => b.recordedAt - a.recordedAt);
      setRecent(sorted.slice(0, RECENT_LIMIT));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setDashboard(null);
      setRecent([]);
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

  const overBudget =
    dashboard != null && dashboard.budgetActivated && dashboard.rate > 1;

  return (
    <div className="space-y-6">
      <PageHeader title="概览" description="一眼看清本月预算与花销结构。" />

      {loading && <Spinner />}

      {!loading && !dashboard && <EmptyState>无法加载本月数据</EmptyState>}

      {!loading && dashboard && (
        <>
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            {!dashboard.budgetActivated ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <BudgetRing rate={0} overBudget={false} activated={false} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs text-[var(--color-text-muted)]">本月尚未启用</p>
                    <p className="font-serif text-xl font-semibold text-[var(--color-heading)]">
                      参考 ¥{formatYuan(dashboard.defaultBudgetAmount)}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      启用后即可查看进度；记首笔也会自动按默认预算创建。
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={activating}
                    onClick={() => void handleActivate()}
                    className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                  >
                    {activating ? "启用中…" : "启用本月预算"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    className="rounded-lg border border-[var(--color-accent)]/40 px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-code-bg)]"
                  >
                    先记一笔
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <BudgetRing
                  rate={dashboard.rate}
                  overBudget={overBudget}
                  activated
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {overBudget ? "已超支" : "剩余"}
                  </p>
                  <p
                    className={`font-serif text-3xl font-semibold tracking-tight ${
                      overBudget ? "text-red-600" : "text-[var(--color-heading)]"
                    }`}
                  >
                    {overBudget ? "−" : ""}¥
                    {formatYuan(Math.abs(dashboard.remaining))}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    已花 ¥{formatYuan(dashboard.spent)} / ¥
                    {formatYuan(dashboard.budgetAmount ?? 0)}
                    {dashboard.spent === 0 ? " · 暂无消费" : ""}
                  </p>
                </div>
                {!showQuickAdd && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    className="shrink-0 self-start rounded-lg border border-[var(--color-accent)]/40 px-3 py-2 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-code-bg)] sm:self-center"
                  >
                    记一笔
                  </button>
                )}
              </div>
            )}

            {showQuickAdd && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                <ExpenseForm
                  categories={categories}
                  submitLabel="记一笔"
                  onSubmit={handleQuickAdd}
                  onCancel={() => setShowQuickAdd(false)}
                />
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
              分类占比
            </h2>
            {dashboard.categoryBreakdown.length === 0 ? (
              <div className="space-y-2 text-center">
                <EmptyState>
                  {dashboard.budgetActivated && dashboard.spent === 0
                    ? "暂无消费"
                    : "本月还没有分类消费"}
                </EmptyState>
                {!showQuickAdd && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline"
                  >
                    记一笔
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboard.categoryBreakdown.map((item) => {
                  const pct = Math.min(100, Math.max(0, item.rate * 100));
                  return (
                    <li key={item.categoryId} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-heading)]">
                          {item.categoryName}
                        </span>
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
                最近记账
              </h2>
              <Link
                to={`/ledger/expenses?month=${encodeURIComponent(month)}`}
                className="text-sm text-[var(--color-accent)] transition hover:underline"
              >
                查看全部
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState>暂无消费</EmptyState>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {recent.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-baseline justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[var(--color-heading)]">
                        {e.description?.trim() ||
                          categoryMap.get(e.categoryId) ||
                          "消费"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {categoryMap.get(e.categoryId) ?? "未分类"}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-[var(--color-heading)]">
                      ¥{formatYuan(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
