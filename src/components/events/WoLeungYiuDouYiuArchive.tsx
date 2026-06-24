import { Calendar, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

/** Google Maps embed (no API key): search query for the venue area */
const VENUE_MAP_EMBED_SRC =
  "https://maps.google.com/maps?q=20+Waterloo+Road+Yau+Ma+Tei+Kowloon+Hong+Kong&hl=zh-TW&z=17&ie=UTF8&iwloc=&output=embed";

const CLOSED_CTA_TEXT = "Registration Closed / 報名已結束";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaPrimary =
  `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:min-h-12 sm:px-6 sm:py-3.5 ${focusRing}`;

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-foreground/10 bg-background p-3 shadow-sm sm:rounded-2xl sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function PastEventBanner() {
  return (
    <div
      className="border-b border-red-300/40 bg-red-100 px-3 py-2.5 text-center text-xs font-medium text-red-900 sm:px-4 sm:py-3 sm:text-sm dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-200"
      role="status"
    >
      <strong>This is a past event.</strong> Registration is now closed.
    </div>
  );
}

export default function WoLeungYiuDouYiuArchive() {
  return (
    <>
      <PastEventBanner />
      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-10">
        <section
          className="border-b border-foreground/10 pb-5 sm:pb-10 lg:pb-12"
          aria-labelledby="event-hero-heading"
        >
          <div className="grid gap-4 sm:gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-10">
            <div className="order-2 min-w-0 lg:order-1">
              <h1
                id="event-hero-heading"
                className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                《我兩樣都要》
              </h1>
              <p className="mt-2 text-pretty text-sm font-medium leading-snug text-foreground/90 sm:text-lg sm:leading-snug lg:text-xl">
                事業升級 x 財富增值：一場專為實戰者而設的戰略會議
              </p>

              <div className="mt-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 sm:mt-4 sm:p-4">
                <dl className="space-y-2 text-xs sm:space-y-2.5 sm:text-sm">
                  <div className="flex gap-2">
                    <Calendar
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/55 sm:h-4 sm:w-4"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">Date and time</dt>
                    <dd className="font-medium text-foreground/90">
                      4月27日（一）19:30–21:30
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/55 sm:h-4 sm:w-4"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">Location</dt>
                    <dd className="font-medium leading-snug text-foreground/90">
                      塔冷通心靈書舍
                      <span className="block font-normal text-foreground/70">
                        九龍油麻地窩打老道20號金輝大廈一樓6室
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs leading-snug text-foreground/80 sm:mt-4 sm:space-y-2 sm:text-sm sm:leading-relaxed">
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ✅
                  </span>
                  <span>策略深度： 與創辦人探討「攻守兼備」的商業模式。</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    星級嘉賓： 齊柏林熱狗創辦人 Vicky & 投資作家 Marcy Chan 親自分享
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    價值升級： 現場免費專業商業照拍攝 + 精緻餐飲社交環節。
                  </span>
                </li>
              </ul>

              <div className="mt-3 sm:mt-4">
                <span
                  className={`${ctaPrimary} cursor-not-allowed opacity-60 sm:max-w-md`}
                  aria-disabled="true"
                >
                  {CLOSED_CTA_TEXT}
                </span>
              </div>
            </div>

            <div className="order-1 min-w-0 lg:order-2">
              <div className="overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03] shadow-sm sm:rounded-2xl">
                <div className="relative mx-auto aspect-square max-h-[14rem] w-full max-w-sm sm:max-h-[18rem] lg:hidden">
                  <Image
                    src="/event/key-visual-mobile.png"
                    alt="《我兩樣都要》活動主視覺"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1023px) 100vw, 1px"
                  />
                </div>
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

        <section
          className="border-b border-foreground/10 py-5 sm:py-10 lg:py-12"
          aria-labelledby="event-value-heading"
        >
          <h2
            id="event-value-heading"
            className="text-center text-sm font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl"
          >
            你將獲得什麼？
          </h2>
          <div className="mt-3 grid auto-rows-fr gap-2.5 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:mt-8 lg:gap-6">
            <Card className="flex h-full min-h-0 flex-col gap-2.5 sm:flex-row sm:gap-4">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[7rem] shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:mx-0 sm:max-w-[150px] sm:rounded-xl">
                <Image
                  src="/vicky-headshot.png"
                  alt="Vicky"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 28vw, 150px"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  重量級嘉賓: Vicky Huang (齊柏林熱狗聯合創辦人)
                </h3>
                <p className="mt-1 text-xs leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  想知道一個本土品牌如何擴張成連鎖王國？Vicky
                  將首次公開分享「齊柏林熱狗」的創業融資心法與擴張策略，全是書本上學不到的實戰智慧。
                </p>
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col gap-2.5 sm:flex-row sm:gap-4">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[7rem] shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:mx-0 sm:max-w-[150px] sm:rounded-xl">
                <Image
                  src="/marcy-chan-headshot.png"
                  alt="Marcy Chan"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 28vw, 150px"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  星級嘉賓: Marcy Chan
                </h3>
                <p className="mt-1 text-xs leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  暢銷投資書《以「輪」擊石》作者，將親臨現場，為你獨家拆解經過驗證的「新世代被動收入」實戰心法，教你如何在主業之外，建立屬於你的第二座收入堡壘。
                </p>
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col gap-2.5">
              <div className="relative aspect-[16/10] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:aspect-[4/3] sm:rounded-xl">
                <Image
                  src="/event/strategy-collaboration.png"
                  alt="俯視角度：兩人於咖啡桌協作討論，平板顯示商業圖表與筆記本"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  一對一策略諮詢
                </h3>
                <p className="mt-1 text-xs leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  於社交環節中，你將有機會與創辦人及團隊成員交流，探討你的事業或投資方向。想獲得更深度的15分鐘優先一對一諮詢？立即挑戰《城堡攻防戰》！
                </p>
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col gap-2.5">
              <div className="relative aspect-[16/10] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:aspect-[4/3] sm:rounded-xl">
                <Image
                  src="/event/professional-headshot-bts.png"
                  alt="專業商業形象照拍攝現場，攝影燈與受拍者"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  免費專業形象照
                </h3>
                <p className="mt-1 text-xs leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  由專業攝影師操刀，即場獲取你的 Business Headshot
                  (價值$600)，即時提升專業形象。
                </p>
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col gap-2.5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  活動流程 (Agenda)
                </h3>
                <dl className="mt-2 space-y-2 text-xs leading-snug text-foreground/80 sm:text-sm sm:leading-relaxed">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="shrink-0 font-semibold text-foreground/90">
                      19:15 - 20:00
                    </dt>
                    <dd>專業形象照拍攝 & 交流環節 (Professional Headshot & Networking)</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="shrink-0 font-semibold text-foreground/90">
                      20:00 - 20:45
                    </dt>
                    <dd className="min-w-0">
                      雙嘉賓主題演講 (Keynote Speeches)
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        <li>
                          <span className="font-semibold text-foreground/90">
                            Vicky Huang (齊柏林熱狗創辦人):
                          </span>{" "}
                          《創業融資心法》
                        </li>
                        <li>
                          <span className="font-semibold text-foreground/90">
                            Marcy Chan (暢銷作家):
                          </span>{" "}
                          《新世代的被動收入策略》
                        </li>
                      </ul>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="shrink-0 font-semibold text-foreground/90">
                      20:45 - 21:15
                    </dt>
                    <dd>爐邊對談 & Q&A (Fireside Chat & Q&A)</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="shrink-0 font-semibold text-foreground/90">
                      21:15 onwards
                    </dt>
                    <dd>深度交流 (Deep Networking)</dd>
                  </div>
                </dl>
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col gap-2.5">
              <div className="relative aspect-[16/10] w-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03] sm:aspect-[4/3] sm:rounded-xl">
                <Image
                  src="/event/venue-talentong-library.png"
                  alt="塔冷通心靈書舍：書架環繞的閱讀與交流空間"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                  活動場地
                </h3>
                <p className="mt-1 text-xs leading-snug text-foreground/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  在充滿特色的「塔冷通心靈書舍」進行，享受高品質的社交環境。
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section
          className="border-b border-foreground/10 py-4 sm:py-8 lg:py-10"
          aria-labelledby="event-scarcity-heading"
        >
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-background to-background px-3 py-4 text-center shadow-sm sm:rounded-2xl sm:px-8 sm:py-8">
            <h2
              id="event-scarcity-heading"
              className="text-base font-bold tracking-tight text-foreground sm:text-2xl"
            >
              <span aria-hidden="true">🔥</span> 限定名額20人！
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs font-medium italic leading-snug text-foreground/85 sm:mt-4 sm:text-base sm:leading-snug">
              「軍師嘅對話，只留俾有準備嘅人」
            </p>
          </div>
        </section>

        <section
          className="border-b border-foreground/10 py-5 sm:py-10 lg:py-12"
          aria-labelledby="event-logistics-heading"
        >
          <h2
            id="event-logistics-heading"
            className="text-sm font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl"
          >
            活動資料
          </h2>
          <Card className="mt-3 sm:mt-5">
            <dl className="grid gap-0 sm:grid-cols-3 sm:gap-4">
              <div className="flex gap-2.5 border-b border-foreground/10 py-3 sm:border-b-0 sm:border-r sm:border-foreground/10 sm:py-0 sm:pr-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-foreground/45 sm:text-[11px]">
                    日期時間
                  </dt>
                  <dd className="mt-0.5 text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
                    4月27日（一）
                    <br className="sm:hidden" />
                    <span className="sm:ml-1">19:30–21:30</span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-2.5 border-b border-foreground/10 py-3 sm:border-b-0 sm:border-r sm:border-foreground/10 sm:py-0 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-foreground/45 sm:text-[11px]">
                    地點
                  </dt>
                  <dd className="mt-0.5 text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
                    塔冷通心靈書舍
                    <br />
                    <span className="font-normal text-foreground/75">
                      九龍油麻地窩打老道20號金輝大廈一樓6室
                    </span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-2.5 py-3 sm:py-0 sm:pl-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                  <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-foreground/45 sm:text-[11px]">
                    費用
                  </dt>
                  <dd className="mt-0.5 text-xs font-semibold leading-snug text-foreground sm:text-sm">
                    免費 (限定名額20人)
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-3 w-full min-w-0 overflow-hidden rounded-lg border border-foreground/10 sm:mt-6 sm:rounded-xl">
              <iframe
                title="活動地點地圖：九龍油麻地窩打老道20號附近"
                src={VENUE_MAP_EMBED_SRC}
                className="block h-[200px] w-full min-w-full max-w-full border-0 sm:h-[min(280px,45vh)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-foreground/50 sm:text-xs">
              地圖位置為窩打老道20號一帶；到場前請再以活動通知或現場指示為準。
            </p>
          </Card>
        </section>

        <section className="py-5 sm:py-10 lg:py-12" aria-labelledby="event-cta-heading">
          <h2 id="event-cta-heading" className="sr-only">
            報名
          </h2>
          <div className="mx-auto flex w-full max-w-2xl justify-center">
            <span
              className={`${ctaPrimary} w-full cursor-not-allowed opacity-60 sm:max-w-md`}
              aria-disabled="true"
            >
              {CLOSED_CTA_TEXT}
            </span>
          </div>
        </section>
      </main>
    </>
  );
}
