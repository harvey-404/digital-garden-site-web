import { useEffect, useState } from "react";
import { listTodos } from "../api/todos";
import type { TodoVO } from "../types";
import TodoCard from "../components/TodoCard";
import Spinner from "../components/Spinner";
import { EmptyState, PageHeader, TagPill } from "../components/ui/PagePrimitives";

type FilterKey = "all" | "high" | "active" | "done";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "high", label: "高优先级" },
  { key: "active", label: "进行中" },
  { key: "done", label: "已完成" },
];

function filterParams(key: FilterKey) {
  switch (key) {
    case "high":
      return { priority: "HIGH" };
    case "active":
      return { minProgress: 1, maxProgress: 99 };
    case "done":
      return { minProgress: 100, maxProgress: 100 };
    default:
      return {};
  }
}

export default function TodoListPage() {
  const [todos, setTodos] = useState<TodoVO[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const size = 10;

  useEffect(() => {
    setLoading(true);
    listTodos(page, size, filterParams(filter))
      .then((res) => {
        setTodos(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, filter]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="space-y-6">
      <PageHeader
        title="计划"
        description="一些正在想、准备做的事情。按优先级与进度追踪。"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <TagPill
            key={f.key}
            active={filter === f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(0);
            }}
          >
            {f.label}
          </TagPill>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4">
          {todos.map((t) => (
            <TodoCard key={t.id} todo={t} />
          ))}
          {todos.length === 0 && <EmptyState>还没有已发布的计划</EmptyState>}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        >
          上一页
        </button>
        <span className="tabular-nums">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
