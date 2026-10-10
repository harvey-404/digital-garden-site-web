import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Spinner from "./Spinner";

export default function Layout() {
  const { pathname } = useLocation();
  const isChat = /^\/ledger\/chat\/?$/.test(pathname);
  const isEditorial = !pathname.startsWith("/ledger");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[var(--color-bg)] text-[var(--color-text)] ${isEditorial ? "garden-shell" : ""}`}>
      <a href="#main-content" className="garden-skip-link">跳至正文</a>
      <Navbar compact={isChat} />
      <main id="main-content" tabIndex={-1} className={`mx-auto w-full ${isChat ? "max-w-[792px] py-3" : isEditorial ? "garden-main" : "max-w-6xl py-8"} flex-1 px-4`}>
        <Suspense fallback={<Spinner />}><Outlet /></Suspense>
      </main>
      {!isChat && <Footer />}
    </div>
  );
}
