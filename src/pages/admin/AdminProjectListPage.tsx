import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { listProjects, deleteProject } from "../../api/projects";
import type { ProjectVO } from "../../types";
import Spinner from "../../components/Spinner";

export default function AdminProjectListPage() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listProjects().then(setProjects).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个成果？")) return;
    await deleteProject(id);
    toast.success("已删除");
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">成果管理</h1>
        <Link to="/admin/projects/new" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          新建成果
        </Link>
      </div>
      <div className="grid gap-4">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded border bg-white p-4">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-slate-400">{p.techStack}</div>
            </div>
            <div className="space-x-3 text-sm">
              <Link to={`/admin/projects/${p.id}/edit`} className="text-slate-900 underline">编辑</Link>
              <button onClick={() => handleDelete(p.id)} className="text-red-500">删除</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && <p className="text-slate-400">还没有成果</p>}
      </div>
    </div>
  );
}
