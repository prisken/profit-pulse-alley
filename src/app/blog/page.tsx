import { BlogHub } from "@/components/BlogHub";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog | Profit Pulse Ally",
  description:
    "理財思維、被動收入與投資學習文章。選擇中文（香港）或 English 瀏覽。",
};

export default async function BlogIndexPage() {
  const [zhPosts, enPosts] = await Promise.all([
    getAllPosts("zh-hk"),
    getAllPosts("en"),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-9 md:py-11">
      <header className="border-b border-foreground/10 pb-4 sm:pb-5">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Blog
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-snug text-foreground/70 sm:mt-2 sm:text-sm sm:leading-relaxed">
          選擇語言，瀏覽最新文章與精選內容。
        </p>
      </header>

      <div className="pt-4 sm:pt-5">
        <BlogHub zhPosts={zhPosts} enPosts={enPosts} />
      </div>
    </main>
  );
}
