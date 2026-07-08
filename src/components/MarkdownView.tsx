import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-pre:bg-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
