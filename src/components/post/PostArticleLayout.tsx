import type { ReactNode } from "react";
import { ArrowLeft, CalendarBlank, Clock, Eye } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { formatPostDate } from "../../lib/markdown";

interface Props {
  tags: string[];
  inDtm: number;
  updateDtm: number;
  viewCount: number;
}

function PostMeta({ tags, inDtm, updateDtm, viewCount }: Props) {
  return (
    <div className="garden-article-meta">
      <span><CalendarBlank size={15} aria-hidden="true" /><time dateTime={new Date(inDtm * 1000).toISOString()}>{formatPostDate(inDtm)}</time></span>
      {updateDtm !== inDtm && <span><Clock size={15} aria-hidden="true" />更新于 {formatPostDate(updateDtm)}</span>}
      <span><Eye size={15} aria-hidden="true" />{viewCount.toLocaleString()} 次阅读</span>
      {tags.length > 0 && <span className="garden-article-tags">{tags.map((tag) => <span key={tag}>#{tag}</span>)}</span>}
    </div>
  );
}

interface LayoutProps {
  title: string;
  summary?: string;
  meta: Props;
  headerActions?: ReactNode;
  toc?: ReactNode;
  mobileToc?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export default function PostArticleLayout({ title, summary, meta, headerActions, toc, mobileToc, footer, children }: LayoutProps) {
  return (
    <article className="garden-article">
      <div className="garden-article-top"><Link to="/posts" className="garden-text-link"><ArrowLeft size={16} aria-hidden="true" /> 返回灵感</Link>{headerActions}</div>
      <header className="garden-article-header">
        <h1>{title}</h1>
        {summary && <p className="garden-article-lead">{summary}</p>}
        <PostMeta {...meta} />
      </header>
      {mobileToc}
      <div className="garden-article-grid">
        <div className="garden-article-body">
          {children}
          {footer && <footer className="garden-article-footer">{footer}</footer>}
          <Link to="/posts" className="garden-text-link garden-article-return"><ArrowLeft size={16} aria-hidden="true" /> 继续读其他灵感</Link>
        </div>
        {toc && <aside className="garden-article-aside"><div>{toc}</div></aside>}
      </div>
    </article>
  );
}
