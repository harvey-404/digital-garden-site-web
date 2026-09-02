import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useLedgerAuth } from "../../context/LedgerAuthContext";
import MonthPicker, { useLedgerMonth } from "./MonthPicker";

const ledgerLinks = [
  { to: "/ledger", label: "概览", end: true },
  { to: "/ledger/expenses", label: "明细" },
  { to: "/ledger/budgets", label: "预算" },
  { to: "/ledger/categories", label: "分类" },
  { to: "/ledger/settings", label: "设置" },
];

export default function LedgerShell() {
  const { me, signOut } = useLedgerAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useLedgerMonth();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!params.get("month")) {
      setMonth(month);
    }
  }, [params, month, setMonth]);

  const handleSignOut = () => {
    signOut();
    navigate("/ledger/login");
  };

  const name = me?.displayName?.trim() || me?.userSn || "账本";
  const monthSearch = `?month=${encodeURIComponent(month)}`;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-4">
        <nav
          className="-mx-1 flex gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="账本导航"
        >
          {ledgerLinks.map((l) => (
            <NavLink
              key={l.to}
              to={{ pathname: l.to, search: monthSearch }}
              end={l.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 transition ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-code-bg)] hover:text-[var(--color-accent)]"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center justify-between gap-3 text-sm text-[var(--color-text-muted)] sm:justify-end">
          <span className="truncate max-w-[10rem] sm:max-w-[12rem]" title={name}>
            {name}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-lg px-2 py-1 text-[var(--color-accent)] transition hover:bg-[var(--color-code-bg)]"
          >
            退出
          </button>
        </div>
      </div>

      <div
        className="rounded-xl bg-[var(--color-code-bg)] px-2 py-2 sm:px-3"
        aria-label="当前月份"
      >
        <MonthPicker value={month} onChange={setMonth} variant="bar" />
      </div>
      <Outlet />
    </div>
  );
}
