import type { ReactNode } from "react";
import { formatPostDate } from "../../lib/markdown";

interface Props {
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

function PostMeta({ tags, createdAt, updatedAt, viewCount }: Props) {
  const showUpdated = updatedAt && updatedAt !== createdAt;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-text-muted)]">
      <span>发布于 {formatPostDate(createdAt)}</span>
      {showUpdated && (
        <>
          <span aria-hidden>·</span>
          <span>更新于 {formatPostDate(updatedAt)}</span>
        </>
      )}
      {tags.length > 0 && (
        <>
          <span aria-hidden>·</span>
          <span className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--color-code-bg)] px-2 py-0.5 text-xs text-[var(--color-accent)]"
              >
                #{t}
              </span>
            ))}
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>{viewCount.toLocaleString()} 次阅读</span>
    </div>
  );
}

interface LayoutProps {
  title: string;
  meta: Props;
  toc?: ReactNode;
  mobileToc?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export default function PostArticleLayout({
  title,
  meta,
  toc,
  mobileToc,
  footer,
  children,
}: LayoutProps) {
  return (
    <article>
      <header className="mb-8 border-b border-[var(--color-border)] pb-8">
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-tight tracking-tight text-[var(--color-heading)]">
          {title}
        </h1>
        <div className="mt-4">
          <PostMeta {...meta} />
        </div>
      </header>

      {mobileToc}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,42rem)_14rem] lg:justify-between">
        <div className="min-w-0">{children}</div>
        {toc && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">{toc}</div>
          </aside>
        )}
      </div>

      {footer && <footer className="mt-12 border-t border-[var(--color-border)] pt-8">{footer}</footer>}
    </article>
  );
}
