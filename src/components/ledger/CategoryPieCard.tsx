import { formatYuan } from "./ExpenseForm";
import type { CategoryBreakdownItem } from "../../types/ledger";

export const PIE_COLORS = [
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#6d28d9",
  "#c4b5fd",
  "#5b21b6",
  "#ddd6fe",
  "#4c1d95",
];

export function pieColorAt(index: number): string {
  return PIE_COLORS[index % PIE_COLORS.length]!;
}

/** Build CSS conic-gradient from rates that sum ≈ 1. */
export function buildConicGradient(items: CategoryBreakdownItem[]): string {
  if (items.length === 0) return "var(--color-code-bg)";
  let cursor = 0;
  const parts: string[] = [];
  items.forEach((item, i) => {
    const pct = Math.max(0, item.rate) * 100;
    const next = Math.min(100, cursor + pct);
    parts.push(`${pieColorAt(i)} ${cursor}% ${next}%`);
    cursor = next;
  });
  if (cursor < 100) {
    parts.push(`var(--color-code-bg) ${cursor}% 100%`);
  }
  return `conic-gradient(${parts.join(", ")})`;
}

export default function CategoryPieCard({
  items,
}: {
  items: CategoryBreakdownItem[];
}) {
  const gradient = buildConicGradient(items);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
        分类占比
      </h2>
      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          暂无消费
        </p>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="mx-auto h-28 w-28 shrink-0 rounded-full sm:mx-0"
            style={{ background: gradient }}
            role="img"
            aria-label="分类占比饼图"
          />
          <ul className="min-w-0 flex-1 space-y-2">
            {items.map((item, i) => {
              const pct = Math.min(100, Math.max(0, item.rate * 100));
              return (
                <li key={item.categoryId} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: pieColorAt(i) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-[var(--color-heading)]">
                        {item.categoryName}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <p className="tabular-nums text-xs text-[var(--color-text-muted)]">
                      ¥{formatYuan(item.amount)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
