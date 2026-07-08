import apiClient from "./client";

export function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiClient.post("/admin/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }) as unknown as Promise<{ url: string }>;
}
