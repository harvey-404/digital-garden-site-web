这是一篇**演示文章**，用来展示新 UI 的各项能力：目录导航、代码高亮、Aside 提示块、亮暗主题等。

## 引言：为什么重设计

个人网站不只是「能看」，还要**读得舒服**。这篇 Demo 模拟 Josh Comeau 风格的文章阅读体验——温暖配色、精致排版、代码块可复制。

> [!NOTE] 阅读提示
> 试试右上角 **亮/暗主题切换**；桌面端看右侧 **On this page** 目录；手机端点开文顶 **目录** 折叠块。

## 正文排版

Digital Garden 使用 **Fraunces** 衬线标题与 **DM Sans** 正文，行宽约 65 字符，适合长文阅读。

你可以使用：

- 无序列表展示要点
- **加粗** 与 `行内代码` 混排
- [站内链接](/posts) 与外链

| 能力 | 状态 | 说明 |
|------|------|------|
| 主题切换 | ✅ | CSS 变量驱动 |
| 文章目录 | ✅ | H2/H3 自动提取 |
| 代码高亮 | ✅ | Shiki + 复制按钮 |
| Aside | ✅ | GFM Alert 语法 |

### 三级标题示例

这是 H3 小节，会出现在目录里并带 `#` 锚点。把鼠标移到标题上试试。

> 普通引用块（非 Aside）——用于摘录或补充说明，样式与彩色提示块不同。

## Java 后端片段

Spring Boot 里一个简单的健康检查接口：

```java
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Result<String> health() {
        return Result.success("ok");
    }
}
```

点击代码块右上角 **复制** 即可拷贝。

## 前端 TypeScript

React 里获取文章详情：

```typescript
export async function getPost(slug: string): Promise<PostDetailVO> {
  return apiClient.get(`/posts/${slug}`) as unknown as Promise<PostDetailVO>;
}
```

## 部署命令

```bash
ssh aliyun-dg "cd /opt/digital-garden/deploy && sudo bash update.sh"
```

## 警告与注意事项

> [!warning] 性能说明
> Shiki 在首次打开含代码的文章时会 lazy 加载，属正常现象。首页不会加载高亮引擎。

> [!tip] 写作语法
> 后台编辑器里直接写 Markdown 即可。Aside 用 `> [!info]`、`> [!warning]`、`> [!tip]`、`> [!caution]`。

> [!caution] 安全提醒
> 生产环境请及时修改 `.env` 中的管理员密码。

## 结语

如果你认可这套阅读体验，可以在后台继续写真实内容；这篇 Demo 随时可在 `/admin/posts` 里删除或改为草稿。

**Happy reading!**
