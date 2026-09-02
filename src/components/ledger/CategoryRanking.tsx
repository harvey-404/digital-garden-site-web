import { useEffect } from "react";
import { formatYuan } from "./ExpenseForm";
import { pieColorAt } from "./CategoryPieCard";

export type RankRow = {
  categoryId: number;
  categoryName: string;
  amount: number;
  rate: number;
  count: number;
};

const MEDALS = [
  { emoji: "🥇", label: "冠军", order: 1 },
  { emoji: "🥈", label: "亚军", order: 2 },
  { emoji: "🥉", label: "季军", order: 3 },
] as const;

/** Display order on podium: silver | gold | bronze */
const PODIUM_SLOTS = [1, 0, 2] as const;

export function CategoryPodium({
  ranks,
  onOpenFull,
}: {
  ranks: RankRow[];
  onOpenFull: () => void;
}) {
  const top3 = ranks.slice(0, 3);
  const heights = ["h-16", "h-24", "h-12"]; // for slots silver, gold, bronze visual bars

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:space-y-4 sm:p-6">
      <h2 className="font-serif text-base font-semibold text-[var(--color-heading)] sm:text-lg">
        本月排行
      </h2>

      {top3.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)] sm:py-6">
          暂无消费
        </p>
      ) : (
        <div className="grid grid-cols-3 items-end gap-1 sm:gap-4">
          {PODIUM_SLOTS.map((rankIdx, slot) => {
            const row = top3[rankIdx];
            const medal = MEDALS[rankIdx];
            if (!row || !medal) {
              return <div key={slot} />;
            }
            return (
              <div key={row.categoryId} className="flex min-w-0 flex-col items-center text-center">
                <span className="text-xl sm:text-3xl" aria-label={medal.label}>
                  {medal.emoji}
                </span>
                <p className="mt-1 line-clamp-2 w-full px-0.5 text-[11px] font-semibold leading-tight text-[var(--color-heading)] sm:text-sm">
                  {row.categoryName}
                </p>
                <p className="mt-0.5 max-w-full truncate tabular-nums text-xs font-bold text-[var(--color-accent)] sm:text-base">
                  ¥{formatYuan(row.amount)}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">
                  <span className="sm:hidden">{row.count} 次</span>
                  <span className="hidden sm:inline">
                    {row.count} 次 · {medal.label}
                  </span>
                </p>
                <div
                  className={`mt-1.5 w-full max-w-[4rem] rounded-t-lg sm:mt-2 sm:max-w-[5.5rem] ${heights[slot]}`}
                  style={{
                    background: pieColorAt(rankIdx),
                    opacity: 0.35 + (2 - rankIdx) * 0.2,
                  }}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onOpenFull}
          className="text-sm font-medium text-[var(--color-accent)] transition hover:underline"
        >
          查看全部排行榜 →
        </button>
      </div>
    </section>
  );
}

export function RankingDrawer({
  open,
  onClose,
  ranks,
  monthLabel,
}: {
  open: boolean;
  onClose: () => void;
  ranks: RankRow[];
  monthLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭排行榜"
        onClick={onClose}
      />
      <aside
        className="relative flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-[var(--color-bg)] shadow-xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none"
        role="dialog"
        aria-modal
        aria-labelledby="ranking-drawer-title"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-border)] sm:hidden" />
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h2
              id="ranking-drawer-title"
              className="font-serif text-lg font-semibold text-[var(--color-heading)]"
            >
              全部排行榜
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">{monthLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--color-accent)] hover:bg-[var(--color-code-bg)]"
          >
            关闭
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-4 py-3">
          {ranks.length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              暂无消费
            </li>
          ) : (
            ranks.map((row, i) => {
              const pct = Math.min(100, Math.max(0, row.rate * 100));
              const barPct =
                ranks[0] && ranks[0].amount > 0
                  ? Math.min(100, (row.amount / ranks[0].amount) * 100)
                  : 0;
              return (
                <li
                  key={row.categoryId}
                  className="border-b border-[var(--color-border)] py-3 last:border-0"
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-[var(--color-heading)]">
                      <span className="mr-2 tabular-nums text-[var(--color-text-muted)]">
                        {i + 1}.
                      </span>
                      {row.categoryName}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-[var(--color-heading)]">
                      ¥{formatYuan(row.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-code-bg)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: pieColorAt(i),
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {pct.toFixed(1)}% · {row.count} 次
                  </p>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
}
