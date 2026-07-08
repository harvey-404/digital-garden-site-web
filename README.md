# Digital Garden Site — Frontend

个人数字花园站点的前端应用，包含博客文章、项目成果展示、关于我页面，以及完整的后台管理（文章、成果、评论审核、个人资料）。

## 技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite 8
- **路由**: React Router 7
- **样式**: Tailwind CSS 3 + @tailwindcss/typography
- **HTTP**: Axios
- **内容渲染**: react-markdown + remark-gfm
- **通知**: react-hot-toast

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。需要后端 API 在 `http://localhost:8080` 运行；Vite 已配置开发代理，将 `/api` 和 `/uploads` 转发到后端。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 请求基础路径 | `/api` |

开发环境见 `.env.development`，生产环境可复制 `.env.production.example` 为 `.env.production` 后按需修改。Docker 部署时通常保持 `/api`，由 Nginx 反向代理到后端。

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。本地预览：

```bash
npm run preview
```

预览时无 Vite 代理，需后端在 8080 端口运行，或仅验证页面加载与前端路由。

## Docker 部署

多阶段构建：Node 构建静态资源，Nginx 托管并反向代理 API。

```bash
docker build -t digital-garden-site-web .
docker run -p 80:80 digital-garden-site-web
```

前端容器需与后端处于同一 Docker 网络；`nginx.conf` 中 `server` 为后端 compose 服务名。建议将前端服务并入后端 `docker-compose.yml`，或使用统一 compose 文件一并启动。
