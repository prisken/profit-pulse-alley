import { Award, Target, TrendingUp } from "lucide-react";
import { ConceptBadgesGrid } from "@/components/ConceptBadges";

export default function ConceptPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Profit Pulse Ally 的盈利哲學
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-7 text-foreground/70">
          「清晰、節奏、成就」為核心：用可執行的節奏，成就零成本人生!
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground/5">
              <Target className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">目標清晰</h2>
              <p className="text-sm leading-6 text-foreground/70">
                先定義你想要的結果，再倒推最小可行的行動，避免被雜訊牽著走。
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground/5">
              <TrendingUp
                className="h-5 w-5 text-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">趨勢節奏</h2>
              <p className="text-sm leading-6 text-foreground/70">
                掌握市場與內容的節奏：何時觀望、何時出手、何時加速，保持穩定增長。
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground/5">
              <Award className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">成就導向</h2>
              <p className="text-sm leading-6 text-foreground/70">
                以里程碑衡量進度，把努力變成可累積的成果，逐步解鎖更高層級的回報。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            解鎖你的成就
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-foreground/70">
            下面的徽章示範「零成本人生」的里程碑概念。
          </p>
        </div>
        <ConceptBadgesGrid />
      </section>
    </main>
  );
}

