import apiClient from "./client";
import type { LikeResponse } from "../types";
import { getVisitorId } from "../lib/visitor";

export function likePost(postIdOrSlug: number | string) {
  return apiClient.post(`/posts/${postIdOrSlug}/like`, { visitorId: getVisitorId() }) as unknown as Promise<LikeResponse>;
}
