import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { copyText } from "../../lib/clipboard";

export default function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { resolved } = useTheme();
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    import("../../lib/shiki")
      .then(({ highlightCode }) => highlightCode(code, lang, resolved))
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang, resolved]);

  const handleCopy = async () => {
    try {
      await copyText(code.trimEnd());
      toast.success("已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-pre-bg)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
        <span className="font-mono uppercase">{lang || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded px-2 py-0.5 transition hover:bg-[var(--color-code-bg)] hover:text-[var(--color-accent)]"
        >
          复制
        </button>
      </div>
      {html ? (
        <div
          className="code-block overflow-x-auto p-4 text-sm [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-sm text-[var(--color-text)]">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
