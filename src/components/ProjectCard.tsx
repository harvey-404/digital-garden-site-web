import { Link } from "react-router-dom";
import type { ProjectVO } from "../types";
import { formatPostDate } from "../lib/markdown";

export default function ProjectCard({ project }: { project: ProjectVO }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
    >
      <h3 className="font-serif text-lg font-semibold text-[var(--color-heading)] transition group-hover:text-[var(--color-accent)]">
        {project.title}
      </h3>
      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {project.description.replace(/[#*_`>|-]/g, "").trim()}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {project.inDtm ? (
          <time dateTime={new Date(project.inDtm * 1000).toISOString()}>
            {formatPostDate(project.inDtm)}
          </time>
        ) : null}
        {project.techStack && (
          <span className="rounded-full bg-[var(--color-code-bg)] px-2 py-0.5">
            {project.techStack}
          </span>
        )}
        {project.projectUrl && (
          <span className="ml-auto text-[var(--color-accent)]">成品链接</span>
        )}
      </div>
    </Link>
  );
}
