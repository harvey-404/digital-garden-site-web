import { useEffect, useState } from "react";
import { List, X, ArrowUpRight } from "@phosphor-icons/react";
import { NavLink, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/posts", label: "灵感" },
  { to: "/todos", label: "计划" },
  { to: "/projects", label: "成果" },
  { to: "/album", label: "足迹" },
  { to: "/games", label: "乐园" },
  { to: "/tracker", label: "日常" },
  { to: "/about", label: "关于" },
];

export default function Navbar({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="garden-navbar sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-nav-bg)] backdrop-blur">
      <nav aria-label="主导航" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} className={`garden-nav-inner ${compact ? "garden-nav--compact" : ""}`}>
        <NavLink
          to="/"
          className="garden-wordmark"
        >
          <span className="garden-monogram" aria-hidden="true">dg<span>.</span></span>
          Digital Garden
        </NavLink>
        <div className="garden-nav-actions">
          <ul id="garden-navigation" className={`garden-nav-links ${open ? "is-open" : ""}`}>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `garden-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  {l.label}
                  {l.to === "/tracker" && <ArrowUpRight size={12} aria-hidden="true" />}
                </NavLink>
              </li>
            ))}
          </ul>
          <ThemeToggle />
          <button type="button" className="garden-menu-toggle" aria-label={open ? "收起导航" : "展开导航"} aria-expanded={open} aria-controls="garden-navigation" onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
