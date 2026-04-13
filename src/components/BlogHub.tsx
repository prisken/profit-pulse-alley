"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { BlogPostListItem } from "@/lib/blog";

type Lang = "zh-hk" | "en";

function picsumSrc(slug: string, lang: Lang): string {
  const seed = encodeURIComponent(`${lang}-${slug}`);
  return `https://picsum.photos/seed/${seed}/960/600`;
}

function excerptFallback(lang: Lang): string {
  return lang === "zh-hk"
    ? "這篇文章探討了理財與投資思維，幫你逐步建立更清晰的財務方向。"
    : "This article explores money mindset and investing ideas to help you build a clearer financial path.";
}

function formatDateDisplay(dateStr: string, lang: Lang): string {
  if (!dateStr) return lang === "zh-hk" ? "日期待定" : "Date TBC";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  try {
    return new Intl.DateTimeFormat(lang === "zh-hk" ? "zh-HK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function ArticleCard({
  post,
  lang,
}: {
  post: BlogPostListItem;
  lang: Lang;
}) {
  const href = lang === "zh-hk" ? `/blog/zh-hk/${post.slug}` : `/blog/en/${post.slug}`;
  const imgSrc = post.cover?.trim() ? post.cover : picsumSrc(post.slug, lang);
  const excerpt =
    post.excerpt?.trim() || excerptFallback(lang);
  const readMore = lang === "zh-hk" ? "閱讀全文 →" : "Read more →";

  return (
    <Link
      href={href}
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 bg-foreground/5">
        <Image
          src={imgSrc}
          alt=""
          fill
          className="object-cover transition-opacity duration-200 group-hover:opacity-95"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground line-clamp-2 sm:text-base">
          {post.title}
        </h3>
        <time
          dateTime={post.date || undefined}
          className="text-[11px] text-foreground/50 sm:text-xs"
        >
          {formatDateDisplay(post.date, lang)}
        </time>
        <p className="flex-1 text-[13px] leading-snug text-foreground/70 line-clamp-3 sm:text-sm sm:leading-relaxed">
          {excerpt}
        </p>
        <span className="text-[13px] font-medium text-foreground underline-offset-4 group-hover:underline sm:text-sm">
          {readMore}
        </span>
      </div>
    </Link>
  );
}

function FeaturedArticle({
  post,
  lang,
}: {
  post: BlogPostListItem;
  lang: Lang;
}) {
  const href = lang === "zh-hk" ? `/blog/zh-hk/${post.slug}` : `/blog/en/${post.slug}`;
  const imgSrc = post.cover?.trim() ? post.cover : picsumSrc(post.slug, lang);
  const excerpt =
    post.excerpt?.trim() || excerptFallback(lang);
  const readMore = lang === "zh-hk" ? "閱讀全文" : "Read more";
  const featuredLabel = lang === "zh-hk" ? "精選文章" : "Featured";

  return (
    <article className="overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm sm:rounded-2xl">
      <div className="grid gap-0 md:grid-cols-2 md:items-stretch">
        <Link
          href={href}
          className="relative aspect-[16/10] min-h-[180px] bg-foreground/5 md:aspect-auto md:min-h-[240px]"
        >
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover transition-opacity hover:opacity-95"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </Link>
        <div className="flex flex-col justify-center gap-2 p-4 sm:gap-3 sm:p-6 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45 sm:text-xs">
            {featuredLabel}
          </p>
          <h2 className="text-balance text-lg font-semibold leading-snug tracking-tight sm:text-xl md:text-2xl">
            <Link href={href} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <time
            dateTime={post.date || undefined}
            className="text-[11px] text-foreground/50 sm:text-xs"
          >
            {formatDateDisplay(post.date, lang)}
          </time>
          <p className="text-[13px] leading-snug text-foreground/75 line-clamp-4 sm:text-sm sm:leading-relaxed md:line-clamp-5">
            {excerpt}
          </p>
          <Link
            href={href}
            className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 active:bg-foreground/85 sm:mt-2 sm:w-auto sm:self-start"
          >
            {readMore}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogHub({
  zhPosts,
  enPosts,
}: {
  zhPosts: BlogPostListItem[];
  enPosts: BlogPostListItem[];
}) {
  const [lang, setLang] = useState<Lang>("zh-hk");

  const posts = lang === "zh-hk" ? zhPosts : enPosts;
  const featured = posts[0];
  const rest = posts.slice(1);

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      active
        ? "bg-foreground text-background shadow-sm"
        : "text-foreground/65 hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10"
    }`;

  const emptyCopy =
    lang === "zh-hk" ? "此語言暫時沒有文章。" : "No articles in this language yet.";

  return (
    <div>
      <div
        className="inline-flex w-full max-w-md items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.04] p-1 sm:w-auto"
        role="tablist"
        aria-label="Blog language"
      >
        <button
          type="button"
          role="tab"
          id="tab-zh-hk"
          aria-selected={lang === "zh-hk"}
          aria-controls="panel-blog"
          className={`flex-1 sm:flex-none ${tabClass(lang === "zh-hk")}`}
          onClick={() => setLang("zh-hk")}
        >
          中文（香港）
        </button>
        <button
          type="button"
          role="tab"
          id="tab-en"
          aria-selected={lang === "en"}
          aria-controls="panel-blog"
          className={`flex-1 sm:flex-none ${tabClass(lang === "en")}`}
          onClick={() => setLang("en")}
        >
          English
        </button>
      </div>

      <div
        id="panel-blog"
        role="tabpanel"
        aria-labelledby={lang === "zh-hk" ? "tab-zh-hk" : "tab-en"}
        className="mt-5 sm:mt-7"
      >
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-foreground/20 bg-foreground/[0.02] px-4 py-8 text-center text-sm text-foreground/65">
            {emptyCopy}
          </p>
        ) : (
          <>
            <section aria-labelledby="featured-heading" className="mb-5 sm:mb-7">
              <h2 id="featured-heading" className="sr-only">
                {lang === "zh-hk" ? "精選文章" : "Featured article"}
              </h2>
              <FeaturedArticle post={featured} lang={lang} />
            </section>

            {rest.length > 0 ? (
              <section aria-labelledby="articles-grid-heading">
                <h2
                  id="articles-grid-heading"
                  className="mb-3 text-base font-semibold tracking-tight text-foreground sm:mb-4 sm:text-lg"
                >
                  {lang === "zh-hk" ? "更多文章" : "More articles"}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {rest.map((post) => (
                    <ArticleCard key={post.slug} post={post} lang={lang} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
