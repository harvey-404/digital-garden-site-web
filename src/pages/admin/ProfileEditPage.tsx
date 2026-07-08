import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../../api/profile";
import { uploadImage } from "../../api/upload";
import type { ProfileVO } from "../../types";

export default function ProfileEditPage() {
  const [form, setForm] = useState<ProfileVO>({ displayName: "", avatarUrl: "", bio: "", socialLinks: "[]" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) =>
      setForm({
        displayName: p.displayName ?? "",
        avatarUrl: p.avatarUrl ?? "",
        bio: p.bio ?? "",
        socialLinks: p.socialLinks ?? "[]",
      })
    );
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadImage(file);
    setForm((f) => ({ ...f, avatarUrl: res.url }));
    toast.success("头像已上传");
  };

  const handleSave = async () => {
    try {
      JSON.parse(form.socialLinks || "[]");
    } catch {
      toast.error("社交链接 JSON 格式不正确");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("已保存");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">关于我</h1>
      <input value={form.displayName ?? ""} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="显示名称" className="w-full rounded border px-3 py-2" />
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleUpload} />
        {form.avatarUrl && <img src={form.avatarUrl} alt="avatar" className="h-12 w-12 rounded-full object-cover" />}
      </div>
      <textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="简介" rows={5} className="w-full rounded border px-3 py-2" />
      <textarea
        value={form.socialLinks ?? "[]"}
        onChange={(e) => setForm({ ...form, socialLinks: e.target.value })}
        placeholder='社交链接 JSON，如 [{"name":"GitHub","url":"https://github.com/harvey-404"}]'
        rows={3}
        className="w-full rounded border px-3 py-2 font-mono text-sm"
      />
      <button onClick={handleSave} disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">保存</button>
    </div>
  );
}
