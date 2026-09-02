import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  activateLedgerBudget,
  listLedgerBudgets,
  updateLedgerBudgetAmount,
} from "../../api/ledger";
import { formatYuan } from "../../components/ledger/ExpenseForm";
import {
  currentMonthShanghai,
  epochToMonthShanghai,
} from "../../components/ledger/MonthPicker";
import Spinner from "../../components/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/PagePrimitives";
import type { LedgerBudgetVO } from "../../types/ledger";

const MAX_BUDGET = 999999.99;

const inputClass =
  "w-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

export default function LedgerBudgetsPage() {
  const [budgets, setBudgets] = useState<LedgerBudgetVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const thisMonth = currentMonthShanghai();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listLedgerBudgets();
      setBudgets(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasThisMonth = budgets.some(
    (b) => epochToMonthShanghai(b.budgetDtm) === thisMonth,
  );

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateLedgerBudget(thisMonth);
      toast.success("已启用本月预算");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "启用失败");
    } finally {
      setActivating(false);
    }
  };

  const startEdit = (b: LedgerBudgetVO) => {
    setEditingId(b.id);
    setEditAmount(String(b.amount));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const saveEdit = async (id: number) => {
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BUDGET) {
      toast.error(`预算须大于 0 且不超过 ${MAX_BUDGET}`);
      return;
    }
    setSavingId(id);
    try {
      await updateLedgerBudgetAmount(id, amount);
      toast.success("预算已更新");
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="预算" description="月度预算列表；可改额度或启用本月。" />
        {!hasThisMonth && (
          <button
            type="button"
            disabled={activating || loading}
            onClick={() => void handleActivate()}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {activating ? "启用中…" : "启用本月"}
          </button>
        )}
      </div>

      {loading && <Spinner />}

      {!loading && budgets.length === 0 && (
        <EmptyState>
          暂无预算月份。可点击「启用本月」，或记一笔自动创建。
        </EmptyState>
      )}

      {!loading && budgets.length > 0 && (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const label = epochToMonthShanghai(b.budgetDtm);
            const spentLabel =
              b.spentLabel ?? (b.spent === 0 ? "暂无消费" : null);
            const ratePct = Math.min(100, Math.max(0, b.rate * 100));
            const isEditing = editingId === b.id;

            return (
              <li
                key={b.id}
                className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
                        {label}
                      </h3>
                      {label === thisMonth && (
                        <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs text-[var(--color-accent)]">
                          本月
                        </span>
                      )}
                      {spentLabel && (
                        <span className="rounded-full bg-[var(--color-code-bg)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                          {spentLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      已花 ¥{formatYuan(b.spent)}
                      {" · "}
                      {(b.rate * 100).toFixed(1)}%
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0.01}
                        max={MAX_BUDGET}
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className={inputClass}
                        aria-label="预算金额"
                      />
                      <button
                        type="button"
                        disabled={savingId === b.id}
                        onClick={() => void saveEdit(b.id)}
                        className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
                      >
                        {savingId === b.id ? "保存中…" : "保存"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--color-heading)]">
                        预算 ¥{formatYuan(b.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(b)}
                        className="text-sm text-[var(--color-accent)] hover:underline"
                      >
                        编辑
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-code-bg)]">
                  <div
                    className={`h-full rounded-full ${
                      b.rate > 1 ? "bg-red-500" : "bg-[var(--color-accent)]"
                    }`}
                    style={{ width: `${ratePct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && hasThisMonth && (
        <p className="text-xs text-[var(--color-text-muted)]">本月预算已启用。</p>
      )}
    </div>
  );
}
