export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface PostVO {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  status: string;
  viewCount: number;
  likeCount: number;
  tags: string[];
  inDtm: number;
}

export interface PostDetailVO extends PostVO {
  contentMd: string;
  updateDtm: number;
}

export interface PostRequest {
  title: string;
  slug: string;
  contentMd: string;
  summary?: string;
  coverImage?: string;
  status: string;
  tags: string[];
}

export interface ProjectVO {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  projectUrl: string;
  repoUrl: string;
  techStack: string;
  sortOrder: number;
  inDtm: number;
}

export interface ProjectRequest {
  title: string;
  description?: string;
  coverImage?: string;
  projectUrl?: string;
  repoUrl?: string;
  techStack?: string;
  sortOrder?: number;
}

export interface CommentVO {
  id: number;
  postId: number;
  nickname: string;
  content: string;
  status: string;
  inDtm: number;
}

export interface ProfileVO {
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  socialLinks: string | null;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface LikeResponse {
  likeCount: number;
  liked: boolean;
}

export type TodoPriority = "HIGH" | "MEDIUM" | "LOW";

export interface TodoVO {
  id: number;
  title: string;
  slug: string;
  description: string;
  priority: TodoPriority;
  progress: number;
  status: string;
  sortOrder: number;
  inDtm: number;
}

export interface TodoDetailVO extends TodoVO {
  planMd: string;
  updateDtm: number;
}

export interface TodoRequest {
  title: string;
  slug: string;
  description?: string;
  planMd?: string;
  priority?: TodoPriority;
  progress?: number;
  status?: string;
  sortOrder?: number;
}
