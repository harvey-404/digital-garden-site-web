import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createLedgerExpense,
  deleteLedgerExpense,
  listLedgerCategories,
  listLedgerExpenses,
  updateLedgerExpense,
} from "../../api/ledger";
import ExpenseForm, { formatYuan } from "../../components/ledger/ExpenseForm";
import MonthPicker, { useLedgerMonth } from "../../components/ledger/MonthPicker";
import Spinner from "../../components/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/PagePrimitives";
import type {
  LedgerCategoryVO,
  LedgerExpenseRequest,
  LedgerExpenseVO,
} from "../../types/ledger";

function dayKey(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDayHeading(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("zh-CN", { weekday: "short" });
  return `${y}年${m}月${d}日 ${weekday}`;
}

function formatTime(epochSec: number): string {
  return new Date(epochSec * 1000).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LedgerExpensesPage() {
  const [month, setMonth] = useLedgerMonth();
  const [expenses, setExpenses] = useState<LedgerExpenseVO[]>([]);
  const [categories, setCategories] = useState<LedgerCategoryVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<LedgerExpenseVO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categoryMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cats] = await Promise.all([
        listLedgerExpenses(month),
        listLedgerCategories(),
      ]);
      setExpenses(list);
      setCategories(cats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, LedgerExpenseVO[]>();
    for (const e of expenses) {
      const key = dayKey(e.recordedAt);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  const monthTotal = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  const handleCreate = async (body: LedgerExpenseRequest) => {
    await createLedgerExpense(body);
    toast.success("已添加");
    setMode("list");
    await load();
  };

  const handleUpdate = async (body: LedgerExpenseRequest) => {
    if (!editing) return;
    await updateLedgerExpense(editing.id, body);
    toast.success("已更新");
    setEditing(null);
    setMode("list");
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除这笔消费？")) return;
    setDeletingId(id);
    try {
      await deleteLedgerExpense(id);
      toast.success("已删除");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="明细" description="按日记账明细；筛选月份与概览共用。" />
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {mode === "list" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            本月合计{" "}
            <span className="font-medium text-[var(--color-heading)]">
              ¥{formatYuan(monthTotal)}
            </span>
            {expenses.length > 0 && (
              <span className="ml-2 opacity-70">（{expenses.length} 笔）</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setMode("create");
            }}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            记一笔
          </button>
        </div>
      )}

      {mode === "create" && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 font-serif text-lg font-semibold text-[var(--color-heading)]">
            新增消费
          </h2>
          <ExpenseForm
            categories={categories}
            submitLabel="添加"
            onSubmit={handleCreate}
            onCancel={() => setMode("list")}
          />
        </section>
      )}

      {mode === "edit" && editing && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 font-serif text-lg font-semibold text-[var(--color-heading)]">
            编辑消费
          </h2>
          <ExpenseForm
            key={editing.id}
            categories={categories}
            initial={{
              categoryId: editing.categoryId,
              amount: editing.amount,
              description: editing.description,
              recordedAt: editing.recordedAt,
            }}
            submitLabel="更新"
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditing(null);
              setMode("list");
            }}
          />
        </section>
      )}

      {mode === "list" && loading && <Spinner />}

      {mode === "list" && !loading && expenses.length === 0 && (
        <EmptyState>本月暂无记账</EmptyState>
      )}

      {mode === "list" && !loading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([day, items]) => {
            const daySum = items.reduce((s, e) => s + e.amount, 0);
            return (
              <section key={day} className="space-y-2">
                <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2">
                  <h3 className="text-sm font-medium text-[var(--color-heading)]">
                    {formatDayHeading(day)}
                  </h3>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    ¥{formatYuan(daySum)}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[var(--color-heading)]">
                            ¥{formatYuan(e.amount)}
                          </span>
                          <span className="rounded-full bg-[var(--color-code-bg)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                            {categoryMap.get(e.categoryId) ?? `分类 #${e.categoryId}`}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {formatTime(e.recordedAt)}
                          </span>
                        </div>
                        {e.description ? (
                          <p className="truncate text-sm text-[var(--color-text-muted)]">
                            {e.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <button
                          type="button"
                          className="text-[var(--color-accent)] hover:underline"
                          onClick={() => {
                            setEditing(e);
                            setMode("edit");
                          }}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === e.id}
                          className="text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => void handleDelete(e.id)}
                        >
                          {deletingId === e.id ? "删除中…" : "删除"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
