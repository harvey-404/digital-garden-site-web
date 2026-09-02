import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { updateLedgerDefaultBudget, updateLedgerProfile } from "../../api/ledger";
import { useLedgerAuth } from "../../context/LedgerAuthContext";
import Spinner from "../../components/Spinner";
import { PageHeader } from "../../components/ui/PagePrimitives";

const MAX_BUDGET = 999999.99;

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

const cardClass =
  "space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]";

export default function LedgerSettingsPage() {
  const { me, loading, refreshMe } = useLedgerAuth();
  const [displayName, setDisplayName] = useState("");
  const [defaultBudget, setDefaultBudget] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    if (!me) return;
    setDisplayName(me.displayName ?? "");
    setDefaultBudget(
      me.defaultBudgetAmount != null ? String(me.defaultBudgetAmount) : "",
    );
  }, [me]);

  if (loading && !me) return <Spinner />;

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      toast.error("请填写昵称");
      return;
    }
    if (name.length > 64) {
      toast.error("昵称最长 64 字");
      return;
    }
    setSavingProfile(true);
    try {
      await updateLedgerProfile({ displayName: name });
      await refreshMe();
      toast.success("昵称已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(defaultBudget);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BUDGET) {
      toast.error(`默认月预算须大于 0 且不超过 ${MAX_BUDGET}`);
      return;
    }
    setSavingBudget(true);
    try {
      await updateLedgerDefaultBudget({ defaultBudgetAmount: amount });
      await refreshMe();
      toast.success("默认预算已更新（仅影响之后新建的月份）");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="设置"
        description="修改昵称与默认月预算。默认预算仅影响之后自动创建或启用的月份。"
      />

      {me && (
        <p className="text-sm text-[var(--color-text-muted)]">
          账号编号{" "}
          <span className="font-mono text-[var(--color-heading)]">{me.userSn}</span>
        </p>
      )}

      <form onSubmit={(e) => void handleProfile(e)} className={cardClass}>
        <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
          个人资料
        </h2>
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">昵称</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            className={inputClass}
            required
          />
        </label>
        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {savingProfile ? "保存中…" : "保存昵称"}
        </button>
      </form>

      <form onSubmit={(e) => void handleBudget(e)} className={cardClass}>
        <h2 className="font-serif text-lg font-semibold text-[var(--color-heading)]">
          默认月预算
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          修改后不会改动已有月份的预算额度；单月请到「预算」页编辑。
        </p>
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">金额（元）</span>
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            max={MAX_BUDGET}
            step="0.01"
            value={defaultBudget}
            onChange={(e) => setDefaultBudget(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <button
          type="submit"
          disabled={savingBudget}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {savingBudget ? "保存中…" : "保存默认预算"}
        </button>
      </form>
    </div>
  );
}
