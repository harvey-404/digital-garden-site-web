import type { TocHeading } from "../../lib/markdown";

interface Props {
  headings: TocHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

export default function TableOfContents({ headings, activeId, onNavigate }: Props) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="文章目录" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        On this page
      </p>
      <ul className="space-y-2 border-l border-[var(--color-border)] pl-3">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <button
              type="button"
              onClick={() => onNavigate(h.id)}
              className={`text-left leading-snug transition hover:text-[var(--color-accent)] ${
                activeId === h.id
                  ? "font-medium text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileTableOfContents({ headings, onNavigate }: Omit<Props, "activeId">) {
  if (headings.length === 0) return null;

  return (
    <details className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:hidden">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-heading)]">
        目录
      </summary>
      <ul className="mt-3 space-y-2 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
            <button
              type="button"
              onClick={() => onNavigate(h.id)}
              className="text-left text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
