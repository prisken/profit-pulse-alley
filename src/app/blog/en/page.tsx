import Link from "next/link";
import Image from "next/image";

import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog (English) | Profit Pulse Ally",
};

export default async function BlogEnglishIndexPage() {
  const posts = await getAllPosts("en");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Blog
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-foreground/5 px-3 py-1 text-foreground/70">
            English
          </span>
          <Link href="/blog/zh-hk" className="text-foreground/70 hover:underline">
            中文（香港）
          </Link>
        </div>
      </header>

      <section className="mt-10">
        {posts.length === 0 ? (
          <div className="rounded-xl border bg-background p-6 text-sm text-foreground/70">
            No posts yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/blog/en/${post.slug}`} className="block">
                  <div className="relative aspect-[16/9] bg-foreground/5">
                    {post.cover ? (
                      <Image
                        src={post.cover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 50vw, 100vw"
                        priority={false}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-lg font-semibold leading-7 underline-offset-4 group-hover:underline">
                        {post.title}
                      </h2>
                      {post.date ? (
                        <time
                          className="text-sm text-foreground/60"
                          dateTime={post.date}
                        >
                          {post.date}
                        </time>
                      ) : null}
                    </div>

                    {post.excerpt ? (
                      <p className="mt-3 text-sm leading-6 text-foreground/70">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

