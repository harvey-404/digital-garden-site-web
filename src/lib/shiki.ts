import { createHighlighter, type Highlighter } from "shiki/bundle/web";

const LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "java",
  "css",
  "bash",
  "json",
  "sql",
  "xml",
  "html",
  "markdown",
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: "light" | "dark",
): Promise<string | null> {
  if (!(LANGS as readonly string[]).includes(lang)) return null;
  const highlighter = await getHighlighter();
  const shikiTheme = theme === "dark" ? "github-dark" : "github-light";
  return highlighter.codeToHtml(code.trimEnd(), { lang, theme: shikiTheme });
}
