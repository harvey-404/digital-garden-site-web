import apiClient from "./client";

export function listTags() {
  return apiClient.get("/tags") as unknown as Promise<string[]>;
}
