import apiClient from "./client";
import type { CommentVO } from "../types";

export function listComments(postIdOrSlug: number | string) {
  return apiClient.get(`/posts/${postIdOrSlug}/comments`) as unknown as Promise<CommentVO[]>;
}

export function submitComment(postIdOrSlug: number | string, nickname: string, content: string) {
  return apiClient.post(`/posts/${postIdOrSlug}/comments`, { nickname, content }) as unknown as Promise<CommentVO>;
}

export function adminListComments(status = "PENDING") {
  return apiClient.get("/admin/comments", { params: { status } }) as unknown as Promise<CommentVO[]>;
}

export function approveComment(id: number) {
  return apiClient.put(`/admin/comments/${id}/approve`) as unknown as Promise<CommentVO>;
}

export function deleteComment(id: number) {
  return apiClient.delete(`/admin/comments/${id}`) as unknown as Promise<void>;
}
