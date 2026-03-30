import Link from "next/link";

import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog | Profit Pulse Alley",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Blog
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-7 text-foreground/70">
          最新文章與觀點更新。
        </p>
      </header>

      <section className="mt-10">
        {posts.length === 0 ? (
          <div className="rounded-xl border bg-background p-6 text-sm text-foreground/70">
            目前未有文章。請在專案根目錄的 <code className="font-mono">posts/</code>{" "}
            新增 <code className="font-mono">.md</code> 檔案。
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <article key={post.slug} className="rounded-xl border p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-lg font-semibold">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {post.title}
                    </Link>
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
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

