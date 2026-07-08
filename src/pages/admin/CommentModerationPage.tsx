import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminListComments, approveComment, deleteComment } from "../../api/comments";
import type { CommentVO } from "../../types";
import Spinner from "../../components/Spinner";

export default function CommentModerationPage() {
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const load = (s: string) => {
    setLoading(true);
    adminListComments(s).then(setComments).finally(() => setLoading(false));
  };

  useEffect(() => load(status), [status]);

  const handleApprove = async (id: number) => {
    await approveComment(id);
    toast.success("已通过");
    load(status);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该评论？")) return;
    await deleteComment(id);
    toast.success("已删除");
    load(status);
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">评论审核</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-2 py-1 text-sm">
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{c.nickname}<span className="ml-2 text-xs text-slate-400">文章#{c.postId}</span></div>
                <div className="space-x-3 text-sm">
                  {c.status === "PENDING" && (
                    <button onClick={() => handleApprove(c.id)} className="text-green-600">通过</button>
                  )}
                  <button onClick={() => handleDelete(c.id)} className="text-red-500">删除</button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{c.content}</p>
            </li>
          ))}
          {comments.length === 0 && <p className="text-slate-400">暂无评论</p>}
        </ul>
      )}
    </div>
  );
}
