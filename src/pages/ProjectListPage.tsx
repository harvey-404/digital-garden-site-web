import { useEffect, useState } from "react";
import { listProjects } from "../api/projects";
import type { ProjectVO } from "../types";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";
import { EmptyState, PageHeader } from "../components/ui/PagePrimitives";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="成果展示" description="做过的项目、实验与作品。" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {projects.length === 0 && <EmptyState>还没有成果</EmptyState>}
      </div>
    </div>
  );
}
