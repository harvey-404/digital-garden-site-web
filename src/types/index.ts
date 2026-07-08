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
  summary: string | null;
  coverImage: string | null;
  status: string;
  viewCount: number;
  likeCount: number;
  tags: string[];
  createdAt: string;
}

export interface PostDetailVO extends PostVO {
  contentMd: string;
  updatedAt: string;
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
  description: string | null;
  coverImage: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  techStack: string | null;
  sortOrder: number;
  createdAt: string;
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
  createdAt: string;
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
