import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminLinks = [
  { to: "/admin", label: "概览", end: true },
  { to: "/admin/posts", label: "文章" },
  { to: "/admin/projects", label: "成果" },
  { to: "/admin/comments", label: "评论审核" },
  { to: "/admin/profile", label: "关于我" },
];

export default function AdminLayout() {
  const { username, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r bg-white p-4">
        <div className="mb-6 text-lg font-bold">后台管理</div>
        <nav className="flex flex-col gap-1 text-sm">
          {adminLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 w-full rounded px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
        >
          退出登录（{username}）
        </button>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
