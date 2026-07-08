import apiClient from "./client";
import type { LoginResponse } from "../types";

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiClient.post("/auth/login", { username, password }) as unknown as Promise<LoginResponse>;
}
