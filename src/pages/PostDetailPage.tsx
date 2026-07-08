import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getPost } from "../api/posts";
import { likePost } from "../api/likes";
import { listComments, submitComment } from "../api/comments";
import type { PostDetailVO, CommentVO } from "../types";
import MarkdownView from "../components/MarkdownView";
import Spinner from "../components/Spinner";

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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPost(slug)
      .then((p) => {
        setPost(p);
        setLikeCount(p.likeCount);
        setLiked(localStorage.getItem(LIKED_KEY_PREFIX + p.id) === "1");
        return listComments(p.id);
      })
      .then(setComments)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (!post || liked) return;
    const res = await likePost(post.id);
    setLikeCount(res.likeCount);
    setLiked(true);
    localStorage.setItem(LIKED_KEY_PREFIX + post.id, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    if (!nickname.trim() || !content.trim()) {
      toast.error("昵称和内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await submitComment(post.id, nickname.trim(), content.trim());
      toast.success("评论已提交，待审核通过后显示");
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!post) return <p className="text-slate-400">文章不存在</p>;

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
          {post.tags.map((t) => (
            <span key={t} className="rounded bg-slate-100 px-2 py-0.5">
              #{t}
            </span>
          ))}
          <span className="ml-auto">👁 {post.viewCount}</span>
        </div>
      </header>

      <MarkdownView content={post.contentMd} />

      <div className="flex justify-center">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`rounded-full border px-6 py-2 text-sm transition ${
            liked
              ? "border-red-200 bg-red-50 text-red-400"
              : "hover:border-red-300 hover:text-red-500"
          }`}
        >
          ♥ {liked ? "已赞" : "点赞"} · {likeCount}
        </button>
      </div>

      <section className="border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">评论（{comments.length}）</h2>
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="你的昵称"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="留下你的评论…"
            rows={3}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            提交评论
          </button>
        </form>

        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded border bg-white p-4">
              <div className="text-sm font-medium">{c.nickname}</div>
              <p className="mt-1 text-sm text-slate-600">{c.content}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-slate-400">还没有评论，来抢沙发～</p>
          )}
        </ul>
      </section>
    </article>
  );
}
