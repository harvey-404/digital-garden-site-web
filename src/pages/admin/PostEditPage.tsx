import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { adminGetPost, createPost, updatePost } from "../../api/posts";
import { uploadImage } from "../../api/upload";
import type { PostRequest } from "../../types";
import MarkdownView from "../../components/MarkdownView";

const empty: PostRequest = {
  title: "", slug: "", contentMd: "", summary: "", coverImage: "", status: "DRAFT", tags: [],
};

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<PostRequest>(empty);
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetPost(Number(id)).then((detail) => {
      setForm({
        title: detail.title,
        slug: detail.slug,
        contentMd: detail.contentMd,
        summary: detail.summary ?? "",
        coverImage: detail.coverImage ?? "",
        status: detail.status,
        tags: detail.tags,
      });
      setTagsInput(detail.tags.join(", "));
    }).catch(() => toast.error("文章不存在"));
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadImage(file);
    setForm((f) => ({ ...f, coverImage: res.url }));
    toast.success("封面已上传");
  };

  const handleSave = async (status: string) => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const body: PostRequest = { ...form, status, tags };
    if (!body.title.trim() || !body.slug.trim() || !body.contentMd.trim()) {
      toast.error("标题、slug、正文不能为空");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updatePost(Number(id), body);
      } else {
        await createPost(body);
      }
      toast.success("已保存");
      navigate("/admin/posts");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{id ? "编辑文章" : "新建文章"}</h1>

      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="标题"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="slug（URL 标识，如 my-first-post）"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={form.summary}
        onChange={(e) => setForm({ ...form, summary: e.target.value })}
        placeholder="摘要"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="标签（逗号分隔，如 随笔, 技术）"
        className="w-full rounded border px-3 py-2"
      />

      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleUpload} />
        {form.coverImage && <img src={form.coverImage} alt="cover" className="h-12 rounded" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={form.contentMd}
          onChange={(e) => setForm({ ...form, contentMd: e.target.value })}
          placeholder="正文（Markdown）"
          rows={20}
          className="w-full rounded border px-3 py-2 font-mono text-sm"
        />
        <div className="rounded border bg-white p-4">
          <MarkdownView content={form.contentMd || "_预览区_"} variant="article" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleSave("DRAFT")} disabled={saving} className="rounded border px-4 py-2 text-sm">
          存为草稿
        </button>
        <button onClick={() => handleSave("PUBLISHED")} disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          发布
        </button>
      </div>
    </div>
  );
}
