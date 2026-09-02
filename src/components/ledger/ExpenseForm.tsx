import { useState } from "react";
import type { LedgerCategoryVO, LedgerExpenseRequest } from "../../types/ledger";

const MAX_AMOUNT = 999999.99;

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

const labelClass = "block space-y-2";
const labelTextClass = "text-sm text-[var(--color-text-muted)]";

export function toDatetimeLocalValue(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function formatYuan(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ExpenseFormProps {
  categories: LedgerCategoryVO[];
  initial?: Partial<LedgerExpenseRequest>;
  submitLabel?: string;
  onSubmit: (body: LedgerExpenseRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function ExpenseForm({
  categories,
  initial,
  submitLabel = "保存",
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [categoryId, setCategoryId] = useState(
    () => String(initial?.categoryId ?? categories[0]?.id ?? ""),
  );
  const [amount, setAmount] = useState(() =>
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [description, setDescription] = useState(() => initial?.description ?? "");
  const [recordedLocal, setRecordedLocal] = useState(() =>
    toDatetimeLocalValue(initial?.recordedAt ?? Math.floor(Date.now() / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const catId = Number(categoryId);
    if (!Number.isFinite(catId) || catId <= 0) {
      setError("请选择分类");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > MAX_AMOUNT) {
      setError(`金额须大于 0 且不超过 ${MAX_AMOUNT}`);
      return;
    }
    const recordedAt = fromDatetimeLocalValue(recordedLocal);
    if (!Number.isFinite(recordedAt) || recordedAt <= 0) {
      setError("请选择有效日期");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        categoryId: catId,
        amount: amt,
        description: description.trim(),
        recordedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">请先在「分类」页添加至少一个分类。</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        <span className={labelTextClass}>分类</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>金额（元）</span>
        <input
          type="number"
          inputMode="decimal"
          min={0.01}
          max={MAX_AMOUNT}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="例如 36.5"
          className={inputClass}
          required
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>备注（可选）</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="吃了什么、买了什么…"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>记账时间（可预录未来）</span>
        <input
          type="datetime-local"
          value={recordedLocal}
          onChange={(e) => setRecordedLocal(e.target.value)}
          className={inputClass}
          required
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "保存中…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
