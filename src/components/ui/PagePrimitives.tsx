import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 border-b border-[var(--color-border)] pb-6">
      <h1 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-tight text-[var(--color-heading)]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-[var(--color-text-muted)]">{description}</p>
      )}
    </header>
  );
}

export function SectionHeader({
  title,
  to,
  linkLabel = "查看全部 →",
}: {
  title: string;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between border-b border-[var(--color-border)] pb-3">
      <h2 className="font-serif text-xl font-semibold text-[var(--color-heading)]">{title}</h2>
      {to && (
        <Link
          to={to}
          className="text-sm text-[var(--color-accent)] transition hover:text-[var(--color-accent-hover)]"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}

export function TagPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = active
    ? "bg-[var(--color-accent)] text-white"
    : "bg-[var(--color-code-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-3 py-1 text-xs transition ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${className}`}>#{children}</span>
  );
}
