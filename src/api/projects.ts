import apiClient from "./client";
import type { ProjectVO, ProjectRequest } from "../types";

export function listProjects() {
  return apiClient.get("/projects") as unknown as Promise<ProjectVO[]>;
}

export function createProject(body: ProjectRequest) {
  return apiClient.post("/admin/projects", body) as unknown as Promise<ProjectVO>;
}

export function updateProject(id: number, body: ProjectRequest) {
  return apiClient.put(`/admin/projects/${id}`, body) as unknown as Promise<ProjectVO>;
}

export function deleteProject(id: number) {
  return apiClient.delete(`/admin/projects/${id}`) as unknown as Promise<void>;
}
