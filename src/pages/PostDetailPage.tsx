import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getPost } from "../api/posts";
import { likePost } from "../api/likes";
import { listComments, submitComment } from "../api/comments";
import type { PostDetailVO, CommentVO } from "../types";
import MarkdownView from "../components/MarkdownView";
import PostArticleLayout from "../components/post/PostArticleLayout";
import TableOfContents, { MobileTableOfContents } from "../components/post/TableOfContents";
import Spinner from "../components/Spinner";
import { extractHeadings, formatPostDate, normalizeMarkdown } from "../lib/markdown";

const LIKED_KEY_PREFIX = "dg_liked_";

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetailVO | null>(null);
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const headings = useMemo(
    () => (post ? extractHeadings(normalizeMarkdown(post.contentMd)) : []),
    [post],
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPost(slug)
      .then((p) => {
        setPost(p);
        setLikeCount(p.likeCount);
        setLiked(localStorage.getItem(LIKED_KEY_PREFIX + p.id) === "1");
        return listComments(slug);
      })
      .then(setComments)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (loading || headings.length === 0) return;

    let observer: IntersectionObserver | null = null;
    const frame = requestAnimationFrame(() => {
      const elements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null);
      if (elements.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]?.target.id) setActiveHeadingId(visible[0].target.id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
      );

      elements.forEach((el) => observer!.observe(el));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [loading, headings]);

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHeadingId(id);
  };

  const handleLike = async () => {
    if (!post || !slug || liked) return;
    try {
      const res = await likePost(slug);
      setLikeCount(res.likeCount);
      setLiked(res.liked);
      if (res.liked) localStorage.setItem(LIKED_KEY_PREFIX + post.id, "1");
    } catch {
      // apiClient 已 toast
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !slug) return;
    if (!nickname.trim() || !content.trim()) {
      toast.error("昵称和内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await submitComment(slug, nickname.trim(), content.trim());
      toast.success("评论已提交，待审核通过后显示");
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!post) return <p className="text-[var(--color-text-muted)]">文章不存在</p>;

  const interaction = (
    <div className="space-y-10">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleLike}
          disabled={liked}
          title={liked ? "你已赞过此文" : "点个赞"}
          aria-pressed={liked}
          className={`rounded-full border px-6 py-2 text-sm transition disabled:cursor-default ${
            liked
              ? "border-red-400 bg-red-500 text-white shadow-sm"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          }`}
        >
          ♥ {liked ? "已赞" : "点赞"} · {likeCount}
        </button>
      </div>

      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-[var(--color-heading)]">
          评论（{comments.length}）
        </h2>
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="你的昵称"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="留下你的评论…"
            rows={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--color-heading)] px-4 py-2 text-sm text-[var(--color-bg)] disabled:opacity-50"
          >
            提交评论
          </button>
        </form>
        <ul className="space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="text-sm font-medium text-[var(--color-heading)]">{c.nickname}</div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.content}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-[var(--color-text-muted)]">还没有评论，来抢沙发～</p>
          )}
        </ul>
      </section>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        最后更新于 {formatPostDate(post.updatedAt)}
      </p>
    </div>
  );

  return (
    <PostArticleLayout
      title={post.title}
      meta={{
        tags: post.tags,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        viewCount: post.viewCount,
      }}
      mobileToc={<MobileTableOfContents headings={headings} onNavigate={scrollToHeading} />}
      toc={
        <TableOfContents
          headings={headings}
          activeId={activeHeadingId}
          onNavigate={scrollToHeading}
        />
      }
      footer={interaction}
    >
      <MarkdownView content={post.contentMd} variant="article" />
    </PostArticleLayout>
  );
}
