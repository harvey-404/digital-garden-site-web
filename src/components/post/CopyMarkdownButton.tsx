import toast from "react-hot-toast";
import { formatPostAsMarkdown } from "../../lib/markdown";

export default function CopyMarkdownButton({
  title,
  contentMd,
}: {
  title: string;
  contentMd: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatPostAsMarkdown(title, contentMd));
      toast.success("已复制 Markdown");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      复制 Markdown
    </button>
  );
}
