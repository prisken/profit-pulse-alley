import { Calendar, ExternalLink, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const LUMA_REGISTRATION_URL = "https://luma.com/vbjuzo79";

export const metadata = {
  title: "Event | Profit Pulse Ally",
};

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export default function EventPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20rem)] lg:items-start lg:gap-12 xl:gap-16">
        {/* Main column */}
        <section className="flex min-w-0 flex-col gap-8 lg:gap-10">
          <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] shadow-sm">
            <div className="relative aspect-[3/4] w-full sm:aspect-[16/10] md:aspect-[3/4]">
              <Image
                src="/event/key-visual.png"
                alt="我兩樣都要 活動主視覺"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
            </div>
          </div>

          <Card>
            <p className="text-balance text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
              一次為你度身訂造的戰略會議。
            </p>
            <p className="mt-5 text-sm leading-7 text-foreground/80">
              徹底解放思維，讓你學會：
            </p>
            <ul className="mt-5 space-y-3.5 text-sm leading-7 text-foreground/80">
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  ✅
                </span>
                <span>進攻策略：如何擴張版圖，抓住市場機遇？</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  ✅
                </span>
                <span>防守策略：如何建立壁壘，抵禦風險，穩固現金流？</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  ✅
                </span>
                <span>
                  思維融合：如何將夢想（城堡）與現實（城市）完美結合，打造可持續的成功？
                </span>
              </li>
            </ul>
            <p className="mt-8 border-t border-foreground/10 pt-6 text-sm font-medium italic leading-relaxed text-foreground/90">
              「軍師嘅對話，只留俾有準備嘅人」。
            </p>
          </Card>

          <div className="grid gap-8 md:grid-cols-2 md:gap-6 md:items-stretch">
            <Card className="flex flex-col">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">
                重點帶走
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-foreground/80">
                <li className="flex gap-2">
                  <span aria-hidden="true">🔥</span>
                  <span>限定名額20人！</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">🔥</span>
                  <span>包括 一對一策略諮詢，直擊痛點。</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">🔥</span>
                  <span>這場「軍師嘅對話」，只為有準備的你而設。</span>
                </li>
              </ul>
            </Card>

            <Card className="flex flex-col">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">
                活動資料
              </h2>
              <ul className="mt-5 divide-y divide-foreground/10">
                <li className="flex gap-4 pb-4 first:pt-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <span className="text-xs font-medium text-foreground/45">
                      日期時間
                    </span>
                    <p className="mt-0.5 text-sm leading-6 text-foreground/85">
                      4月27日 · 14:30–17:30
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <span className="text-xs font-medium text-foreground/45">
                      地點
                    </span>
                    <p className="mt-0.5 text-sm leading-6 text-foreground/85">
                      The Upper House, Pacific Place
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 pt-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <span className="text-xs font-medium text-foreground/45">
                      費用
                    </span>
                    <p className="mt-0.5 text-sm leading-6 text-foreground/85">
                      HKD 300
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Registration column */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="border-foreground/10 p-6 shadow-md sm:p-7">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                立即報名
              </h2>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">
                Register now
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.04] to-foreground/[0.02] p-6 sm:p-7">
              <p className="text-center text-sm leading-relaxed text-foreground/70">
                報名及購票（將於新分頁開啟）
              </p>
              <a
                href={LUMA_REGISTRATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                立即留位
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-6">
              <a
                href="/game"
                className="inline-flex w-full items-center justify-center rounded-full border border-foreground/20 bg-transparent px-6 py-3.5 text-sm font-semibold text-foreground/85 transition-colors hover:border-foreground/35 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                挑戰贏取免費門票
              </a>
            </div>

            <p className="mt-6 border-t border-foreground/10 pt-5 text-xs leading-relaxed text-foreground/55">
              P.S. Keep an eye out for our &apos;Investment Challenge&apos; –
              coming soon! You&apos;ll have a chance to win a free spot to this
              event.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}
