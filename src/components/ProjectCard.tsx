import type { ProjectVO } from "../types";

export default function ProjectCard({ project }: { project: ProjectVO }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-white">
      {project.coverImage && (
        <img src={project.coverImage} alt={project.title} className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
        {project.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-500">{project.description}</p>
        )}
        {project.techStack && (
          <p className="mt-3 text-xs text-slate-400">{project.techStack}</p>
        )}
        <div className="mt-4 flex gap-3 text-sm">
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noreferrer" className="text-slate-900 underline">
              演示
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-slate-900 underline">
              源码
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
