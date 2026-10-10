import { useEffect, useState } from "react";
import { ArrowUpRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { listPosts, searchPosts } from "../api/posts";
import { listTags } from "../api/tags";
import type { PostVO } from "../types";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";
import { EmptyState } from "../components/ui/PagePrimitives";

export default function PostListPage() {
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const size = 10;

  useEffect(() => { listTags().then(setTags).catch(() => {}); }, []);

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      const req = keyword.trim() ? searchPosts(keyword.trim(), page, size) : listPosts(page, size, activeTag);
      req.then((res) => {
        if (!current) return;
        setPosts(res.items);
        setTotal(res.total);
      }).catch(() => {
        if (!current) return;
        setFailed(true);
      }).finally(() => { if (current) setLoading(false); });
    }, keyword.trim() ? 250 : 0);
    return () => { current = false; window.clearTimeout(timer); };
  }, [page, activeTag, keyword]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const visibleTags = showAllTags ? [...tags] : tags.slice(0, 8);
  if (activeTag && !visibleTags.includes(activeTag)) visibleTags.push(activeTag);

  return (
    <div className="garden-archive">
      <header className="garden-page-heading">
        <p className="garden-page-kicker">想法的生长记录</p>
        <h1>灵感<span aria-hidden="true">.</span></h1>
        <p>文章、笔记与想法。有些已经成形，有些还在路上。</p>
      </header>
      <div className="garden-archive-layout">
        <section aria-label="文章列表" className="garden-archive-main">
          <div className="garden-archive-toolbar">
            <p>{keyword.trim() ? "搜索结果" : activeTag || "所有记录"}<span aria-live="polite">{loading ? "加载中" : failed ? "暂时不可用" : total + " 篇"}</span></p>
            <div className="garden-search">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <input type="search" aria-label="搜索文章" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(0); }} placeholder="搜索文章…" />
              {keyword && <button type="button" aria-label="清空搜索" onClick={() => { setKeyword(""); setPage(0); }}><X size={16} /></button>}
            </div>
          </div>
          <div className="garden-tag-filters" aria-label="按标签筛选">
            <button type="button" aria-pressed={!activeTag} className={!activeTag ? "is-active" : ""} onClick={() => { setActiveTag(undefined); setKeyword(""); setPage(0); }}>全部</button>
            {visibleTags.map((tag) => <button type="button" key={tag} aria-pressed={activeTag === tag} className={activeTag === tag ? "is-active" : ""} onClick={() => { setActiveTag(tag); setKeyword(""); setPage(0); }}>{tag}</button>)}
            {tags.length > 8 && <button type="button" aria-expanded={showAllTags} onClick={() => setShowAllTags((value) => !value)}>{showAllTags ? "收起标签" : "更多标签 +"}</button>}
          </div>
          <div className="garden-archive-results" aria-busy={loading}>
            {loading ? <Spinner /> : failed ? (
              <EmptyState>文章暂时未能加载，请刷新页面后重试。</EmptyState>
            ) : (
              <>
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
                {!posts.length && <EmptyState>没有匹配的文章，试试其他关键词或标签。</EmptyState>}
              </>
            )}
          </div>
          <div className="garden-pagination">
            <button type="button" disabled={loading || failed || page <= 0} onClick={() => setPage((value) => value - 1)}>上一页</button>
            <span className="tabular-nums">{page + 1} / {totalPages}</span>
            <button type="button" disabled={loading || failed || page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}>下一页</button>
          </div>
        </section>
        <aside className="garden-archive-aside">
          <div className="garden-archive-note">
            <BookNote />
            <h2>想法不必完整，<br />值得先写下来。</h2>
            <p>这里收着产品灵感、创作尝试，还有一些生活里的观察。边做边写，也边写边想。</p>
            <Link to="/about" className="garden-text-link">认识一下 <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <Link to="/projects" className="garden-aside-link"><span>想法后来怎么样了？<strong>去看看成果</strong></span><ArrowUpRight size={21} aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}

function BookNote() {
  return <span className="garden-note-symbol" aria-hidden="true">“</span>;
}
