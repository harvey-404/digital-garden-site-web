import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { completeOnboarding } from "../../api/ledger";
import { useLedgerAuth } from "../../context/LedgerAuthContext";
import { PageHeader } from "../../components/ui/PagePrimitives";
import Spinner from "../../components/Spinner";

const MAX_BUDGET = 999999.99;

export default function LedgerOnboardingPage() {
  const { isAuthenticated, onboardingDone, loading, refreshMe } = useLedgerAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [defaultBudget, setDefaultBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/ledger/login" replace />;
  }

  if (onboardingDone) {
    return <Navigate to="/ledger" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    const amount = Number(defaultBudget);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BUDGET) {
      toast.error(`默认月预算须大于 0 且不超过 ${MAX_BUDGET}`);
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({ displayName: name, defaultBudgetAmount: amount });
      await refreshMe();
      toast.success("设置完成");
      navigate("/ledger", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader
        title="完善账本"
        description="首次进入请设置昵称与默认月预算；之后新月份会按此预算自动创建。"
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
      >
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">昵称</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            placeholder="怎么称呼你"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">默认月预算（元）</span>
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            max={MAX_BUDGET}
            step="0.01"
            value={defaultBudget}
            onChange={(e) => setDefaultBudget(e.target.value)}
            placeholder="例如 3000"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "提交中…" : "开始记账"}
        </button>
      </form>
    </div>
  );
}
