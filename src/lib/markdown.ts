import type { Element } from "hast";
import GithubSlugger from "github-slugger";

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const HEADING_RE = /^(#{2,3})\s+(.+)$/;

/** GitHub Alerts 仅认 NOTE/TIP/IMPORTANT/WARNING/CAUTION；统一换行并做别名兼容 */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/^>\s*\[!info\]/gim, "> [!NOTE]")
    .replace(/^>\s*\[!success\]/gim, "> [!TIP]");
}

export function getNodeClassName(node?: Element): string {
  const raw = node?.properties?.className;
  if (Array.isArray(raw)) return raw.map(String).join(" ");
  if (typeof raw === "string") return raw;
  return "";
}

export function extractHeadings(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  for (const line of normalizeMarkdown(markdown).split("\n")) {
    const match = HEADING_RE.exec(line.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/\s+#*\s*$/, "").trim();
    headings.push({ id: slugger.slug(text), text, level });
  }

  return headings;
}

export function formatPostDate(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}
