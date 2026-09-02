import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createLedgerCategory,
  deleteLedgerCategory,
  listLedgerCategories,
  updateLedgerCategory,
} from "../../api/ledger";
import Spinner from "../../components/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/PagePrimitives";
import type { LedgerCategoryVO } from "../../types/ledger";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

export default function LedgerCategoriesPage() {
  const [categories, setCategories] = useState<LedgerCategoryVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listLedgerCategories();
      setCategories(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDuplicateName = (candidate: string, excludeId?: number) => {
    const n = candidate.trim();
    return categories.some(
      (c) => c.name === n && (excludeId == null || c.id !== excludeId),
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      toast.error("请填写分类名称");
      return;
    }
    if (isDuplicateName(n)) {
      toast.error("分类名称已存在（CATEGORY_NAME_DUPLICATE）");
      return;
    }
    setSubmitting(true);
    try {
      await createLedgerCategory({
        name: n,
        icon: icon.trim() || undefined,
        sortOrder: categories.length,
      });
      toast.success("已添加分类");
      setName("");
      setIcon("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: LedgerCategoryVO) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  };

  const saveEdit = async (c: LedgerCategoryVO) => {
    const n = editName.trim();
    if (!n) {
      toast.error("请填写分类名称");
      return;
    }
    if (isDuplicateName(n, c.id)) {
      toast.error("分类名称已存在（CATEGORY_NAME_DUPLICATE）");
      return;
    }
    setSavingId(c.id);
    try {
      await updateLedgerCategory(c.id, {
        name: n,
        icon: editIcon.trim() || undefined,
        sortOrder: c.sortOrder,
      });
      toast.success("已更新");
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除该分类？已有账单仍保留历史分类 id。")) return;
    setDeletingId(id);
    try {
      await deleteLedgerCategory(id);
      toast.success("已删除");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="分类" description="消费分类管理；同名不允许重复。" />

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
      >
        <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
          新增分类
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-text-muted)]">名称</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              placeholder="例如 餐饮美食"
              className={inputClass}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-text-muted)]">图标（可选）</span>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={32}
              placeholder="emoji 或短文本"
              className={inputClass}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "添加中…" : "添加"}
        </button>
      </form>

      {loading && <Spinner />}

      {!loading && categories.length === 0 && <EmptyState>暂无分类</EmptyState>}

      {!loading && categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={64}
                      className={`${inputClass} max-w-[12rem]`}
                      aria-label="分类名称"
                    />
                    <input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      maxLength={32}
                      placeholder="图标"
                      className={`${inputClass} max-w-[6rem]`}
                      aria-label="图标"
                    />
                    <button
                      type="button"
                      disabled={savingId === c.id}
                      onClick={() => void saveEdit(c)}
                      className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      {savingId === c.id ? "保存中…" : "保存"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      {c.icon ? <span aria-hidden>{c.icon}</span> : null}
                      <span className="font-medium text-[var(--color-heading)]">{c.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        排序 {c.sortOrder}
                      </span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button
                        type="button"
                        className="text-[var(--color-accent)] hover:underline"
                        onClick={() => startEdit(c)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === c.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                        onClick={() => void handleDelete(c.id)}
                      >
                        {deletingId === c.id ? "删除中…" : "删除"}
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
