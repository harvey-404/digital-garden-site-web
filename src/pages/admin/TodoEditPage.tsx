import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { adminGetTodo, createTodo, updateTodo } from "../../api/todos";
import type { TodoRequest } from "../../types";
import MarkdownView from "../../components/MarkdownView";

const empty: TodoRequest = {
  title: "",
  slug: "",
  description: "",
  planMd: "",
  priority: "MEDIUM",
  progress: 0,
  status: "DRAFT",
  sortOrder: 0,
};

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TodoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<TodoRequest>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetTodo(Number(id)).then((detail) => {
      setForm({
        title: detail.title,
        slug: detail.slug,
        description: detail.description,
        planMd: detail.planMd,
        priority: detail.priority,
        progress: detail.progress,
        status: detail.status,
        sortOrder: detail.sortOrder,
      });
    }).catch(() => toast.error("计划不存在"));
  }, [id]);

  const handleSave = async (status: string) => {
    const body: TodoRequest = { ...form, status };
    if (!body.title.trim() || !body.slug.trim()) {
      toast.error("标题和 slug 不能为空");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateTodo(Number(id), body);
      } else {
        await createTodo(body);
      }
      toast.success("已保存");
      navigate("/admin/todos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{id ? "编辑计划" : "新建计划"}</h1>

      <input
        value={form.title}
        onChange={(e) => {
          const title = e.target.value;
          setForm((f) => ({
            ...f,
            title,
            slug: f.slug || slugify(title),
          }));
        }}
        placeholder="标题"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="slug（URL 标识）"
        className="w-full rounded border px-3 py-2"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="简短描述（列表卡片展示）"
        rows={3}
        className="w-full rounded border px-3 py-2"
      />
      <textarea
        value={form.planMd}
        onChange={(e) => setForm({ ...form, planMd: e.target.value })}
        placeholder="详细计划（Markdown）"
        rows={12}
        className="w-full rounded border px-3 py-2 font-mono text-sm"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          优先级
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TodoRequest["priority"] })}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </label>
        <label className="block text-sm">
          排序（越小越靠前）
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        进度 {form.progress}%
        <input
          type="range"
          min={0}
          max={100}
          value={form.progress ?? 0}
          onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
          className="mt-2 w-full"
        />
      </label>

      {(form.planMd ?? "").trim() && (
        <div className="rounded border bg-white p-4">
          <div className="mb-2 text-sm font-medium text-slate-500">计划预览</div>
          <MarkdownView content={form.planMd ?? ""} variant="article" />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("DRAFT")}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          存为草稿
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("PUBLISHED")}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          发布
        </button>
      </div>
    </div>
  );
}
