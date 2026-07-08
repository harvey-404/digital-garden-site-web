import { useEffect, useState } from "react";
import { listPosts, searchPosts } from "../api/posts";
import { listTags } from "../api/tags";
import type { PostVO } from "../types";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";

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
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          placeholder="搜索文章…"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveTag(undefined); setPage(0); }}
          className={`rounded-full px-3 py-1 text-xs ${!activeTag ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          全部
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTag(t); setKeyword(""); setPage(0); }}
            className={`rounded-full px-3 py-1 text-xs ${activeTag === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            #{t}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
          {posts.length === 0 && <p className="text-slate-400">没有匹配的文章</p>}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-sm">
        <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
          上一页
        </button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
          下一页
        </button>
      </div>
    </div>
  );
}
