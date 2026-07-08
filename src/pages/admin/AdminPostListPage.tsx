import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminListPosts, deletePost } from "../../api/posts";
import type { PostVO } from "../../types";
import Spinner from "../../components/Spinner";

export default function AdminPostListPage() {
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminListPosts(0, 100).then((p) => setPosts(p.items)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这篇文章？")) return;
    await deletePost(id);
    toast.success("已删除");
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link to="/admin/posts/new" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          新建文章
        </Link>
      </div>
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-3">标题</th>
            <th className="p-3">状态</th>
            <th className="p-3">阅读/点赞</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-3">{p.title}</td>
              <td className="p-3">{p.status === "PUBLISHED" ? "已发布" : "草稿"}</td>
              <td className="p-3">{p.viewCount} / {p.likeCount}</td>
              <td className="p-3 space-x-3">
                <Link to={`/admin/posts/${p.id}/edit`} className="text-slate-900 underline">编辑</Link>
                <button onClick={() => handleDelete(p.id)} className="text-red-500">删除</button>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr><td colSpan={4} className="p-6 text-center text-slate-400">还没有文章</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
