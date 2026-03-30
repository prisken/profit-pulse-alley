import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export type BlogPostFrontmatter = {
  title: string;
  date: string;
  cover?: string;
};

export type BlogLang = "en" | "zh-hk";

export type BlogPostListItem = BlogPostFrontmatter & {
  slug: string;
  lang: BlogLang;
  excerpt: string;
};

export type BlogPost = BlogPostFrontmatter & {
  slug: string;
  lang: BlogLang;
  contentHtml: string;
  excerpt: string;
};

function postsDir(lang: BlogLang) {
  return path.join(process.cwd(), "posts", lang);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;
  return null;
}

function buildExcerpt(rawContent: string, maxLen = 160): string {
  const collapsed = rawContent
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!collapsed) return "";
  if (collapsed.length <= maxLen) return collapsed;
  return `${collapsed.slice(0, maxLen).trimEnd()}…`;
}

async function listMarkdownFiles(lang: BlogLang): Promise<string[]> {
  try {
    const entries = await fs.readdir(postsDir(lang), { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => e.name);
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

export async function getAllPosts(lang: BlogLang): Promise<BlogPostListItem[]> {
  const files = await listMarkdownFiles(lang);

  const posts = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/i, "");
      const fullPath = path.join(postsDir(lang), filename);
      const file = await fs.readFile(fullPath, "utf8");

      const { data, content } = matter(file);
      const cover = asString((data as Record<string, unknown>)?.cover) ?? undefined;
      const title = asString((data as Record<string, unknown>)?.title) ?? slug;
      const date = asString((data as Record<string, unknown>)?.date) ?? "";
      const excerpt = buildExcerpt(content);

      return { slug, title, date, cover, lang, excerpt } satisfies BlogPostListItem;
    }),
  );

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

export async function getPostSlugs(lang: BlogLang): Promise<string[]> {
  const files = await listMarkdownFiles(lang);
  return files.map((f) => f.replace(/\.md$/i, ""));
}

export async function getPostBySlug(
  lang: BlogLang,
  slug: string,
): Promise<BlogPost> {
  const fullPath = path.join(postsDir(lang), `${slug}.md`);
  const file = await fs.readFile(fullPath, "utf8");

  const { data, content } = matter(file);
  const cover = asString((data as Record<string, unknown>)?.cover) ?? undefined;
  const title = asString((data as Record<string, unknown>)?.title) ?? slug;
  const date = asString((data as Record<string, unknown>)?.date) ?? "";
  const excerpt = buildExcerpt(content);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return { slug, title, date, cover, lang, excerpt, contentHtml };
}

