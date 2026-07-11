import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-6xl font-semibold text-[var(--color-accent)]">404</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-[var(--color-heading)]">页面走丢了</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">你要找的页面不存在或已被移除。</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm text-white transition hover:bg-[var(--color-accent-hover)]"
      >
        返回首页
      </Link>
    </div>
  );
}
