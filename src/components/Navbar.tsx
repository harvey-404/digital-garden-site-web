import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/posts", label: "灵感" },
  { to: "/projects", label: "成果" },
  { to: "/about", label: "关于" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-nav-bg)] backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink
          to="/"
          className="font-serif text-lg font-bold text-[var(--color-heading)]"
        >
          Digital Garden
        </NavLink>
        <div className="flex items-center gap-4">
          <ul className="flex gap-5 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-[var(--color-heading)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-heading)]"
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
