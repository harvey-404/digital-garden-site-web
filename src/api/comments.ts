import apiClient from "./client";
import type { CommentVO } from "../types";

export function listComments(postId: number) {
  return apiClient.get(`/posts/${postId}/comments`) as unknown as Promise<CommentVO[]>;
}

export function submitComment(postId: number, nickname: string, content: string) {
  return apiClient.post(`/posts/${postId}/comments`, { nickname, content }) as unknown as Promise<CommentVO>;
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
