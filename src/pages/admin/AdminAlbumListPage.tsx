import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminDeletePlace, adminListPlaces } from "../../api/album";
import type { AlbumPlaceVO } from "../../types/album";
import Spinner from "../../components/Spinner";

export default function AdminAlbumListPage() {
  const [places, setPlaces] = useState<AlbumPlaceVO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminListPlaces(0, 100).then((p) => setPlaces(p.items)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个地点？")) return;
    await adminDeletePlace(id);
    toast.success("已删除");
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">足迹管理</h1>
        <Link to="/admin/album/new" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          新建地点
        </Link>
      </div>
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-3">名称</th>
            <th className="p-3">城市</th>
            <th className="p-3">图数</th>
            <th className="p-3">视频数</th>
            <th className="p-3">状态</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.city || "—"}</td>
              <td className="p-3 tabular-nums">{p.photoCount}</td>
              <td className="p-3 tabular-nums">{p.videoCount}</td>
              <td className="p-3">{p.status === "PUBLISHED" ? "已发布" : "草稿"}</td>
              <td className="p-3 space-x-3">
                <Link to={`/admin/album/${p.id}/edit`} className="text-slate-900 underline">编辑</Link>
                <button type="button" onClick={() => handleDelete(p.id)} className="text-red-500">删除</button>
              </td>
            </tr>
          ))}
          {places.length === 0 && (
            <tr><td colSpan={6} className="p-6 text-center text-slate-400">还没有地点</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
