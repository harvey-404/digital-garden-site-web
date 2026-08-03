import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

/** Full-bleed shell for map pages: navbar only, no footer / max-width padding */
export default function MapShellLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <div className="relative min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
