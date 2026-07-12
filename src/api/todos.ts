import apiClient from "./client";
import type { PageResult, TodoVO, TodoDetailVO, TodoRequest } from "../types";

export function listTodos(
  page = 0,
  size = 10,
  opts?: { priority?: string; minProgress?: number; maxProgress?: number },
) {
  return apiClient.get("/todos", {
    params: { page, size, ...opts },
  }) as unknown as Promise<PageResult<TodoVO>>;
}

export function getTodo(slug: string) {
  return apiClient.get(`/todos/${slug}`) as unknown as Promise<TodoDetailVO>;
}

export function adminListTodos(page = 0, size = 50) {
  return apiClient.get("/admin/todos", { params: { page, size } }) as unknown as Promise<PageResult<TodoVO>>;
}

export function adminGetTodo(id: number) {
  return apiClient.get(`/admin/todos/${id}`) as unknown as Promise<TodoDetailVO>;
}

export function createTodo(body: TodoRequest) {
  return apiClient.post("/admin/todos", body) as unknown as Promise<TodoDetailVO>;
}

export function updateTodo(id: number, body: TodoRequest) {
  return apiClient.put(`/admin/todos/${id}`, body) as unknown as Promise<TodoDetailVO>;
}

export function deleteTodo(id: number) {
  return apiClient.delete(`/admin/todos/${id}`) as unknown as Promise<void>;
}
