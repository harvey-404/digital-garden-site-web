import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/posts", label: "灵感" },
  { to: "/projects", label: "成果" },
  { to: "/about", label: "关于" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="text-lg font-bold text-slate-900">
          Digital Garden
        </NavLink>
        <ul className="flex gap-5 text-sm">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  isActive ? "font-semibold text-slate-900" : "text-slate-500 hover:text-slate-800"
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
