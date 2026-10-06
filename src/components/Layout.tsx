import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const isChat = /^\/ledger\/chat\/?$/.test(useLocation().pathname);
  return (
    <div className={`flex ${isChat ? "min-h-[100dvh]" : "min-h-screen"} flex-col bg-[var(--color-bg)] text-[var(--color-text)]`}>
      <Navbar compact={isChat} />
      <main className={`mx-auto w-full ${isChat ? "max-w-[792px] py-3" : "max-w-6xl py-8"} flex-1 px-4`}>
        <Outlet />
      </main>
      {!isChat && <Footer />}
    </div>
  );
}
