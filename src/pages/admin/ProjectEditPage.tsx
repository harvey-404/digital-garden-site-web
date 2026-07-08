import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { listProjects, createProject, updateProject } from "../../api/projects";
import { uploadImage } from "../../api/upload";
import type { ProjectRequest } from "../../types";

const empty: ProjectRequest = {
  title: "", description: "", coverImage: "", projectUrl: "", repoUrl: "", techStack: "", sortOrder: 0,
};

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProjectRequest>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    listProjects().then((all) => {
      const target = all.find((p) => p.id === Number(id));
      if (!target) { toast.error("成果不存在"); return; }
      setForm({
        title: target.title,
        description: target.description ?? "",
        coverImage: target.coverImage ?? "",
        projectUrl: target.projectUrl ?? "",
        repoUrl: target.repoUrl ?? "",
        techStack: target.techStack ?? "",
        sortOrder: target.sortOrder,
      });
    });
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadImage(file);
    setForm((f) => ({ ...f, coverImage: res.url }));
    toast.success("封面已上传");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("项目名不能为空"); return; }
    setSaving(true);
    try {
      if (id) await updateProject(Number(id), form);
      else await createProject(form);
      toast.success("已保存");
      navigate("/admin/projects");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{id ? "编辑成果" : "新建成果"}</h1>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="项目名" className="w-full rounded border px-3 py-2" />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="描述" rows={4} className="w-full rounded border px-3 py-2" />
      <input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="技术栈（如 React, Java）" className="w-full rounded border px-3 py-2" />
      <input value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} placeholder="演示地址" className="w-full rounded border px-3 py-2" />
      <input value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} placeholder="源码地址" className="w-full rounded border px-3 py-2" />
      <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} placeholder="排序（越小越靠前）" className="w-full rounded border px-3 py-2" />
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleUpload} />
        {form.coverImage && <img src={form.coverImage} alt="cover" className="h-12 rounded" />}
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">保存</button>
    </div>
  );
}
