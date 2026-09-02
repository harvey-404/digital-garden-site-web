import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { redeemInvite } from "../../api/ledger";
import { useLedgerAuth } from "../../context/LedgerAuthContext";
import { normalizeInviteCode, previewInviteCode } from "../../lib/ledgerInvite";
import { PageHeader } from "../../components/ui/PagePrimitives";
import Spinner from "../../components/Spinner";

export default function LedgerLoginPage() {
  const { isAuthenticated, onboardingDone, loading, signIn } = useLedgerAuth();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Spinner />;

  if (isAuthenticated) {
    return <Navigate to={onboardingDone ? "/ledger" : "/ledger/onboarding"} replace />;
  }

  const preview = previewInviteCode(inviteCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = normalizeInviteCode(inviteCode);
      const res = await redeemInvite(code);
      signIn(res.token);
      toast.success("登录成功");
      navigate(res.onboardingDone ? "/ledger" : "/ledger/onboarding", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader title="记账登录" description="输入管理员发放的唯一码进入个人账本。" />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
      >
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">唯一码</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="one-time-code"
            spellCheck={false}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm tracking-wider text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        {preview && (
          <p className="text-xs text-[var(--color-text-muted)]">
            规范化预览：{" "}
            <span className="font-mono text-[var(--color-heading)]">{preview}</span>
            {preview.replace(/-/g, "").length < 12 && (
              <span className="ml-1 opacity-70">（还需 {12 - preview.replace(/-/g, "").length} 位）</span>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || preview.replace(/-/g, "").length !== 12}
          className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "登录中…" : "进入账本"}
        </button>
      </form>
    </div>
  );
}
