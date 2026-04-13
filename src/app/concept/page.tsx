import {
  Award,
  Coffee,
  Home,
  Target,
  TrainFront,
  TrendingUp,
  Wifi,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "The Concept — 零成本人生 | Profit Pulse Ally",
  description:
    "當被動收入覆蓋必要支出：目標清晰、趨勢節奏、成就導向，通往零成本人生的路徑。",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaPrimary =
  `inline-flex min-h-11 w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 active:bg-foreground/85 sm:min-h-12 sm:px-8 ${focusRing}`;

const ctaSecondary =
  `inline-flex min-h-11 w-full items-center justify-center rounded-full border border-foreground/25 bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 active:bg-foreground/[0.07] sm:min-h-12 sm:px-8 ${focusRing}`;

const pillarIconWrap =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/8 text-foreground sm:h-14 sm:w-14";

const achievementCard =
  "group flex flex-col items-center gap-2 rounded-xl border border-foreground/10 bg-background p-3 text-center shadow-sm transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.99] sm:gap-3 sm:rounded-2xl sm:p-4 md:p-5";

export default function ConceptPage() {
  return (
    <main className="bg-background text-foreground">
      {/* Section 1: The Hook */}
      <section
        className="border-b border-foreground/10 px-3 py-6 sm:px-6 sm:py-10 md:py-12"
        aria-labelledby="concept-hook-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h1
            id="concept-hook-heading"
            className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
          >
            什麼是「零成本人生」?
          </h1>
          <p className="mt-2 text-pretty text-[13px] leading-snug text-foreground/80 sm:mt-3 sm:text-base sm:leading-relaxed md:text-lg">
            一個簡單而強大的目標：當你的被動收入，足以覆蓋你的必要支出。這不是遙不可及的夢想，而是一個可以透過清晰策略達成的里程碑。
          </p>
        </div>
      </section>

      {/* Section 2: Three Pillars */}
      <section
        className="border-b border-foreground/10 bg-foreground/[0.02] px-3 py-6 sm:px-6 sm:py-9 md:py-11"
        aria-labelledby="concept-pillars-heading"
      >
        <div className="mx-auto max-w-5xl">
          <h2
            id="concept-pillars-heading"
            className="sr-only"
          >
            三大支柱
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5">
            <article className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:p-5">
              <div className={pillarIconWrap}>
                <Target
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                  目標清晰
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/75 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  先定義你想要的結果，再倒推最小可行的行動，避免被雜訊牽著走。
                </p>
              </div>
            </article>

            <article className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:p-5">
              <div className={pillarIconWrap}>
                <TrendingUp
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                  趨勢節奏
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/75 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  掌握市場與內容的節奏：何時觀望、何時出手、何時加速，保持穩定增長。
                </p>
              </div>
            </article>

            <article className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:p-5">
              <div className={pillarIconWrap}>
                <Award
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                  成就導向
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/75 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  以里程碑衡量進度，把努力變成可累積的成果，逐步解鎖更高層級的回報。
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section 3: Achievements — 2×2 on all breakpoints */}
      <section
        className="border-b border-foreground/10 px-3 py-6 sm:px-6 sm:py-9 md:py-11"
        aria-labelledby="concept-achievements-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="concept-achievements-heading"
            className="text-balance text-xl font-semibold tracking-tight sm:text-2xl"
          >
            解鎖你的成就
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-snug text-foreground/75 sm:mt-2 sm:text-sm sm:leading-relaxed">
            「零成本人生」是一場通關遊戲，每一步都有明確的里程碑。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 md:gap-4">
            <div className={achievementCard}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/8 text-foreground sm:h-11 sm:w-11">
                <Coffee
                  className="h-5 w-5 sm:h-5 sm:w-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                早餐咖啡自由 勳章
              </h3>
            </div>
            <div className={achievementCard}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/8 text-foreground sm:h-11 sm:w-11">
                <TrainFront
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                通勤解放者 徽章
              </h3>
            </div>
            <div className={achievementCard}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/8 text-foreground sm:h-11 sm:w-11">
                <Wifi
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                網絡呼吸權 徽章
              </h3>
            </div>
            <div className={achievementCard}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/8 text-foreground sm:h-11 sm:w-11">
                <Home
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                上蓋結界師 徽章
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: CTA */}
      <section
        className="px-3 py-6 sm:px-6 sm:py-10 md:py-12"
        aria-labelledby="concept-cta-heading"
      >
        <div className="mx-auto max-w-lg text-center">
          <h2
            id="concept-cta-heading"
            className="text-balance text-xl font-semibold tracking-tight sm:text-2xl"
          >
            準備好踏出第一步了嗎？
          </h2>
          <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/event" className={ctaPrimary}>
              參加我們的線下戰略會議
            </Link>
            <Link href="/blog" className={ctaSecondary}>
              瀏覽我們的實戰文章
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
