import { Award, Target, TrendingUp } from "lucide-react";

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={[
          "grid h-24 w-24 place-items-center rounded-full ring-1 ring-black/10 dark:ring-white/10",
          className,
        ].join(" ")}
      >
        <span className="text-xs font-medium text-black/70 dark:text-white/80">
          徽章
        </span>
      </div>
      <div className="text-sm font-medium text-foreground/80">{label}</div>
    </div>
  );
}

export default function ConceptPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Profit Pulse Ally 的盈利哲學
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-7 text-foreground/70">
          這裡以「清晰、節奏、成就」為核心：用可執行的觀點，把資訊轉化成你的下一步。
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
            下面的徽章暫時使用佔位文字與顏色；之後可以換成真實成就、條件與解鎖動畫。
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Badge label="佔位成就 A" className="bg-amber-200/70" />
          <Badge label="佔位成就 B" className="bg-emerald-200/70" />
          <Badge label="佔位成就 C" className="bg-sky-200/70" />
          <Badge label="佔位成就 D" className="bg-fuchsia-200/70" />
        </div>
      </section>
    </main>
  );
}

