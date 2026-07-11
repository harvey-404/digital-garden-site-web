import type { ReactNode } from "react";

type AsideVariant = "info" | "success" | "warning" | "error";

export function mapAlertClass(className?: string): AsideVariant | null {
  if (!className) return null;
  if (className.includes("markdown-alert-note")) return "info";
  if (className.includes("markdown-alert-tip")) return "success";
  if (className.includes("markdown-alert-important")) return "warning";
  if (className.includes("markdown-alert-warning")) return "warning";
  if (className.includes("markdown-alert-caution")) return "error";
  return null;
}

export default function Aside({
  variant,
  children,
}: {
  variant: AsideVariant;
  children: ReactNode;
}) {
  return (
    <aside data-variant={variant} className="dg-aside my-6 rounded-lg px-4 py-3 text-[0.975rem] leading-relaxed">
      <div className="[&_p]:mt-2 [&_p:first-child]:mt-0">{children}</div>
    </aside>
  );
}
