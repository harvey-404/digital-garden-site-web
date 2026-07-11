import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkAlert from "remark-github-blockquote-alert";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Aside, { mapAlertClass } from "./post/Aside";
import CodeBlock from "./post/CodeBlock";

interface Props {
  content: string;
  variant?: "default" | "article";
}

export default function MarkdownView({ content, variant = "default" }: Props) {
  const isArticle = variant === "article";

  return (
    <div className={isArticle ? "article-prose" : "prose prose-slate max-w-none"}>
      <ReactMarkdown
        remarkPlugins={isArticle ? [remarkGfm, remarkAlert] : [remarkGfm]}
        rehypePlugins={
          isArticle
            ? [
                rehypeSlug,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: "append",
                    properties: { className: ["heading-anchor"], ariaLabel: "链到此标题" },
                    content: {
                      type: "text",
                      value: "#",
                    },
                  },
                ],
              ]
            : []
        }
        components={{
          blockquote: ({ className, children }) => {
            const variant = isArticle ? mapAlertClass(className) : null;
            if (variant) return <Aside variant={variant}>{children}</Aside>;
            return <blockquote className={className}>{children}</blockquote>;
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
