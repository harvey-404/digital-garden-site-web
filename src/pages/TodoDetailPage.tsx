import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTodo } from "../api/todos";
import type { TodoDetailVO } from "../types";
import MarkdownView from "../components/MarkdownView";
import Spinner from "../components/Spinner";
import { formatPostDate } from "../lib/markdown";

const priorityMeta: Record<string, { label: string; className: string }> = {
  HIGH: { label: "高优先级", className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  MEDIUM: { label: "中优先级", className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  LOW: { label: "低优先级", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export default function TodoDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [todo, setTodo] = useState<TodoDetailVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getTodo(slug)
      .then(setTodo)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (!todo) return <p className="text-[var(--color-text-muted)]">计划不存在</p>;

  const meta = priorityMeta[todo.priority] ?? priorityMeta.MEDIUM;
  const showUpdated = todo.updateDtm !== todo.inDtm;

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        to="/todos"
        className="mb-6 inline-block text-sm text-[var(--color-accent)] hover:underline"
      >
        ← 返回计划列表
      </Link>

      <header className="mb-8 border-b border-[var(--color-border)] pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
            {meta.label}
          </span>
          <div className="flex items-center gap-2 text-sm text-[var(--color-heading)]">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--color-code-bg)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${todo.progress}%` }}
              />
            </div>
            <span className="tabular-nums font-medium">{todo.progress}%</span>
          </div>
        </div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-tight text-[var(--color-heading)]">
          {todo.title}
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          创建于 {formatPostDate(todo.inDtm)}
          {showUpdated && (
            <>
              <span aria-hidden> · </span>
              更新于 {formatPostDate(todo.updateDtm)}
            </>
          )}
        </p>
      </header>

      {todo.description && (
        <section className="mb-10">
          <h2 className="mb-3 font-serif text-xl font-semibold text-[var(--color-heading)]">描述</h2>
          <p className="leading-relaxed text-[var(--color-text)]">{todo.description}</p>
        </section>
      )}

      {todo.planMd.trim() && (
        <section>
          <h2 className="mb-4 font-serif text-xl font-semibold text-[var(--color-heading)]">计划</h2>
          <MarkdownView content={todo.planMd} variant="article" />
        </section>
      )}
    </article>
  );
}
