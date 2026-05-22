import Image from "next/image";
import Link from "next/link";

import { getAllPosts } from "@/lib/blog";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

/** High-contrast primary CTA on dark hero / sections */
const ctaPrimaryOnDark =
  `inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:px-6 sm:py-3 ${focusRing}`;

const ctaGhostOnDark =
  `inline-flex w-full items-center justify-center rounded-full border border-white/40 bg-transparent px-5 py-2.5 text-center text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 active:bg-white/15 sm:w-auto sm:px-6 sm:py-3 ${focusRing}`;

export default async function Home() {
  const [zhPosts, enPosts] = await Promise.all([
    getAllPosts("zh-hk"),
    getAllPosts("en"),
  ]);

  const blogLang = zhPosts.length > 0 ? ("zh-hk" as const) : ("en" as const);
  const blogPosts = (blogLang === "zh-hk" ? zhPosts : enPosts).slice(0, 3);
  const blogMoreHref = blogLang === "zh-hk" ? "/blog/zh-hk" : "/blog/en";

  return (
    <main className="flex flex-col bg-zinc-950 text-zinc-50">
      {/* Value proposition */}
      <section
        className="border-b border-white/10 bg-zinc-950 py-4 sm:py-8"
        aria-labelledby="home-value-heading"
      >
        <div className="mx-auto max-w-5xl px-3 text-center sm:px-6">
          <h2
            id="home-value-heading"
            className="text-balance text-base font-semibold tracking-tight text-white sm:text-xl md:text-2xl"
          >
            一個專為新世代投資者而設的學習社群
          </h2>
          <p className="mx-auto mt-1.5 max-w-2xl text-xs font-medium leading-snug text-zinc-300 sm:mt-2 sm:text-sm sm:leading-relaxed md:text-base">
            透過實戰模擬，提升你的投資決策力。
          </p>
        </div>
      </section>

      {/* Hero */}
      <section className="relative min-h-[min(48vh,340px)] overflow-hidden sm:min-h-[min(70vh,520px)]">
        <Image
          src="/images/fortify-hero-chess-king.png"
          alt="Fortify Your Future — chess king spotlight"
          fill
          priority
          className="pointer-events-none object-cover object-right"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col px-3 py-7 sm:px-6 sm:py-16 md:py-20">
          <div className="max-w-3xl space-y-3 sm:space-y-5">
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Fortify Your Future / 守業增值創未來
            </h1>
            <p className="text-pretty text-[13px] leading-snug text-zinc-300 sm:text-base sm:leading-relaxed md:text-lg">
              A Fireside Chat with WeWork for Hong Kong&apos;s Ambitious Founders.
              Learn the playbook for growth, succession, and legacy.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-3 sm:pt-2">
              <Link href="#" className={ctaPrimaryOnDark}>
                Registration Opens Soon / 即將開放報名
              </Link>
              <Link href="/#event-highlights" className={ctaGhostOnDark}>
                查看星級嘉賓及活動流程
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event promo — conversion */}
      <section
        className="border-t border-white/10 bg-zinc-900/40 py-5 sm:py-8"
        aria-labelledby="home-event-promo-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-2xl sm:p-5 md:p-6">
            <div className="min-w-0">
              <h2
                id="home-event-promo-heading"
                className="text-base font-bold tracking-tight text-white sm:text-lg md:text-xl"
              >
                Fortify Your Future / 守業增值創未來
              </h2>
              <p className="mt-1 text-[13px] font-medium leading-snug text-zinc-200 sm:text-sm sm:leading-snug">
                A Fireside Chat with WeWork — Vicky Huang, ProfitPulseAlly founders,
                and Hong Kong&apos;s ambitious founder community.
              </p>
            </div>
            <Link
              href="/fortify-survey"
              className={`${ctaPrimaryOnDark} shrink-0 shadow-md shadow-black/20 sm:min-w-[10.5rem]`}
            >
              Register Your Interest
            </Link>
          </div>
        </div>
      </section>

      {/* Event highlights */}
      <section
        id="event-highlights"
        className="border-t border-white/10 bg-zinc-950 py-6 sm:py-12 md:py-14"
        aria-labelledby="highlights-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <h2
            id="highlights-heading"
            className="text-center text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
          >
            活動亮點
          </h2>
          <div className="mt-4 grid auto-rows-fr gap-4 md:mt-7 md:grid-cols-2 md:gap-5 lg:gap-6">
            <article className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
              <div className="flex flex-row items-start justify-center gap-3 sm:justify-start sm:gap-4">
                <div className="relative aspect-[3/4] w-full max-w-[160px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:max-w-[180px] sm:rounded-xl">
                  <Image
                    src="/vicky-headshot.png"
                    alt="Vicky"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 40vw, 180px"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                  重量級嘉賓: Vicky Huang (齊柏林熱狗聯合創辦人)
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-zinc-300 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                  Vicky Huang, co-founder of the local restaurant kingdom
                  &quot;Zeppelin Hot Dog,&quot; will share her invaluable,
                  first-hand experience in securing growth funding and scaling a
                  beloved Hong Kong brand.
                </p>
              </div>
            </article>

            <article className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
              <div className="flex flex-row items-start justify-center gap-3 sm:justify-start sm:gap-4">
                <div className="relative aspect-[3/4] w-full max-w-[160px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:max-w-[180px] sm:rounded-xl">
                  <Image
                    src="/logo.png"
                    alt="ProfitPulseAlly"
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 40vw, 180px"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                  Expert Insights from ProfitPulseAlly
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-zinc-300 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                  ProfitPulseAlly&apos;s founders, Prisken and Kevin, will
                  deconstruct the essential strategies for business succession,
                  valuation, and building a lasting legacy beyond yourself.
                </p>
              </div>
            </article>

            <article className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:gap-4 sm:rounded-2xl sm:p-5 md:col-span-2">
              <div className="relative mx-auto aspect-square w-full max-w-[160px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white sm:mx-0 sm:max-w-[140px] sm:rounded-xl">
                <Image
                  src="/images/wework-logo.png"
                  alt="WeWork logo"
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 85vw, 140px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">
                  Exclusive Partnership with WeWork
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-zinc-300 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                  An exclusive event co-hosted with WeWork to bring actionable
                  insights directly to the founder and business community.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Game — Castle Siege */}
      <section
        className="border-t border-white/10 bg-zinc-900/40 py-5 sm:py-8"
        aria-labelledby="home-game-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-2xl sm:p-5 md:p-6">
            <div className="min-w-0">
              <h2
                id="home-game-heading"
                className="text-base font-bold tracking-tight text-white sm:text-lg md:text-xl"
              >
                想測試你的投資直覺嗎？
              </h2>
              <p className="mt-1 text-[13px] font-medium leading-snug text-zinc-200 sm:text-sm sm:leading-snug">
                體驗我們的《城堡攻防戰》模擬挑戰。完成挑戰，了解你的投資風格，並解鎖與創辦人一對一的優先諮詢名額。
              </p>
            </div>
            <Link
              href="/investment-challenge"
              className={`${ctaPrimaryOnDark} shrink-0 shadow-md shadow-black/20 sm:min-w-[10.5rem]`}
            >
              開始挑戰
            </Link>
          </div>
        </div>
      </section>

      {/* Blog preview */}
      <section
        className="border-t border-white/10 bg-zinc-950 py-6 sm:py-12 md:py-14"
        aria-labelledby="home-blog-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h2
                id="home-blog-heading"
                className="text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
              >
                最新文章
              </h2>
              <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 sm:text-sm">
                {blogLang === "zh-hk" ? "中文（香港）" : "English"} 精選讀物
              </p>
            </div>
            <Link
              href="/blog"
              className="text-[13px] font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline active:text-zinc-200 sm:text-sm"
            >
              全部文章 →
            </Link>
          </div>

          {blogPosts.length > 0 ? (
            <div className="mt-4 grid auto-rows-fr gap-3 sm:mt-5 md:grid-cols-3 md:gap-4">
              {blogPosts.map((post) => {
                const href =
                  blogLang === "zh-hk"
                    ? `/blog/zh-hk/${post.slug}`
                    : `/blog/en/${post.slug}`;
                return (
                  <Link
                    key={post.slug}
                    href={href}
                    className={`group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 active:border-white/25 sm:rounded-2xl ${focusRing}`}
                  >
                    <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-800">
                      {post.cover ? (
                        <Image
                          src={post.cover}
                          alt=""
                          fill
                          className="object-cover transition-opacity group-hover:opacity-95 group-active:opacity-90"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2 sm:text-[15px]">
                        {post.title}
                      </h3>
                      {post.date ? (
                        <time
                          dateTime={post.date}
                          className="mt-1 text-[11px] text-zinc-500 sm:text-xs"
                        >
                          {post.date}
                        </time>
                      ) : null}
                      <p className="mt-2 flex-1 text-[12px] leading-snug text-zinc-400 line-clamp-2 sm:text-[13px] sm:leading-relaxed md:line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="mt-2 text-[11px] font-medium text-zinc-500 transition-colors group-hover:text-zinc-300 sm:text-xs">
                        {blogLang === "zh-hk" ? "閱讀全文 →" : "Read more →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              文章準備中，請稍後再來查看。
            </p>
          )}

          <div className="mt-4 sm:mt-5">
            <Link
              href={blogMoreHref}
              className={`${ctaGhostOnDark} w-full border-white/25 sm:w-auto`}
            >
              {blogLang === "zh-hk"
                ? "瀏覽中文文章列表"
                : "Browse English articles"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
