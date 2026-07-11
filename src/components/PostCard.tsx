import { Link } from "react-router-dom";
import type { PostVO } from "../types";
import { formatPostDate } from "../lib/markdown";

export default function PostCard({ post }: { post: PostVO }) {
  return (
    <Link
      to={`/posts/${post.slug}`}
      className="group block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
    >
      <h3 className="font-serif text-lg font-semibold text-[var(--color-heading)] transition group-hover:text-[var(--color-accent)]">
        {post.title}
      </h3>
      {post.summary && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {post.summary}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time>
        {post.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-[var(--color-code-bg)] px-2 py-0.5 text-[var(--color-accent)]"
          >
            #{t}
          </span>
        ))}
        <span className="ml-auto tabular-nums">
          {post.viewCount} 阅读 · {post.likeCount} 赞
        </span>
      </div>
    </Link>
  );
}
