import apiClient from "./client";
import type { PageResult, PostVO, PostDetailVO, PostRequest } from "../types";

export function listPosts(page = 0, size = 10, tag?: string) {
  return apiClient.get("/posts", { params: { page, size, tag } }) as unknown as Promise<PageResult<PostVO>>;
}

export function searchPosts(q: string, page = 0, size = 10) {
  return apiClient.get("/posts/search", { params: { q, page, size } }) as unknown as Promise<PageResult<PostVO>>;
}

export function getPost(slug: string) {
  return apiClient.get(`/posts/${slug}`) as unknown as Promise<PostDetailVO>;
}

export function adminListPosts(page = 0, size = 10) {
  return apiClient.get("/admin/posts", { params: { page, size } }) as unknown as Promise<PageResult<PostVO>>;
}

export function adminGetPost(id: number) {
  return apiClient.get(`/admin/posts/${id}`) as unknown as Promise<PostDetailVO>;
}

export function createPost(body: PostRequest) {
  return apiClient.post("/admin/posts", body) as unknown as Promise<PostDetailVO>;
}

export function updatePost(id: number, body: PostRequest) {
  return apiClient.put(`/admin/posts/${id}`, body) as unknown as Promise<PostDetailVO>;
}

export function deletePost(id: number) {
  return apiClient.delete(`/admin/posts/${id}`) as unknown as Promise<void>;
}
