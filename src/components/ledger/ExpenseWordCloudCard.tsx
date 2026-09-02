import { useMemo } from "react";
import type { LedgerExpenseVO } from "../../types/ledger";

export type WordCloudToken = { text: string; weight: number };

/** Split notes into tokens; empty note → category name fallback. */
export function buildWordCloudTokens(
  expenses: LedgerExpenseVO[],
  categoryName: (categoryId: number) => string,
): WordCloudToken[] {
  const counts = new Map<string, number>();

  for (const e of expenses) {
    const raw = e.description?.trim() ?? "";
    const tokens: string[] = [];
    if (raw) {
      const parts = raw
        .split(/[\s,，、;；|/]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        tokens.push(...parts);
      } else if (raw.length <= 12) {
        tokens.push(raw);
      } else {
        // Long unbroken string: keep first 8 chars as a label
        tokens.push(raw.slice(0, 8));
      }
    } else {
      tokens.push(categoryName(e.categoryId) || "消费");
    }
    for (const t of tokens) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([text, weight]) => ({ text, weight }))
    .sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text, "zh"))
    .slice(0, 40);
}

const ROTATIONS = [-8, -4, 0, 3, 6, -6, 4, -2];

export default function ExpenseWordCloudCard({
  expenses,
  categoryName,
}: {
  expenses: LedgerExpenseVO[];
  categoryName: (categoryId: number) => string;
}) {
  const tokens = useMemo(
    () => buildWordCloudTokens(expenses, categoryName),
    [expenses, categoryName],
  );

  const maxW = tokens[0]?.weight ?? 1;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
        词云
      </h2>
      {tokens.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          暂无消费
        </p>
      ) : (
        <div className="relative mt-3 flex min-h-[10rem] flex-1 flex-wrap content-center items-center justify-center gap-x-3 gap-y-2 overflow-hidden rounded-xl bg-[var(--color-code-bg)]/40 px-3 py-4">
          {tokens.map((t, i) => {
            const ratio = t.weight / maxW;
            const fontSize = 0.75 + ratio * 1.15; // rem
            const opacity = 0.55 + ratio * 0.45;
            const rot = ROTATIONS[i % ROTATIONS.length]!;
            return (
              <span
                key={`${t.text}-${i}`}
                title={`${t.text} · ${t.weight}次`}
                className="select-none font-semibold leading-none text-[var(--color-accent)]"
                style={{
                  fontSize: `${fontSize}rem`,
                  opacity,
                  transform: `rotate(${rot}deg)`,
                }}
              >
                {t.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
