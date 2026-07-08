import { useEffect, useState } from "react";
import { listProjects } from "../api/projects";
import type { ProjectVO } from "../types";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">成果展示</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        {projects.length === 0 && <p className="text-slate-400">还没有成果</p>}
      </div>
    </div>
  );
}
