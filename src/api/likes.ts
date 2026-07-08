import apiClient from "./client";
import type { LikeResponse } from "../types";
import { getVisitorId } from "../lib/visitor";

export function likePost(postId: number) {
  return apiClient.post(`/posts/${postId}/like`, { visitorId: getVisitorId() }) as unknown as Promise<LikeResponse>;
}
