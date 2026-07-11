# Digital Garden E2E 测试用例

目标环境默认：`http://101.37.33.184`（可通过 `E2E_BASE_URL` 覆盖）

## 用例总览

| 编号 | 模块 | 用例 | 文件 |
|------|------|------|------|
| TC-API-001 | API | 健康检查 `/api/health` | `api.spec.ts` |
| TC-API-002 | API | 个人资料 `/api/profile` | `api.spec.ts` |
| TC-API-003 | API | 文章列表 `/api/posts` | `api.spec.ts` |
| TC-API-004 | API | 错误密码登录 401 | `api.spec.ts` |
| TC-API-005 | API | 点赞接口（slug 或 id） | `api.spec.ts` |
| TC-PUB-001 | 前台 | 首页导航 | `public.spec.ts` |
| TC-PUB-002 | 前台 | 首页内容区块 | `public.spec.ts` |
| TC-PUB-003 | 前台 | 灵感列表 | `public.spec.ts` |
| TC-PUB-004 | 前台 | 成果列表 | `public.spec.ts` |
| TC-PUB-005 | 前台 | 关于页 | `public.spec.ts` |
| TC-PUB-006 | 前台 | 404 页面 | `public.spec.ts` |
| TC-PUB-007 | 前台 | 文章详情入口 | `public.spec.ts` |
| TC-PUB-008 | 前台 | 文章搜索 | `public.spec.ts` |
| TC-POST-001 | 互动 | 点赞 | `post-interaction.spec.ts` |
| TC-POST-002 | 互动 | 提交评论 | `post-interaction.spec.ts` |
| TC-POST-003 | 互动 | 空评论校验 | `post-interaction.spec.ts` |
| TC-AUTH-001 | 鉴权 | 未登录拦截 | `admin-auth.spec.ts` |
| TC-AUTH-002 | 鉴权 | 错误密码 | `admin-auth.spec.ts` |
| TC-AUTH-003 | 鉴权 | 正确登录 | `admin-auth.spec.ts` |
| TC-AUTH-004 | 鉴权 | 退出登录 | `admin-auth.spec.ts` |
| TC-ADM-001 | 后台 | 导航菜单 | `admin-pages.spec.ts` |
| TC-ADM-002 | 后台 | 文章管理 | `admin-pages.spec.ts` |
| TC-ADM-003 | 后台 | 成果管理 | `admin-pages.spec.ts` |
| TC-ADM-004 | 后台 | 评论审核 | `admin-pages.spec.ts` |
| TC-ADM-005 | 后台 | 关于我 | `admin-pages.spec.ts` |
| TC-ADM-006 | 后台 | 新建文章表单 | `admin-pages.spec.ts` |

**合计：26 条**

## 运行方式

### 1. 配置凭据

```powershell
cd digital-garden-site-web
copy .env.e2e.example .env.e2e
# 编辑 .env.e2e，填入 E2E_ADMIN_PASSWORD
```

或在 PowerShell 临时设置：

```powershell
$env:E2E_BASE_URL = "http://101.37.33.184"
$env:E2E_ADMIN_USER = "harvey"
$env:E2E_ADMIN_PASSWORD = "你的密码"
```

### 2. 运行全部测试

```powershell
npm run test:e2e
```

### 3. 查看 HTML 报告

```powershell
npx playwright show-report e2e-report
```

### 4. 只跑某一类

```powershell
npx playwright test e2e/api.spec.ts
npx playwright test e2e/public.spec.ts
npx playwright test e2e/admin-auth.spec.ts
```

## 注意事项

- `TC-POST-002` 会在生产环境产生待审核评论，属预期行为。
- `TC-API-005` / `TC-POST-001` 需要服务器已部署「点赞支持 slug」的后端修复。
- 后台密码以服务器 `.env` 为准，勿提交 `.env.e2e` 到 Git。
