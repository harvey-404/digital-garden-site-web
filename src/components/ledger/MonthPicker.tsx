import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const MONTH_RE = /^\d{4}-\d{2}$/;

const inputClass =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

const btnClass =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";

/** Current calendar month in Asia/Shanghai as `YYYY-MM`. */
export function currentMonthShanghai(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

/** Shift `YYYY-MM` by `delta` months (calendar arithmetic). */
export function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** Format budget_dtm (Shanghai month start epoch) as `YYYY-MM`. */
export function epochToMonthShanghai(epochSec: number): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date(epochSec * 1000))
    .slice(0, 7);
}

/**
 * Shared month query param (`?month=YYYY-MM`) across ledger pages.
 * Invalid/missing → current Shanghai month.
 */
export function useLedgerMonth(): [string, (month: string) => void] {
  const [params, setParams] = useSearchParams();

  const month = useMemo(() => {
    const q = params.get("month");
    return q && MONTH_RE.test(q) ? q : currentMonthShanghai();
  }, [params]);

  const setMonth = useCallback(
    (m: string) => {
      if (!MONTH_RE.test(m)) return;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("month", m);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [month, setMonth];
}

export function formatMonthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  if (!y || !m) return yyyyMm;
  return `${y}年${m}月`;
}

export default function MonthPicker({
  value,
  onChange,
  variant = "default",
}: {
  value: string;
  onChange: (month: string) => void;
  /** `bar` — shell 常驻条：‹ 中文月 › 本月 */
  variant?: "default" | "bar";
}) {
  if (variant === "bar") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          className={btnClass}
          onClick={() => onChange(shiftMonth(value, -1))}
          aria-label="上一月"
        >
          ‹
        </button>
        <span className="min-w-[6.5rem] text-center text-sm font-semibold text-[var(--color-heading)]">
          {formatMonthLabel(value)}
        </span>
        <button
          type="button"
          className={btnClass}
          onClick={() => onChange(shiftMonth(value, 1))}
          aria-label="下一月"
        >
          ›
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => onChange(currentMonthShanghai())}
        >
          本月
        </button>
        <input
          type="month"
          value={value}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className={`${inputClass} max-w-[9.5rem]`}
          aria-label="选择月份"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btnClass} onClick={() => onChange(shiftMonth(value, -1))} aria-label="上一月">
        ‹
      </button>
      <input
        type="month"
        value={value}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className={inputClass}
        aria-label="选择月份"
      />
      <button type="button" className={btnClass} onClick={() => onChange(shiftMonth(value, 1))} aria-label="下一月">
        ›
      </button>
      <button type="button" className={btnClass} onClick={() => onChange(currentMonthShanghai())}>
        本月
      </button>
    </div>
  );
}
