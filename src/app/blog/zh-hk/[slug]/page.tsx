import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import type { Metadata } from "next";

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getPostSlugs("zh-hk");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug("zh-hk", slug);
    return {
      title: `${post.title} | Profit Pulse Ally`,
      alternates: {
        languages: {
          en: `/blog/en/${slug}`,
          "zh-HK": `/blog/zh-hk/${slug}`,
        },
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostZhHkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug("zh-hk", slug);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/blog/zh-hk"
          className="text-sm text-foreground/70 hover:underline"
        >
          ← 返回 Blog
        </Link>
        <Link
          href={`/blog/en/${slug}`}
          className="text-sm text-foreground/70 hover:underline"
        >
          English version →
        </Link>
      </div>

      <article className="mx-auto max-w-3xl">
        <header className="space-y-3">
          {post.cover ? (
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl bg-foreground/5">
              <Image
                src={post.cover}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 768px, 100vw"
                priority
              />
            </div>
          ) : null}
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          {post.date ? (
            <time className="block text-sm text-foreground/60" dateTime={post.date}>
              {post.date}
            </time>
          ) : null}
        </header>

        <div
          className="prose prose-zinc mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}

