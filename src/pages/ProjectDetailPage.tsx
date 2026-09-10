import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../api/projects";
import type { ProjectVO } from "../types";
import MarkdownView from "../components/MarkdownView";
import Spinner from "../components/Spinner";
import { isInternalProjectHref } from "../lib/projectLinks";
import { formatPostDate } from "../lib/markdown";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProject(Number(id))
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!project) return <p className="text-[var(--color-text-muted)]">成果不存在</p>;

  const resultHref = project.projectUrl.trim();
  const resultInternal = resultHref ? isInternalProjectHref(resultHref) : false;

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        to="/projects"
        className="mb-6 inline-block text-sm text-[var(--color-accent)] hover:underline"
      >
        ← 返回成果列表
      </Link>

      <header className="mb-8 border-b border-[var(--color-border)] pb-8">
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-tight text-[var(--color-heading)]">
          {project.title}
        </h1>
        {project.techStack && (
          <p className="mt-3 font-mono text-sm text-[var(--color-text-muted)]">{project.techStack}</p>
        )}
        {project.inDtm ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {formatPostDate(project.inDtm)}
          </p>
        ) : null}

        {resultHref && (
          <p className="mt-6">
            <a
              href={resultHref}
              {...(resultInternal ? {} : { target: "_blank", rel: "noreferrer" })}
              className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              打开成品
            </a>
          </p>
        )}
      </header>

      {project.coverImage && (
        <img
          src={project.coverImage}
          alt=""
          className="mb-8 w-full rounded-2xl border border-[var(--color-border)] object-cover"
        />
      )}

      {project.description.trim() && (
        <section className="mb-10">
          <MarkdownView content={project.description} variant="article" />
        </section>
      )}

      {project.repoUrl.trim() && (
        <p className="text-sm">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            查看源码
          </a>
        </p>
      )}
    </article>
  );
}
