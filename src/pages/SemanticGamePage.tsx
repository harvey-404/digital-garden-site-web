import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getSemanticStatus } from "../api/games";
import { PageHeader } from "../components/ui/PagePrimitives";
import { useGameSocket } from "../hooks/useGameSocket";
import { getOrCreateFp, loadUsername, saveUsername } from "../lib/gameIdentity";
import type { GuessHistoryEntry, Top10Entry } from "../types/game";

function roundStatusText(status: string, connected: boolean): string {
  if (!connected) return "断线重连中…";
  switch (status) {
    case "active":
      return "本轮进行中 — 用中文词逼近隐藏目标";
    case "waiting_words":
      return "词库待补充 — 站长准备中，暂不可猜";
    case "idle":
    case "":
      return "暂无进行中的轮次 — 站长准备中";
    default:
      return `轮次状态：${status}`;
  }
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-[var(--color-code-bg)]">
      <div
        className="h-full rounded bg-[var(--color-accent)] transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function HistoryList({ items }: { items: GuessHistoryEntry[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">还没有猜词记录，试一个词吧。</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((h) => (
        <li key={h.word}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-[var(--color-heading)]">
              {h.word}
              {h.isFirstDiscoverer && (
                <span className="ml-2 text-xs font-normal text-[var(--color-accent)]">首猜</span>
              )}
            </span>
            <span className="tabular-nums text-[var(--color-text-muted)]">
              {h.score.toFixed(1)}
            </span>
          </div>
          <ScoreBar score={h.score} />
          {h.alreadyGuessed && !h.isFirstDiscoverer && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              已有人猜过 · 首猜 {h.firstUser}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Top10List({ items }: { items: Top10Entry[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">本轮尚无上榜词。</p>;
  }
  return (
    <ol className="space-y-2">
      {items.map((row, i) => (
        <li
          key={`${row.word}-${i}`}
          className="flex items-baseline justify-between gap-2 border-b border-[var(--color-border)] pb-2 text-sm last:border-0"
        >
          <span className="min-w-0">
            <span className="mr-2 tabular-nums text-[var(--color-text-muted)]">{i + 1}.</span>
            <span className="font-medium text-[var(--color-heading)]">{row.word}</span>
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">{row.firstUser}</span>
          </span>
          <span className="shrink-0 tabular-nums text-[var(--color-accent)]">
            {row.score.toFixed(1)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function SemanticGamePage() {
  const [fp] = useState(() => getOrCreateFp());
  const [draftName, setDraftName] = useState(() => loadUsername());
  const [joinedName, setJoinedName] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [hubHint, setHubHint] = useState<string | null>(null);

  const enabled = Boolean(joinedName);
  const { status, top10, myHistory, gameOver, error, sendGuess, connected } = useGameSocket({
    username: joinedName ?? "",
    fp,
    enabled,
  });

  useEffect(() => {
    getSemanticStatus()
      .then((s) => {
        if (!s.guessable) {
          setHubHint(
            s.status === "waiting_words"
              ? "当前等待补词，进入后可旁观，暂不可猜。"
              : "当前暂无进行中的轮次，进入后可旁观。"
          );
        }
      })
      .catch(() => {
        /* optional preflight; WS will own live state */
      });
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    const name = draftName.trim();
    if (name.length < 1 || name.length > 16) {
      toast.error("昵称需为 1–16 个字");
      return;
    }
    saveUsername(name);
    setJoinedName(name);
  }

  function handleGuess(e: FormEvent) {
    e.preventDefault();
    if (status !== "active" || !connected) return;
    const word = guess.trim();
    if (!word) return;
    if (word.length > 20) {
      toast.error("词语过长（最多 20 字）");
      return;
    }
    sendGuess(word);
    setGuess("");
  }

  if (!joinedName) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <PageHeader
          title="语义猜词"
          description="用中文词逼近隐藏目标，与同频访客共享 Top10。目标词不会出现在前台。"
        />
        {hubHint && (
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            {hubHint}
          </p>
        )}
        <form onSubmit={handleJoin} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--color-text-muted)]">昵称</span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={16}
              autoFocus
              autoComplete="nickname"
              placeholder="1–16 个字"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            进入大厅
          </button>
        </form>
        <Link
          to="/games"
          className="inline-block text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          ← 返回乐园
        </Link>
      </div>
    );
  }

  const canGuess = status === "active" && connected;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            <Link to="/games" className="text-[var(--color-accent)] hover:underline">
              乐园
            </Link>
            <span className="mx-1.5">/</span>
            语义猜词
          </p>
          <h1 className="mt-1 font-serif text-[clamp(1.5rem,3.5vw,2rem)] font-semibold text-[var(--color-heading)]">
            同频大厅
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {joinedName}
            <span className="mx-2 opacity-40">·</span>
            {connected ? "已连接" : "重连中"}
          </p>
        </div>
        <p className="max-w-md text-right text-sm text-[var(--color-text-muted)]">
          {roundStatusText(status, connected)}
        </p>
      </div>

      {gameOver && (
        <div
          role="status"
          className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-code-bg)] px-4 py-3 text-sm"
        >
          <p className="font-medium text-[var(--color-heading)]">
            {gameOver.winner} 猜中了本轮目标词「{gameOver.word}」
          </p>
          <p className="mt-1 text-[var(--color-text-muted)]">
            {gameOver.next === "new_round"
              ? "新一轮即将开始，个人史已清空。"
              : "词库已空，等待站长补词开局。"}
          </p>
        </div>
      )}

      {!connected && (
        <p className="text-sm text-[var(--color-text-muted)]">连接已断开，正在自动重连…</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={!canGuess}
              maxLength={20}
              placeholder={canGuess ? "输入一个中文词…" : "当前不可猜"}
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-55"
            />
            <button
              type="submit"
              disabled={!canGuess || !guess.trim()}
              className="shrink-0 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              提交
            </button>
          </form>

          <div>
            <h2 className="mb-3 font-serif text-lg font-semibold text-[var(--color-heading)]">
              我的猜测
            </h2>
            <HistoryList items={myHistory} />
          </div>
        </section>

        <aside>
          <h2 className="mb-3 font-serif text-lg font-semibold text-[var(--color-heading)]">
            Top 10
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <Top10List items={top10} />
          </div>
        </aside>
      </div>
    </div>
  );
}
