import type { Element } from "hast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkAlert from "remark-github-blockquote-alert";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Aside, { mapAlertClass } from "./post/Aside";
import CodeBlock from "./post/CodeBlock";
import { getNodeClassName, normalizeMarkdown } from "../lib/markdown";

interface Props {
  content: string;
  variant?: "default" | "article";
}

function alertVariantFromNode(node?: Element, className?: string) {
  const cls = [getNodeClassName(node), className].filter(Boolean).join(" ");
  return mapAlertClass(cls);
}

export default function MarkdownView({ content, variant = "default" }: Props) {
  const isArticle = variant === "article";
  const markdown = isArticle ? normalizeMarkdown(content) : content;

  return (
    <div className={isArticle ? "article-prose" : "prose prose-slate max-w-none"}>
      <ReactMarkdown
        remarkPlugins={
          isArticle
            ? [[remarkAlert, { tagName: "blockquote" }], remarkGfm]
            : [remarkGfm]
        }
        rehypePlugins={
          isArticle
            ? [
                rehypeSlug,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: "append",
                    properties: { className: ["heading-anchor"], ariaLabel: "链到此标题" },
                    content: { type: "text", value: "#" },
                  },
                ],
              ]
            : []
        }
        components={{
          h1: ({ children }) =>
            isArticle ? (
              <h2 className="font-serif text-[1.625rem] font-semibold tracking-tight text-[var(--color-heading)]">
                {children}
              </h2>
            ) : (
              <h1>{children}</h1>
            ),
          blockquote: ({ node, className, children }) => {
            const alertVariant = isArticle ? alertVariantFromNode(node, className) : null;
            if (alertVariant) return <Aside variant={alertVariant}>{children}</Aside>;
            return <blockquote className={className}>{children}</blockquote>;
          },
          div: ({ node, className, children }) => {
            const alertVariant = isArticle ? alertVariantFromNode(node, className) : null;
            if (alertVariant) return <Aside variant={alertVariant}>{children}</Aside>;
            return <div className={className}>{children}</div>;
          },
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const code = String(children).replace(/\n$/, "");
            if (match && isArticle) {
              return <CodeBlock code={code} lang={match[1]} />;
            }
            if (match) {
              return (
                <pre className="overflow-x-auto rounded bg-slate-800 p-4 text-sm text-slate-100">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
