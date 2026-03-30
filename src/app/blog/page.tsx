import Link from "next/link";

import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog | Profit Pulse Ally",
};

export default async function BlogLanguageChooserPage() {
  const [zhPosts, enPosts] = await Promise.all([
    getAllPosts("zh-hk"),
    getAllPosts("en"),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Blog
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-7 text-foreground/70">
          Choose a language to read.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">中文（香港）</h2>
            <Link
              href="/blog/zh-hk"
              className="text-sm text-foreground/70 hover:underline"
            >
              Browse →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {zhPosts.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/zh-hk/${p.slug}`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  {p.title}
                </Link>
                {p.date ? (
                  <div className="text-xs text-foreground/60">{p.date}</div>
                ) : null}
              </li>
            ))}
            {zhPosts.length === 0 ? (
              <li className="text-sm text-foreground/70">
                No posts yet.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">English</h2>
            <Link
              href="/blog/en"
              className="text-sm text-foreground/70 hover:underline"
            >
              Browse →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {enPosts.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/en/${p.slug}`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  {p.title}
                </Link>
                {p.date ? (
                  <div className="text-xs text-foreground/60">{p.date}</div>
                ) : null}
              </li>
            ))}
            {enPosts.length === 0 ? (
              <li className="text-sm text-foreground/70">
                No posts yet.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
