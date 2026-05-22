import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Users } from "lucide-react";

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

      {/* Hero — full king visible, sized between contain (small) and cover (large) */}
      <section
        className="relative flex min-h-[290px] max-h-[340px] items-center overflow-hidden bg-zinc-950 sm:min-h-[320px] sm:max-h-[380px] lg:max-h-[400px]"
        aria-label="Fortify Your Future hero"
      >
        <div className="absolute inset-y-0 right-0 w-full sm:w-[66%] md:w-[58%] lg:w-[54%]">
          <Image
            src="/images/fortify-hero-chess-king.png"
            alt=""
            fill
            priority
            className="pointer-events-none origin-right object-contain object-right scale-[1.05] sm:scale-[1.07]"
            sizes="(max-width: 640px) 100vw, 58vw"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-r from-zinc-950 from-[36%] via-zinc-950/80 via-[54%] to-transparent sm:from-[40%] sm:via-[58%]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-3 py-8 sm:px-6 sm:py-10 md:py-12">
          <div className="max-w-xl space-y-3 sm:max-w-2xl sm:space-y-5 lg:max-w-3xl">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
              Fortify Your Future / 守業增值創未來
            </h1>
            <p className="text-pretty text-[13px] leading-snug text-zinc-100 drop-shadow-sm sm:text-base sm:leading-relaxed md:text-lg">
              A Fireside Chat with WeWork for Hong Kong&apos;s Ambitious Founders.
              Learn the playbook for growth, succession, and legacy.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-3 sm:pt-2">
              <Link href="#" className={ctaPrimaryOnDark}>
                Registration Opens Soon / 即將開放報名
              </Link>
              <Link href="/#meet-the-speakers" className={ctaGhostOnDark}>
                Meet the Speakers / 認識嘉賓
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Speakers */}
      <section
        id="meet-the-speakers"
        className="border-t border-white/10 bg-zinc-950 py-8 sm:py-12 md:py-14"
        aria-labelledby="speakers-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <h2
            id="speakers-heading"
            className="text-center text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
          >
            Meet the Speakers / 本次活動嘉賓
          </h2>
          <div className="mt-6 grid gap-5 sm:mt-8 md:grid-cols-2 md:gap-6">
            <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:flex-row">
              <div className="relative aspect-[4/5] w-full shrink-0 sm:aspect-auto sm:w-44 md:w-48">
                <Image
                  src="/vicky-headshot.png"
                  alt="Vicky Huang"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-white">Vicky Huang</h3>
                <p className="mt-0.5 text-sm font-medium text-amber-400/90">
                  Co-founder, Zeppelin Hot Dog
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                  Vicky will share her invaluable, first-hand experience in securing
                  growth funding and scaling a beloved Hong Kong brand from the ground
                  up.
                </p>
              </div>
            </article>

            <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:flex-row">
              <div className="relative flex aspect-[4/5] w-full shrink-0 items-center justify-center bg-white p-8 sm:aspect-auto sm:w-44 md:w-48">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                  <Image
                    src="/logo.png"
                    alt="ProfitPulseAlly"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 112px, 128px"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-white">Prisken &amp; Kevin</h3>
                <p className="mt-0.5 text-sm font-medium text-amber-400/90">
                  Founders, ProfitPulseAlly
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                  As experts in business valuation and succession planning, Prisken
                  and Kevin will deconstruct the essential strategies for building a
                  lasting legacy beyond yourself.
                </p>
              </div>
            </article>
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
                A Fireside Chat with WeWork — register your interest and help shape
                this exclusive founder event.
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

      {/* Why You Should Attend */}
      <section
        id="event-highlights"
        className="border-t border-white/10 bg-zinc-950 py-8 sm:py-12 md:py-14"
        aria-labelledby="highlights-heading"
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <h2
            id="highlights-heading"
            className="text-center text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
          >
            Why You Should Attend / 活動亮點
          </h2>
          <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-3 md:gap-5">
            <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-200/20 bg-white p-2.5 shadow-sm">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/wework-logo.png"
                    alt="WeWork logo"
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white sm:text-base">
                Exclusive WeWork Partnership
              </h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                An event co-hosted with WeWork, bringing actionable insights directly
                to the founder and business community in a premium setting.
              </p>
            </article>

            <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <TrendingUp className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white sm:text-base">
                Growth &amp; Legacy Playbook
              </h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                Move beyond theory. Gain practical steps for valuation, succession
                planning, and securing development capital for your business.
              </p>
            </article>

            <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Users className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white sm:text-base">
                Connect with Founders
              </h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
                Join a curated group of ambitious founders, entrepreneurs, and
                industry leaders in a professional and engaging environment.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Our Network of Experts */}
      <section
        className="border-t border-white/10 bg-zinc-900/30 py-8 sm:py-10 md:py-12"
        aria-labelledby="network-heading"
      >
        <div className="mx-auto max-w-5xl px-3 text-center sm:px-6">
          <h2
            id="network-heading"
            className="text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
          >
            Our Network of Experts / 曾合作嘉賓
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400 sm:text-sm">
            We collaborate with industry leaders and best-selling authors to bring you
            unparalleled insights.
          </p>

          <div className="mt-8 flex flex-wrap items-stretch justify-center gap-6 sm:gap-10 md:mt-10">
            <div className="flex min-w-[140px] max-w-[200px] flex-1 flex-col items-center rounded-xl border border-white/5 bg-zinc-950/50 px-4 py-5 sm:min-w-[160px]">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/15 ring-2 ring-amber-500/20">
                <Image
                  src="/marcy-chan-headshot.png"
                  alt="Marcy Chan"
                  fill
                  className="object-cover object-top"
                  sizes="64px"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">Marcy Chan</p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
                Bestselling Author,《以「輪」擊石》
              </p>
            </div>

            <div className="flex min-w-[140px] max-w-[200px] flex-1 flex-col items-center rounded-xl border border-white/5 bg-zinc-950/50 px-4 py-5 sm:min-w-[160px]">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/15 ring-2 ring-amber-500/20">
                <Image
                  src="/vicky-headshot.png"
                  alt="Vicky Huang"
                  fill
                  className="object-cover object-center"
                  sizes="64px"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">Vicky Huang</p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
                Co-founder, Zeppelin Hot Dog
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — placeholder */}
      <section
        className="border-t border-white/10 bg-zinc-950 py-8 sm:py-12"
        aria-labelledby="testimonials-heading"
      >
        <div className="mx-auto max-w-3xl px-3 text-center sm:px-6">
          <h2
            id="testimonials-heading"
            className="text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
          >
            What Our Clients Say
          </h2>
          <blockquote className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 sm:px-8 sm:py-10">
            <p className="text-[13px] italic leading-relaxed text-zinc-500 sm:text-sm">
              Client testimonial coming soon — share how ProfitPulseAlly helped you
              plan for growth, succession, or legacy.
            </p>
          </blockquote>
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

      {/* Castle Siege — de-prioritized */}
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
              className={`${ctaGhostOnDark} shrink-0 sm:min-w-[10.5rem]`}
            >
              開始挑戰
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
