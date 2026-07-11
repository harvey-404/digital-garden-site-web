import { useEffect, useState } from "react";
import { listPosts, searchPosts } from "../api/posts";
import { listTags } from "../api/tags";
import type { PostVO } from "../types";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";
import { EmptyState, PageHeader, TagPill } from "../components/ui/PagePrimitives";

export default function PostListPage() {
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const size = 10;

  useEffect(() => {
    listTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const req = keyword.trim()
      ? searchPosts(keyword.trim(), page, size)
      : listPosts(page, size, activeTag);
    req
      .then((res) => {
        setPosts(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, activeTag, keyword]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="space-y-6">
      <PageHeader
        title="灵感"
        description="文章、笔记与想法。支持标签筛选与全文搜索。"
      />

      <div className="relative">
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          placeholder="搜索文章…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 pl-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        <TagPill active={!activeTag} onClick={() => { setActiveTag(undefined); setPage(0); }}>
          全部
        </TagPill>
        {tags.map((t) => (
          <TagPill
            key={t}
            active={activeTag === t}
            onClick={() => {
              setActiveTag(t);
              setKeyword("");
              setPage(0);
            }}
          >
            {t}
          </TagPill>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {posts.length === 0 && <EmptyState>没有匹配的文章</EmptyState>}
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
