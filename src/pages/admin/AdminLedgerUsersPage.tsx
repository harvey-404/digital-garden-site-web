import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  adminCreateLedgerUser,
  adminListLedgerUsers,
  adminSetLedgerUserStatus,
} from "../../api/ledger";
import type { LedgerUserAdminVO } from "../../types/ledger";
import Spinner from "../../components/Spinner";

function statusLabel(status: string): string {
  if (status === "active") return "正常";
  if (status === "disabled") return "已禁用";
  return status;
}

export default function AdminLedgerUsersPage() {
  const [users, setUsers] = useState<LedgerUserAdminVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminListLedgerUsers()
      .then(setUsers)
      .catch(() => toast.error("加载账本用户失败"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await adminCreateLedgerUser();
      toast.success(`已创建：唯一码 ${created.inviteCode}`);
      load();
    } catch {
      toast.error("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: LedgerUserAdminVO) => {
    const next = user.status === "active" ? "disabled" : "active";
    const confirmMsg =
      next === "disabled"
        ? `确定禁用用户 ${user.userSn}？禁用后无法登录。`
        : `确定恢复用户 ${user.userSn}？`;
    if (!confirm(confirmMsg)) return;

    setBusyId(user.id);
    try {
      await adminSetLedgerUserStatus(user.id, next);
      toast.success(next === "disabled" ? "已禁用" : "已恢复");
      load();
    } catch {
      toast.error("更新状态失败");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">账本用户</h1>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {creating ? "创建中…" : "创建用户"}
        </button>
      </div>
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-3">用户编号</th>
            <th className="p-3">唯一码</th>
            <th className="p-3">昵称</th>
            <th className="p-3">状态</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-3 font-mono tabular-nums">{u.userSn}</td>
              <td className="p-3 font-mono tracking-wide">{u.inviteCode}</td>
              <td className="p-3 text-slate-600">{u.displayName || "—"}</td>
              <td className="p-3">
                <span
                  className={
                    u.status === "disabled" ? "text-red-500" : "text-slate-700"
                  }
                >
                  {statusLabel(u.status)}
                </span>
              </td>
              <td className="p-3">
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => handleToggleStatus(u)}
                  className={
                    u.status === "active"
                      ? "text-red-500 disabled:opacity-50"
                      : "text-green-600 disabled:opacity-50"
                  }
                >
                  {busyId === u.id
                    ? "处理中…"
                    : u.status === "active"
                      ? "禁用"
                      : "恢复"}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-slate-400">
                还没有账本用户，点击「创建用户」发放唯一码
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
