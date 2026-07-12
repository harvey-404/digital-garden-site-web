import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminListTodos, deleteTodo } from "../../api/todos";
import type { TodoVO } from "../../types";
import Spinner from "../../components/Spinner";

const priorityLabel: Record<string, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export default function AdminTodoListPage() {
  const [todos, setTodos] = useState<TodoVO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminListTodos(0, 100).then((p) => setTodos(p.items)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条计划？")) return;
    await deleteTodo(id);
    toast.success("已删除");
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">计划管理</h1>
        <Link to="/admin/todos/new" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          新建计划
        </Link>
      </div>
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-3">标题</th>
            <th className="p-3">优先级</th>
            <th className="p-3">进度</th>
            <th className="p-3">状态</th>
            <th className="p-3">排序</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-3">{t.title}</td>
              <td className="p-3">{priorityLabel[t.priority] ?? t.priority}</td>
              <td className="p-3 tabular-nums">{t.progress}%</td>
              <td className="p-3">{t.status === "PUBLISHED" ? "已发布" : "草稿"}</td>
              <td className="p-3 tabular-nums">{t.sortOrder}</td>
              <td className="p-3 space-x-3">
                <Link to={`/admin/todos/${t.id}/edit`} className="text-slate-900 underline">编辑</Link>
                <button type="button" onClick={() => handleDelete(t.id)} className="text-red-500">删除</button>
              </td>
            </tr>
          ))}
          {todos.length === 0 && (
            <tr><td colSpan={6} className="p-6 text-center text-slate-400">还没有计划</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
