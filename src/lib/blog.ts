import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export type BlogPostFrontmatter = {
  title: string;
  date: string;
};

export type BlogPostListItem = BlogPostFrontmatter & {
  slug: string;
  excerpt: string;
};

export type BlogPost = BlogPostFrontmatter & {
  slug: string;
  contentHtml: string;
  excerpt: string;
};

const POSTS_DIR = path.join(process.cwd(), "posts");

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

async function listMarkdownFiles(): Promise<string[]> {
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name);
}

export async function getAllPosts(): Promise<BlogPostListItem[]> {
  const files = await listMarkdownFiles();

  const posts = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/i, "");
      const fullPath = path.join(POSTS_DIR, filename);
      const file = await fs.readFile(fullPath, "utf8");

      const { data, content } = matter(file);
      const title = asString((data as Record<string, unknown>)?.title) ?? slug;
      const date = asString((data as Record<string, unknown>)?.date) ?? "";
      const excerpt = buildExcerpt(content);

      return { slug, title, date, excerpt } satisfies BlogPostListItem;
    }),
  );

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

export async function getPostSlugs(): Promise<string[]> {
  const files = await listMarkdownFiles();
  return files.map((f) => f.replace(/\.md$/i, ""));
}

export async function getPostBySlug(slug: string): Promise<BlogPost> {
  const fullPath = path.join(POSTS_DIR, `${slug}.md`);
  const file = await fs.readFile(fullPath, "utf8");

  const { data, content } = matter(file);
  const title = asString((data as Record<string, unknown>)?.title) ?? slug;
  const date = asString((data as Record<string, unknown>)?.date) ?? "";
  const excerpt = buildExcerpt(content);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return { slug, title, date, excerpt, contentHtml };
}

