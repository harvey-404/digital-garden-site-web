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
import CategoryPieCard from "../../components/ledger/CategoryPieCard";
import {
  CategoryPodium,
  RankingDrawer,
  type RankRow,
} from "../../components/ledger/CategoryRanking";
import ExpenseForm, { formatYuan } from "../../components/ledger/ExpenseForm";
import ExpenseWordCloudCard from "../../components/ledger/ExpenseWordCloudCard";
import { formatMonthLabel, useLedgerMonth } from "../../components/ledger/MonthPicker";
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
  const [expenses, setExpenses] = useState<LedgerExpenseVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  const categoryMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const categoryName = useCallback(
    (id: number) => categoryMap.get(id) ?? "未分类",
    [categoryMap],
  );

  const recent = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, RECENT_LIMIT);
  }, [expenses]);

  const ranks: RankRow[] = useMemo(() => {
    if (!dashboard) return [];
    const counts = new Map<number, number>();
    for (const e of expenses) {
      counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
    }
    return [...dashboard.categoryBreakdown]
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        amount: item.amount,
        rate: item.rate,
        count: counts.get(item.categoryId) ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [dashboard, expenses]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, cats, list] = await Promise.all([
        getLedgerDashboard(month),
        listLedgerCategories(),
        listLedgerExpenses(month),
      ]);
      setDashboard(dash);
      setCategories(cats);
      setExpenses(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setDashboard(null);
      setExpenses([]);
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
      <PageHeader title="概览" />

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
                    <p className="text-xl font-semibold tabular-nums text-[var(--color-heading)]">
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
                    className={`text-3xl font-semibold tracking-tight tabular-nums ${
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

          <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
            <CategoryPieCard items={dashboard.categoryBreakdown} />
            <ExpenseWordCloudCard
              expenses={expenses}
              categoryName={categoryName}
            />
          </div>

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
                    <span className="shrink-0 font-medium tabular-nums text-[var(--color-heading)]">
                      ¥{formatYuan(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <CategoryPodium
            ranks={ranks}
            onOpenFull={() => setRankingOpen(true)}
          />

          <RankingDrawer
            open={rankingOpen}
            onClose={() => setRankingOpen(false)}
            ranks={ranks}
            monthLabel={formatMonthLabel(month)}
          />
        </>
      )}
    </div>
  );
}
