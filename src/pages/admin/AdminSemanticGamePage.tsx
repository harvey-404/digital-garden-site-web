import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  adminAddSemanticWords,
  adminGetSemanticStatus,
  adminListSemanticWords,
  adminReorderSemanticWord,
  adminSkipSemanticWord,
  adminStartSemanticRound,
  adminStopSemanticRound,
  adminUpdateSemanticWordHints,
} from "../../api/games";
import type { SemanticRoundAdminVO, SemanticWordVO } from "../../types/game";
import Spinner from "../../components/Spinner";

const statusLabel: Record<string, string> = {
  active: "进行中",
  waiting_words: "等待词库",
  idle: "空闲",
  finished: "已结束",
};

export default function AdminSemanticGamePage() {
  const [status, setStatus] = useState<SemanticRoundAdminVO | null>(null);
  const [words, setWords] = useState<SemanticWordVO[]>([]);
  const [batchText, setBatchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hintDraft, setHintDraft] = useState({ hint1: "", hint2: "", hint3: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([adminGetSemanticStatus(), adminListSemanticWords()]);
      setStatus(s);
      setWords(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pendingWords = words.filter((w) => w.status === "pending");
  const activeWord = words.find((w) => w.status === "active");

  const handleStart = async () => {
    setBusy(true);
    try {
      const s = await adminStartSemanticRound();
      setStatus(s);
      const w = await adminListSemanticWords();
      setWords(w);
      toast.success(s.status === "waiting_words" ? "无待出题词，已进入等待词库" : "已开局");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!confirm("确定强制停局？")) return;
    setBusy(true);
    try {
      const s = await adminStopSemanticRound();
      setStatus(s);
      const w = await adminListSemanticWords();
      setWords(w);
      toast.success("已停局");
    } finally {
      setBusy(false);
    }
  };

  const handleAddWords = async (e: FormEvent) => {
    e.preventDefault();
    const lines = batchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("请输入至少一个词");
      return;
    }
    setBusy(true);
    try {
      await adminAddSemanticWords(lines);
      setBatchText("");
      toast.success(`已添加 ${lines.length} 个词`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async (id: number, word: string) => {
    if (!confirm(`跳过「${word}」？`)) return;
    setBusy(true);
    try {
      await adminSkipSemanticWord(id);
      toast.success("已跳过");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pendingWords.length) return;
    const a = pendingWords[index];
    const b = pendingWords[targetIndex];
    setBusy(true);
    try {
      await Promise.all([
        adminReorderSemanticWord(a.id, b.queueOrder),
        adminReorderSemanticWord(b.id, a.queueOrder),
      ]);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const openHints = (w: SemanticWordVO) => {
    setEditingId(w.id);
    setHintDraft({
      hint1: w.hint1 ?? "",
      hint2: w.hint2 ?? "",
      hint3: w.hint3 ?? "",
    });
  };

  const handleSaveHints = async (id: number) => {
    setBusy(true);
    try {
      await adminUpdateSemanticWordHints(id, {
        hint1: hintDraft.hint1.trim(),
        hint2: hintDraft.hint2.trim(),
        hint3: hintDraft.hint3.trim(),
      });
      toast.success("提示已保存");
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading && !status) return <Spinner />;

  const hintEditor = (w: SemanticWordVO) =>
    editingId === w.id ? (
      <div className="mt-3 space-y-2 rounded border border-amber-100 bg-amber-50/60 p-3">
        <p className="text-xs text-slate-500">
          最多 3 条；全服每猜中 10 个不同词解锁下一级（程度由弱到强）。留空表示该级不提示。
        </p>
        {(
          [
            ["hint1", "提示 1（弱）", "hint1"],
            ["hint2", "提示 2（中）", "hint2"],
            ["hint3", "提示 3（强）", "hint3"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs text-slate-500">{label}</span>
            <input
              value={hintDraft[key]}
              maxLength={256}
              onChange={(e) => setHintDraft((d) => ({ ...d, [key]: e.target.value }))}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
              placeholder={label}
            />
          </label>
        ))}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveHints(w.id)}
            className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-40"
          >
            保存提示
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditingId(null)}
            className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
          >
            取消
          </button>
        </div>
      </div>
    ) : (
      <div className="mt-2 text-xs text-slate-500">
        {[w.hint1, w.hint2, w.hint3].filter((h) => h && h.trim()).length > 0
          ? `已设 ${[w.hint1, w.hint2, w.hint3].filter((h) => h && h.trim()).length}/3 条提示`
          : "尚未设置提示"}
        <button
          type="button"
          disabled={busy}
          onClick={() => openHints(w)}
          className="ml-3 text-slate-800 underline disabled:opacity-40"
        >
          编辑提示
        </button>
      </div>
    );

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">语义猜词</h1>
      <p className="text-sm text-slate-500">
        猜中后会自动出下一题；补词后若处于等待词库也会自动开局。答案只在此页显示，前台访客看不到。
        可为每个词预先写最多 3 条提示，全服每 10 个不同猜词解锁一级。
      </p>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-500">当前轮次</h2>
        {status ? (
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">状态</dt>
              <dd className="mt-0.5 font-medium">
                {statusLabel[status.status] ?? status.status}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">答案（仅后台可见）</dt>
              <dd className="mt-0.5 font-medium text-amber-700">{status.targetWord || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">待出题</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{status.pendingCount}</dd>
            </div>
            <div>
              <dt className="text-slate-400">本轮猜测</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{status.guessCount}</dd>
            </div>
          </dl>
        ) : (
          <p className="mb-4 text-sm text-slate-400">暂无状态</p>
        )}
        {activeWord && (
          <div className="mb-4 rounded border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">当前题提示（可改）</p>
            {hintEditor(activeWord)}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy || status?.status === "active"}
            onClick={() => void handleStart()}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            开局
          </button>
          <button
            type="button"
            disabled={busy || status?.status !== "active"}
            onClick={() => void handleStop()}
            className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-40"
          >
            停局
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
          >
            刷新
          </button>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-500">批量加词</h2>
        <form onSubmit={(e) => void handleAddWords(e)} className="space-y-3">
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={6}
            placeholder={"每行一个词\n例如：\n苹果\n月亮\n图书馆\n（加词后再点「编辑提示」写 3 级提示）"}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            添加
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          待出题队列（{pendingWords.length}）
        </h2>
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="p-3">顺序</th>
              <th className="p-3">词 / 提示</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {pendingWords.map((w, i) => (
              <tr key={w.id} className="border-b align-top">
                <td className="p-3 tabular-nums">{w.queueOrder}</td>
                <td className="p-3">
                  <div className="font-medium">{w.word}</div>
                  {hintEditor(w)}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={busy || i === 0}
                      onClick={() => void handleMove(i, -1)}
                      className="text-slate-600 disabled:opacity-40"
                      aria-label="上移"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || i === pendingWords.length - 1}
                      onClick={() => void handleMove(i, 1)}
                      className="text-slate-600 disabled:opacity-40"
                      aria-label="下移"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSkip(w.id, w.word)}
                      className="text-red-500 disabled:opacity-40"
                    >
                      跳过
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingWords.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400">
                  暂无 pending 词
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
