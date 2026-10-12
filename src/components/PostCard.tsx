import { ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { PostVO } from "../types";
import { formatPostDate } from "../lib/markdown";

export default function PostCard({ post, compact = false }: { post: PostVO; compact?: boolean }) {
  return (
    <Link to={"/posts/" + post.slug} className={"garden-post block " + (compact ? "garden-post--compact" : "")}>
      <div className="garden-post-body">
        <div className="garden-post-meta"><time dateTime={new Date(post.inDtm * 1000).toISOString()}>{formatPostDate(post.inDtm)}</time>{post.tags[0] && <span>{post.tags[0]}</span>}</div>
        <h3>{post.title}</h3>
        {!compact && post.summary && <p className="garden-post-summary">{post.summary}</p>}
        {!compact && <div className="garden-post-bottom"><span className="garden-post-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</span><span>{post.viewCount} 阅读 · {post.likeCount} 赞</span></div>}
      </div>
      {post.coverImage && <img className="garden-post-cover" src={post.coverImage} alt="" width="224" height="168" loading="lazy" />}
      <ArrowUpRight className="garden-post-arrow" size={21} aria-hidden="true" />
    </Link>
  );
}
