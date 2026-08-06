import { Link } from "react-router-dom";
import type { GameHubEntry } from "../types/game";
import { PageHeader } from "../components/ui/PagePrimitives";

const games: GameHubEntry[] = [
  {
    id: "semantic",
    title: "语义猜词",
    description: "用中文词逼近隐藏目标，与同频访客共享 Top10 与实时轮次。",
    to: "/games/semantic",
    available: true,
  },
  {
    id: "coming-soon",
    title: "即将开放",
    description: "更多轻量小游戏正在筹备中，敬请期待。",
    available: false,
  },
];

function GameCard({ game }: { game: GameHubEntry }) {
  const inner = (
    <>
      <div
        className={`flex h-32 items-center justify-center text-4xl ${
          game.available
            ? "bg-[var(--color-code-bg)] text-[var(--color-accent)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-60"
        }`}
      >
        {game.available ? "◎" : "…"}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={`font-serif text-lg font-semibold ${
            game.available ? "text-[var(--color-heading)]" : "text-[var(--color-text-muted)]"
          }`}
        >
          {game.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {game.description}
        </p>
        {game.available && (
          <span className="mt-auto pt-4 text-sm text-[var(--color-accent)]">进入大厅 →</span>
        )}
      </div>
    </>
  );

  if (game.available && game.to) {
    return (
      <Link
        to={game.to}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      aria-disabled
      className="flex h-full cursor-not-allowed flex-col overflow-hidden rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] opacity-70"
    >
      {inner}
    </article>
  );
}

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="乐园"
        description="轻量互动小站 — 与同频访客一起探索、猜测、发现。"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
