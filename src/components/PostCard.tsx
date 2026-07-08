import { Link } from "react-router-dom";
import type { PostVO } from "../types";

export default function PostCard({ post }: { post: PostVO }) {
  return (
    <Link
      to={`/posts/${post.slug}`}
      className="block rounded-lg border bg-white p-5 transition hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
      {post.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{post.summary}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {post.tags.map((t) => (
          <span key={t} className="rounded bg-slate-100 px-2 py-0.5">#{t}</span>
        ))}
        <span className="ml-auto">👁 {post.viewCount} · ♥ {post.likeCount}</span>
      </div>
    </Link>
  );
}
