import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import type { ApiResult } from "../types";

export const TOKEN_KEY = "dg_token";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult<unknown>;
    if (body.code === 0) {
      return body.data as typeof response;
    }
    if (body.code === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    toast.error(body.message || "请求失败");
    return Promise.reject(new Error(body.message || "请求失败"));
  },
  (error: AxiosError) => {
    toast.error(error.message || "网络错误");
    return Promise.reject(error);
  }
);

export default apiClient;
