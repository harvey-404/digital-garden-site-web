import { Link } from "react-router-dom";
import type { TodoVO } from "../types";
import { formatPostDate } from "../lib/markdown";

const priorityMeta: Record<string, { label: string; className: string }> = {
  HIGH: { label: "高", className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  MEDIUM: { label: "中", className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  LOW: { label: "低", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export default function TodoCard({ todo }: { todo: TodoVO }) {
  const meta = priorityMeta[todo.priority] ?? priorityMeta.MEDIUM;

  return (
    <Link
      to={`/todos/${todo.slug}`}
      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
              {meta.label}优先级
            </span>
            <h3 className="font-serif text-lg font-semibold text-[var(--color-heading)]">{todo.title}</h3>
          </div>
          {todo.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {todo.description}
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            创建于 {formatPostDate(todo.inDtm)}
          </p>
        </div>
        <div className="w-28 shrink-0 text-right">
          <span className="text-sm font-medium tabular-nums text-[var(--color-heading)]">{todo.progress}%</span>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-code-bg)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, todo.progress))}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
