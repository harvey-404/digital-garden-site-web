import type { ProjectVO } from "../types";

export default function ProjectCard({ project }: { project: ProjectVO }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]">
      {project.coverImage ? (
        <img src={project.coverImage} alt={project.title} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[var(--color-code-bg)] text-4xl text-[var(--color-accent)]">
          ◆
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-[var(--color-heading)]">{project.title}</h3>
        {project.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {project.description}
          </p>
        )}
        {project.techStack && (
          <p className="mt-3 font-mono text-xs text-[var(--color-text-muted)]">{project.techStack}</p>
        )}
        <div className="mt-auto flex gap-4 pt-4 text-sm">
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              演示
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              源码
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
