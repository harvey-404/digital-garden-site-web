import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  adminAddPhoto,
  adminAddVideo,
  adminCreatePlace,
  adminDeletePhoto,
  adminDeleteVideo,
  adminGetPlace,
  adminUpdatePhoto,
  adminUpdatePlace,
} from "../../api/album";
import { uploadImage } from "../../api/upload";
import type {
  AlbumPhotoVO,
  AlbumPlaceRequest,
  AlbumVideoRequest,
  AlbumVideoVO,
} from "../../types/album";

const empty: AlbumPlaceRequest = {
  name: "",
  address: "",
  city: "",
  lat: 0,
  lng: 0,
  note: "",
  sortOrder: 0,
  status: "DRAFT",
};

const emptyVideo: AlbumVideoRequest = {
  url: "",
  title: "",
  platform: "other",
};

function detectPlatform(url: string): string {
  if (/bilibili\.com|b23\.tv/i.test(url)) return "bilibili";
  return "other";
}

export default function AlbumEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const placeId = id ? Number(id) : null;
  const [form, setForm] = useState<AlbumPlaceRequest>(empty);
  const [photos, setPhotos] = useState<AlbumPhotoVO[]>([]);
  const [videos, setVideos] = useState<AlbumVideoVO[]>([]);
  const [videoForm, setVideoForm] = useState<AlbumVideoRequest>(emptyVideo);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadDetail = () => {
    if (!placeId) return;
    adminGetPlace(placeId).then((detail) => {
      setForm({
        name: detail.name,
        address: detail.address ?? "",
        city: detail.city ?? "",
        lat: detail.lat,
        lng: detail.lng,
        note: detail.note ?? "",
        sortOrder: detail.sortOrder,
        status: detail.status,
      });
      setPhotos(detail.photos ?? []);
      setVideos(detail.videos ?? []);
    }).catch(() => toast.error("地点不存在"));
  };

  useEffect(loadDetail, [placeId]);

  const handleSave = async (status: string) => {
    const body: AlbumPlaceRequest = { ...form, status };
    if (!body.name.trim()) {
      toast.error("名称不能为空");
      return;
    }
    if (!body.lat || !body.lng) {
      toast.error("请填写经纬度");
      return;
    }
    setSaving(true);
    try {
      if (placeId) {
        await adminUpdatePlace(placeId, body);
        toast.success("已保存");
        loadDetail();
      } else {
        const created = await adminCreatePlace(body);
        toast.success("已保存");
        navigate(`/admin/album/${created.id}/edit`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !placeId) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      await adminAddPhoto(placeId, { fileUrl: res.url });
      toast.success("图片已添加");
      loadDetail();
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoCaption = async (photo: AlbumPhotoVO, caption: string) => {
    await adminUpdatePhoto(photo.id, { fileUrl: photo.fileUrl, caption });
    loadDetail();
  };

  const handlePhotoDelete = async (photoId: number) => {
    if (!confirm("确定删除这张图片？")) return;
    await adminDeletePhoto(photoId);
    toast.success("已删除");
    loadDetail();
  };

  const handleVideoAdd = async () => {
    if (!placeId) return;
    if (!videoForm.url.trim()) {
      toast.error("视频链接不能为空");
      return;
    }
    const body: AlbumVideoRequest = {
      ...videoForm,
      platform: videoForm.platform || detectPlatform(videoForm.url),
    };
    await adminAddVideo(placeId, body);
    toast.success("视频已添加");
    setVideoForm(emptyVideo);
    loadDetail();
  };

  const handleVideoDelete = async (videoId: number) => {
    if (!confirm("确定删除这条视频？")) return;
    await adminDeleteVideo(videoId);
    toast.success("已删除");
    loadDetail();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{placeId ? "编辑地点" : "新建地点"}</h1>

      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="名称"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={form.address ?? ""}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        placeholder="地址"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={form.city ?? ""}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        placeholder="城市"
        className="w-full rounded border px-3 py-2"
      />
      <textarea
        value={form.note ?? ""}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="备注"
        rows={3}
        className="w-full rounded border px-3 py-2"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          纬度
          <input
            type="number"
            step="any"
            value={form.lat || ""}
            onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          经度
          <input
            type="number"
            step="any"
            value={form.lng || ""}
            onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          排序（越小越靠前）
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          状态
          <select
            value={form.status ?? "DRAFT"}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
          </select>
        </label>
      </div>

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

      {placeId ? (
        <>
          <section className="space-y-3 rounded border bg-white p-4">
            <h2 className="font-medium">图片</h2>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handlePhotoUpload}
            />
            <ul className="space-y-3">
              {photos.map((photo) => (
                <li key={photo.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                  <img src={photo.fileUrl} alt="" className="h-16 w-16 rounded object-cover" />
                  <input
                    value={photo.caption ?? ""}
                    onChange={(e) => setPhotos((prev) =>
                      prev.map((p) => (p.id === photo.id ? { ...p, caption: e.target.value } : p)),
                    )}
                    onBlur={(e) => handlePhotoCaption(photo, e.target.value)}
                    placeholder="说明文字"
                    className="flex-1 rounded border px-2 py-1 text-sm"
                  />
                  <button type="button" onClick={() => handlePhotoDelete(photo.id)} className="text-sm text-red-500">
                    删除
                  </button>
                </li>
              ))}
              {photos.length === 0 && <li className="text-sm text-slate-400">还没有图片</li>}
            </ul>
          </section>

          <section className="space-y-3 rounded border bg-white p-4">
            <h2 className="font-medium">视频链接</h2>
            <input
              value={videoForm.url}
              onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value, platform: detectPlatform(e.target.value) })}
              placeholder="视频 URL"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={videoForm.title ?? ""}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="标题（可选）"
                className="rounded border px-3 py-2 text-sm"
              />
              <select
                value={videoForm.platform ?? "other"}
                onChange={(e) => setVideoForm({ ...videoForm, platform: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="bilibili">bilibili</option>
                <option value="other">other</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleVideoAdd}
              className="rounded border px-3 py-1.5 text-sm"
            >
              添加视频
            </button>
            <ul className="space-y-2">
              {videos.map((video) => (
                <li key={video.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{video.title || video.url}</div>
                    <div className="truncate text-slate-500">{video.platform} · {video.url}</div>
                  </div>
                  <button type="button" onClick={() => handleVideoDelete(video.id)} className="shrink-0 text-red-500">
                    删除
                  </button>
                </li>
              ))}
              {videos.length === 0 && <li className="text-slate-400">还没有视频</li>}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-500">保存地点后可添加图片与视频。</p>
      )}
    </div>
  );
}
