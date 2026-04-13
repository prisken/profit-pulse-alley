import { Calendar, ExternalLink, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const LUMA_REGISTRATION_URL = "https://luma.com/vbjuzo79";
const GAME_PAGE_URL = "/game";

/** Google Maps embed (no API key): search query for the venue area */
const VENUE_MAP_EMBED_SRC =
  "https://maps.google.com/maps?q=20+Waterloo+Road+Yau+Ma+Tei+Kowloon+Hong+Kong&hl=zh-TW&z=17&ie=UTF8&iwloc=&output=embed";

export const metadata = {
  title: "《我兩樣都要》| Profit Pulse Ally",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Primary CTA — solid foreground (brand) */
const ctaPrimary =
  `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:min-h-12 sm:px-6 sm:py-3.5 ${focusRing}`;

/** Secondary CTA — outline */
const ctaSecondary =
  `inline-flex min-h-11 w-full items-center justify-center rounded-full border border-foreground/25 bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 sm:min-h-12 sm:px-6 sm:py-3.5 ${focusRing}`;

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:rounded-2xl sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export default function EventPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-3 py-5 pb-[10.5rem] sm:px-6 sm:py-10 sm:pb-28 lg:pb-14">
        {/* Section 1: Hero */}
        <section
          className="border-b border-foreground/10 pb-6 sm:pb-10 lg:pb-12"
          aria-labelledby="event-hero-heading"
        >
          <div className="grid gap-5 sm:gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-10">
            <div className="order-2 min-w-0 space-y-3 sm:space-y-4 lg:order-1 lg:space-y-0">
              <h1
                id="event-hero-heading"
                className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                《我兩樣都要》
              </h1>
              <p className="text-pretty text-[15px] font-medium leading-snug text-foreground/90 sm:text-lg sm:leading-snug lg:text-xl">
                事業升級 x 財富增值：一場專為實戰者而設的戰略會議
              </p>
              <ul className="space-y-2 text-[13px] leading-snug text-foreground/80 sm:space-y-2.5 sm:text-sm sm:leading-relaxed lg:text-base lg:leading-relaxed">
                <li className="flex gap-2.5 sm:gap-3">
                  <span className="mt-0.5 shrink-0 text-[0.95em]" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    策略深度： 與創辦人探討「攻守兼備」的商業模式。
                  </span>
                </li>
                <li className="flex gap-2.5 sm:gap-3">
                  <span className="mt-0.5 shrink-0 text-[0.95em]" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    星級嘉賓： 投資作家 Marcy Chan 親自分享新世代的被動收入心法。
                  </span>
                </li>
                <li className="flex gap-2.5 sm:gap-3">
                  <span className="mt-0.5 shrink-0 text-[0.95em]" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    價值升級： 現場免費專業商業照拍攝 + 精緻餐飲社交環節。
                  </span>
                </li>
              </ul>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-stretch sm:gap-3 sm:pt-2 lg:pt-3">
                <a
                  href={LUMA_REGISTRATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaPrimary}
                >
                  立即留位 (HKD 300)
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <a href={GAME_PAGE_URL} className={ctaSecondary}>
                  挑戰遊戲，贏取免費門票
                </a>
              </div>
            </div>
            <div className="order-1 min-w-0 lg:order-2">
              <div className="overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03] shadow-sm sm:rounded-2xl">
                {/* Square promo art — stacked / mobile & tablet (below lg) */}
                <div className="relative aspect-square w-full max-w-md mx-auto lg:hidden">
                  <Image
                    src="/event/key-visual-mobile.png"
                    alt="《我兩樣都要》活動主視覺"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1023px) 100vw, 1px"
                  />
                </div>
                {/* Original wide/tall art — desktop two-column layout */}
                <div className="relative hidden aspect-[4/5] w-full lg:block">
                  <Image
                    src="/event/key-visual.png"
                    alt="《我兩樣都要》活動主視覺"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 40vw, 1px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Value */}
        <section
          className="border-b border-foreground/10 py-6 sm:py-10 lg:py-12"
          aria-labelledby="event-value-heading"
        >
          <h2
            id="event-value-heading"
            className="text-center text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl"
          >
            你將獲得什麼？
          </h2>
          <div className="mt-4 grid auto-rows-fr gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-5 lg:mt-8 lg:gap-6">
            {/* A: Guest speaker */}
            <Card className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
              <div className="flex flex-row items-start justify-center gap-3 sm:justify-start sm:gap-4">
                <div className="relative aspect-[3/4] w-[calc(50%-0.375rem)] max-w-[140px] shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:max-w-[150px] sm:rounded-xl">
                  <Image
                    src="/marcy-chan-headshot.png"
                    alt="Marcy Chan"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 42vw, 150px"
                  />
                </div>
                <div className="relative aspect-[3/4] w-[calc(50%-0.375rem)] max-w-[112px] shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] shadow-sm sm:max-w-[120px] sm:rounded-xl">
                  <Image
                    src="/marcy-book-yilun-jishi.png"
                    alt="《以「輪」擊石》書籍封面"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 35vw, 120px"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground sm:text-base lg:text-lg">
                  星級嘉賓: Marcy Chan
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  暢銷投資書《以「輪」擊石》作者，將親臨現場，獨家拆解「新世代被動收入」的實戰心法。
                </p>
              </div>
            </Card>

            {/* B: Founder consultation */}
            <Card className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
              <div className="relative aspect-[4/3] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:rounded-xl">
                <Image
                  src="/event/strategy-collaboration.png"
                  alt="俯視角度：兩人於咖啡桌協作討論，平板顯示商業圖表與筆記本"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground sm:text-base lg:text-lg">
                  一對一策略諮詢
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  你將有機會與 Profit Pulse Ally
                  創辦人進行一對一對話，直擊你的事業或投資痛點。
                </p>
              </div>
            </Card>

            {/* C: Headshot */}
            <Card className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
              <div className="relative aspect-[4/3] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:rounded-xl">
                <Image
                  src="/event/professional-headshot-bts.png"
                  alt="專業商業形象照拍攝現場，攝影燈與受拍者"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground sm:text-base lg:text-lg">
                  免費專業形象照
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  由專業攝影師操刀，即場獲取你的 Business Headshot
                  (價值$600)，即時提升專業形象。
                </p>
              </div>
            </Card>

            {/* D: Venue */}
            <Card className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
              <div className="relative aspect-[4/3] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:rounded-xl">
                <Image
                  src="/event/venue-talentong-library.png"
                  alt="塔冷通心靈書舍：書架環繞的閱讀與交流空間"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground sm:text-base lg:text-lg">
                  活動場地
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  在充滿特色的「塔冷通心靈書舍」進行，享受高品質的社交環境。
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 3: Scarcity */}
        <section
          className="border-b border-foreground/10 py-5 sm:py-8 lg:py-10"
          aria-labelledby="event-scarcity-heading"
        >
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-background to-background px-4 py-5 text-center shadow-sm sm:rounded-2xl sm:px-8 sm:py-8">
            <h2
              id="event-scarcity-heading"
              className="text-lg font-bold tracking-tight text-foreground sm:text-2xl"
            >
              <span aria-hidden="true">🔥</span> 限定名額20人！
            </h2>
            <p className="mx-auto mt-2.5 max-w-lg text-[13px] font-medium italic leading-snug text-foreground/85 sm:mt-4 sm:text-base sm:leading-snug">
              「軍師嘅對話，只留俾有準備嘅人」
            </p>
          </div>
        </section>

        {/* Section 4: Logistics */}
        <section
          className="border-b border-foreground/10 py-6 sm:py-10 lg:py-12"
          aria-labelledby="event-logistics-heading"
        >
          <h2
            id="event-logistics-heading"
            className="text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl"
          >
            活動資料
          </h2>
          <Card className="mt-3 sm:mt-5">
            <dl className="grid gap-0 sm:grid-cols-3 sm:gap-4">
              <div className="flex gap-3 border-b border-foreground/10 py-3.5 sm:border-b-0 sm:border-r sm:border-foreground/10 sm:py-0 sm:pr-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 sm:h-9 sm:w-9">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    日期時間
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-medium leading-snug text-foreground/90 sm:text-sm">
                    4月27日（一）
                    <br className="sm:hidden" />
                    <span className="sm:ml-1">19:30–21:30</span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 border-b border-foreground/10 py-3.5 sm:border-b-0 sm:border-r sm:border-foreground/10 sm:py-0 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 sm:h-9 sm:w-9">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    地點
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-medium leading-snug text-foreground/90 sm:text-sm">
                    塔冷通心靈書舍
                    <br />
                    <span className="font-normal text-foreground/75">
                      九龍油麻地窩打老道20號金輝大廈一樓6室
                    </span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 py-3.5 sm:py-0 sm:pl-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 sm:h-9 sm:w-9">
                  <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    費用
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                    HKD 300
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 w-full min-w-0 overflow-hidden rounded-lg border border-foreground/10 sm:mt-6 sm:rounded-xl">
              <iframe
                title="活動地點地圖：九龍油麻地窩打老道20號附近"
                src={VENUE_MAP_EMBED_SRC}
                className="block h-[220px] w-full min-w-full max-w-full border-0 sm:h-[min(280px,45vh)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-foreground/50 sm:mt-2.5 sm:text-xs">
              地圖位置為窩打老道20號一帶；到場前請再以活動通知或現場指示為準。
            </p>
          </Card>
        </section>

        {/* Section 5: Final CTA — full-width stack on mobile */}
        <section className="py-6 sm:py-10 lg:py-12" aria-labelledby="event-cta-heading">
          <h2 id="event-cta-heading" className="sr-only">
            報名與免費挑戰
          </h2>
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4">
            <a
              href={LUMA_REGISTRATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ctaPrimary} sm:max-w-none sm:flex-1`}
            >
              立即留位 (HKD 300)
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
            <a href={GAME_PAGE_URL} className={`${ctaSecondary} sm:max-w-none sm:flex-1`}>
              挑戰遊戲，贏取免費門票
            </a>
          </div>
        </section>
      </main>

      {/* Mobile: sticky dual CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="pointer-events-auto border-t border-foreground/10 bg-background/95 px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.07)] backdrop-blur-md dark:shadow-[0_-6px_24px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <a
              href={LUMA_REGISTRATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ctaPrimary} min-h-11`}
            >
              立即留位 (HKD 300)
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
            <a href={GAME_PAGE_URL} className={`${ctaSecondary} min-h-11 text-[13px]`}>
              挑戰遊戲，贏取免費門票
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
