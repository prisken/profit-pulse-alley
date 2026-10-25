import type { Metadata } from "next";
import Image from "next/image";

import W4RetirementRegistration from "@/components/events/W4RetirementRegistration";
import { getServerSiteLocale } from "@/lib/i18n/server";

const SLUG = "w4-tax-smart-retirement";

const copy = {
  en: {
    kicker: "PPA Webinar Series 2026 · Week 4",
    title: "Your Tax Plan Saved Money. Did It Save Your Retirement?",
    titleZh: "慳稅，唔等於退休穩陣。",
    sub: "A Profit Pulse Ally Defense Workshop on VHIS, QDAP/TVC, retirement income, medical costs, and inflation stress testing.",
    cta: "Reserve Seat + Get Stress-Test Sheet",
    downloadLabel: "Download the Retirement Stress-Test Sheet (PDF)",
    facts: [
      ["Date", "Saturday, 28 November 2026"],
      ["Cantonese", "10:30 – 11:35 HKT"],
      ["English", "12:00 – 13:00 HKT"],
      ["Format", "Online live workshop"],
    ],
    problem: {
      label: "The problem",
      title: "You may be using tax-deductible tools",
      intro: "But have you tested:",
      items: [
        "Whether tax saving improves retirement income?",
        "Whether TVC liquidity timing fits your retirement age?",
        "Whether QDAP income starts when you need it?",
        "Whether VHIS premiums remain affordable at 70, 75, and 80?",
        "Whether medical bills force you to sell investments during a bad year?",
        "Whether inflation quietly breaks your “comfortable” monthly budget?",
      ],
    },
    why: {
      label: "Why now",
      title: "The retirement maths has moved",
      items: [
        "Hong Kong is preparing for a much older population by 2046.",
        "Public healthcare fees and charges reform took effect in 2026.",
        "Private medical insurance expenditure has risen sharply in recent years.",
        "Tax allowances and one-off relief changed in 2026/27.",
        "Moderate inflation still compounds over a 25–35 year retirement.",
      ],
    },
    experience: {
      label: "What attendees will experience",
      title: "A live stress test, not a product briefing",
      items: [
        "Live Retirement Pulse Simulator",
        "VHIS premium burden test",
        "QDAP/TVC tax-vs-liquidity comparison",
        "Inflation stress test",
        "Medical shock simulation",
        "Early retirement bridge-gap test",
        "Checklist download",
        "Soft invitation to a one-on-one Retirement Pulse X-Ray Chat",
      ],
    },
    who: {
      label: "Who should attend",
      title: "Best for",
      items: [
        "Professionals aged 35–60",
        "Founders and business owners",
        "Couples planning retirement income",
        "People using or considering TVC / QDAP",
        "People with VHIS or private medical plans",
        "People supporting parents",
        "People planning to retire before 65",
        "HR / employer-benefit partners",
        "Accountants, tax advisers, and community partners",
      ],
    },
    panelsLabel: "From the session",
    panels: [
      { src: "/event/w4-art-1.jpg", h: 1200, alt: "5 retirement mistakes hidden inside tax planning", caption: "5 retirement mistakes hidden inside tax planning." },
      { src: "/event/w4-art-2.jpg", h: 2133, alt: "Tax saved today, cash gap tomorrow", caption: "Tax saved today. Cash gap tomorrow?" },
      { src: "/event/w4-art-3.jpg", h: 1200, alt: "A retirement plan needs a stress test", caption: "Your retirement plan needs a stress test, not just a tax deduction." },
      { src: "/event/w4-art-4.jpg", h: 1500, alt: "The tax-smart retirement map", caption: "The tax-smart retirement map." },
      { src: "/event/w4-art-5.jpg", h: 1500, alt: "A tax deduction is not an income floor", caption: "A tax deduction is not an income floor." },
    ],
    registerEyebrow: "Reserve your seat",
    registerTitle: "Reserve your seat",
    registerNote: "Every registrant receives the Retirement Stress-Test Sheet — and can answer eight short questions so the session speaks to your own timeline.",
    disclaimer:
      "This workshop is for general education only. It does not provide insurance, investment, tax, legal, accounting, medical, or retirement advice. No product recommendation will be made during the public session. Attendees should consult qualified professionals for their personal circumstances.",
  },
  "zh-Hant": {
    kicker: "PPA 2026 網上研討會系列 · 第四週",
    title: "你的稅務計劃省了錢。但是否保住了你的退休？",
    titleZh: "Your Tax Plan Saved Money. Did It Save Your Retirement?",
    sub: "一場 Profit Pulse Ally 防守工作坊：VHIS、QDAP/TVC、退休收入、醫療費用與通脹壓力測試。",
    cta: "預留座位 + 索取壓力測試表",
    downloadLabel: "下載《退休壓力測試表》（PDF）",
    facts: [
      ["日期", "2026 年 11 月 28 日（星期六）"],
      ["廣東話場", "10:30 – 11:35 HKT"],
      ["英語場", "12:00 – 13:00 HKT"],
      ["形式", "網上直播工作坊"],
    ],
    problem: {
      label: "問題所在",
      title: "你可能正在使用可扣稅工具",
      intro: "但你是否測試過：",
      items: [
        "節稅是否真的改善退休收入？",
        "TVC 的流動性時間是否配合你的退休年齡？",
        "QDAP 收入是否在你需要時開始？",
        "VHIS 保費在 70、75、80 歲時是否仍可負擔？",
        "醫療開支是否會迫使你在市場低迷時賣出投資？",
        "通脹是否正悄悄侵蝕你「舒適」的每月預算？",
      ],
    },
    why: {
      label: "為何是現在",
      title: "退休的算式已經改變",
      items: [
        "香港正為 2046 年的高齡人口作準備。",
        "公營醫療收費改革已於 2026 年生效。",
        "私人醫療保險支出近年大幅上升。",
        "2026/27 年度稅務寬免及一次性紓困措施有所改變。",
        "溫和通脹在 25–35 年退休期內仍會複利累積。",
      ],
    },
    experience: {
      label: "你將會體驗",
      title: "一場現場壓力測試，不是產品簡介",
      items: [
        "現場退休脈搏模擬器",
        "VHIS 保費負擔測試",
        "QDAP/TVC 稅務與流動性比較",
        "通脹壓力測試",
        "醫療衝擊模擬",
        "提早退休過渡缺口測試",
        "檢查清單下載",
        "一對一「退休脈搏 X 光對話」的軟性邀請",
      ],
    },
    who: {
      label: "適合參加",
      title: "最適合",
      items: [
        "35–60 歲專業人士",
        "創辦人及企業東主",
        "規劃退休收入的夫婦",
        "正在使用或考慮 TVC／QDAP 的人",
        "擁有 VHIS 或私人醫療計劃的人",
        "支援父母的人",
        "計劃 65 歲前退休的人",
        "人力資源／僱員福利夥伴",
        "會計師、稅務顧問及社區夥伴",
      ],
    },
    panelsLabel: "當日內容",
    panels: [
      { src: "/event/w4-art-1.jpg", h: 1200, alt: "稅務規劃中隱藏的五個退休錯誤", caption: "稅務規劃中隱藏的五個退休錯誤。" },
      { src: "/event/w4-art-2.jpg", h: 2133, alt: "今日省稅，明日現金缺口", caption: "今日省稅，明日現金缺口？" },
      { src: "/event/w4-art-3.jpg", h: 1200, alt: "退休計劃需要壓力測試", caption: "退休計劃需要壓力測試，而不只是扣稅。" },
      { src: "/event/w4-art-4.jpg", h: 1500, alt: "稅務精明退休地圖", caption: "稅務精明退休地圖。" },
      { src: "/event/w4-art-5.jpg", h: 1500, alt: "扣稅額不是收入下限", caption: "扣稅額不是收入下限。" },
    ],
    registerEyebrow: "預留座位",
    registerTitle: "預留座位",
    registerNote: "所有報名者均可獲得《退休壓力測試表》，並可回答八條簡短問題，讓內容更貼合你的時間表。",
    disclaimer:
      "本工作坊僅供一般教育用途，不構成保險、投資、稅務、法律、會計、醫療或退休建議。公開場次不會作出任何產品推薦。參加者應就個人情況諮詢合資格專業人士。",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return { title: `${t.title} — ${t.kicker}`, description: t.sub };
}

export default async function W4RetirementPage() {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  const blocks = [t.problem, t.why, t.experience, t.who];

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">{t.kicker}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.9rem]">{t.title}</h1>
          <p className="mt-2 text-base text-foreground/60 sm:text-lg">{t.titleZh}</p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/75 sm:text-base">{t.sub}</p>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-foreground/10 pt-6 sm:grid-cols-4">
            {t.facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{k}</dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <a href="#register" className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep">
              {t.cta}
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gold/10 blur-2xl" aria-hidden />
          <div className="overflow-hidden rounded-2xl border border-foreground/10 shadow-2xl">
            <Image src="/event/w4-tax-smart-retirement.jpg" alt={`${t.title} ${t.titleZh}`} width={1200} height={1697} priority className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {blocks.map((b, i) => (
            <div key={b.label} className="grid gap-8 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                  {String(i + 1).padStart(2, "0")} — {b.label}
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{b.title}</h2>
              </div>
              <div>
                {"intro" in b ? <p className="mb-4 text-sm leading-relaxed text-foreground/75">{b.intro}</p> : null}
                <ul className={`grid gap-3 ${b.items.length > 6 ? "sm:grid-cols-2 sm:gap-x-10" : ""}`}>
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/75">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-brand-gold" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="grid gap-8 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">05 — {t.panelsLabel}</p>
            </div>
            <div className="columns-1 gap-5 sm:columns-2">
              {t.panels.map((p) => (
                <figure key={p.src} className="mb-5 break-inside-avoid overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={1200}
                    height={p.h}
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="h-auto w-full"
                  />
                  <figcaption className="border-t border-foreground/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground/60">{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="register" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">{t.registerEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.cta}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t.registerNote}</p>
          <div className="mt-8">
            <W4RetirementRegistration
              slug={SLUG}
              locale={locale}
              downloadHref={
                locale === "zh-Hant"
                  ? "/event/checklists/tax-smart-retirement-checklist-zh.pdf"
                  : "/event/checklists/tax-smart-retirement-checklist-en.pdf"
              }
              downloadLabel={t.downloadLabel}
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="max-w-3xl text-xs leading-relaxed text-foreground/45">{t.disclaimer}</p>
        </div>
      </footer>
    </main>
  );
}
