import { ArrowUpRight, AppWindow } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { ProjectVO } from "../types";

export default function ProjectCard({ project }: { project: ProjectVO }) {
  const description = project.description.split(/\r?\n|\\n/)[0].replace(/[#*_`>|]/g, "").trim();
  return (
    <Link to={"/projects/" + project.id} className="garden-project block">
      <div className="garden-project-top"><AppWindow size={25} weight="light" aria-hidden="true" /><ArrowUpRight size={21} aria-hidden="true" /></div>
      {project.coverImage && <img src={project.coverImage} alt="" className="garden-project-cover" loading="lazy" />}
      <h3>{project.title}</h3>
      {description && <p>{description}</p>}
      <div className="garden-project-bottom"><span>{project.techStack}</span>{project.projectUrl && <span>查看项目 <ArrowUpRight size={14} aria-hidden="true" /></span>}</div>
    </Link>
  );
}
