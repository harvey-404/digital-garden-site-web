import apiClient from "./client";
import type { ProfileVO } from "../types";

export function getProfile() {
  return apiClient.get("/profile") as unknown as Promise<ProfileVO>;
}

export function updateProfile(body: ProfileVO) {
  return apiClient.put("/admin/profile", body) as unknown as Promise<ProfileVO>;
}
