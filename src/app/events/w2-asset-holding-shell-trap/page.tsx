import type { Metadata } from "next";
import Image from "next/image";

import WebinarRegistrationSection from "@/components/events/WebinarRegistrationSection";
import { getServerSiteLocale } from "@/lib/i18n/server";

const SLUG = "w2-asset-holding-shell-trap";

const copy = {
  en: {
    kicker: "PPA Webinar Series 2026 · Week 2",
    title: "The Asset-Holding Shell Trap",
    titleZh: "公司名義持有豪宅名車：富裕家庭的隱形責任缺口",
    hook:
      "A company can hold your mansion. A company can own your car. But can it protect your family when something goes wrong?",
    cta: "Reserve Seat + Get Checklist",
    downloadLabel: "Download the Asset-Holding Shell Checklist (PDF)",
    facts: [
      ["Date", "Saturday, 14 November 2026"],
      ["Cantonese", "10:30 – 11:35 HKT"],
      ["English", "12:00 – 13:00 HKT"],
      ["Format", "Online live workshop"],
    ],
    coversTitle: "What this workshop covers",
    coversIntro:
      "In this live Profit Pulse Ally Defense Workshop, we will test a wealthy family’s asset structure and reveal hidden gaps in:",
    covers: [
      "Ownership",
      "Private use",
      "Tax documentation",
      "Insurance",
      "Bank financing",
      "Family continuity",
      "Exit control",
    ],
    demoLabel: "Live demo",
    demoTitle: "PPA Asset Route Crash Test",
    demoBody:
      "A live simulator showing how a home and car held through a company can create unexpected risk if the owner, user, payer, and risk bearer are not aligned.",
    galleryLabel: "From the session",
    gallery: [
      {
        src: "/event/w2-liability-question.jpg",
        alt: "If the asset is in the company, is the risk also in the company?",
        caption: "If the asset is in the company, is the risk also in the company?",
      },
      {
        src: "/event/w2-asset-route-poster.jpg",
        alt: "Your luxury asset may be carrying hidden liability",
        caption: "Your luxury asset may be carrying hidden liability.",
      },
    ],
    detailLabel: "Event details",
    details: [
      ["Host", "Profit Pulse Ally"],
      ["Bonus", "Asset-Holding Shell Checklist"],
      ["Fee", "Free · registration required"],
    ],
    registerEyebrow: "Reserve your seat",
    registerTitle: "Reserve your seat",
    registerNote:
      "Every registrant receives the Asset-Holding Shell Checklist — the seven-part review of ownership, funding, use, tax, insurance, liability and exit.",
    disclaimer:
      "This workshop is for general education only. It does not provide tax, legal, investment, or insurance product advice. Please consult your CPA, solicitor, and licensed adviser for company-specific recommendations.",
  },
  "zh-Hant": {
    kicker: "PPA 2026 網上研討會系列 · 第二週",
    title: "公司名義持有豪宅名車",
    titleZh: "富裕家庭的隱形責任缺口",
    hook:
      "公司可以持有你的豪宅，公司可以擁有你的名車。但當出事時，公司能否保護你的家人？",
    cta: "預留座位 + 索取檢查清單",
    downloadLabel: "下載《公司持有資產風險檢查清單》（PDF）",
    facts: [
      ["日期", "2026 年 11 月 14 日（星期六）"],
      ["廣東話場", "10:30 – 11:35 HKT"],
      ["英語場", "12:00 – 13:00 HKT"],
      ["形式", "網上直播工作坊"],
    ],
    coversTitle: "本工作坊涵蓋",
    coversIntro:
      "在這場 Profit Pulse Ally 防守工作坊中，我們會即場測試一個富裕家庭的資產架構，拆解以下七個隱形缺口：",
    covers: ["所有權", "私人使用", "稅務文件", "保險", "銀行融資", "家族延續", "退出控制"],
    demoLabel: "現場示範",
    demoTitle: "PPA 資產路線壓力測試",
    demoBody:
      "一個即場模擬器，示範當業主、使用者、付款人與風險承擔者並非同一人時，以公司持有的物業與車輛如何產生預期之外的風險。",
    galleryLabel: "當日內容",
    gallery: [
      {
        src: "/event/w2-liability-question.jpg",
        alt: "資產在公司名下，風險是否也在公司？",
        caption: "資產在公司名下，風險是否也在公司？",
      },
      {
        src: "/event/w2-asset-route-poster.jpg",
        alt: "你的奢侈品，可能正背負隱形責任",
        caption: "你的奢侈品，可能正背負隱形責任。",
      },
    ],
    detailLabel: "活動詳情",
    details: [
      ["主辦", "Profit Pulse Ally"],
      ["贈品", "《公司持有資產風險檢查清單》"],
      ["費用", "免費 · 需預先報名"],
    ],
    registerEyebrow: "預留座位",
    registerTitle: "預留座位",
    registerNote:
      "所有報名者均可獲得《公司持有資產風險檢查清單》——涵蓋所有權、資金、使用、稅務、保險、責任與退出的七部分審視。",
    disclaimer:
      "本工作坊僅供一般教育用途，不構成稅務、法律、投資或保險產品建議。公司具體情況請諮詢你的會計師、律師及持牌顧問。",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return { title: `${t.title} — ${t.kicker}`, description: t.hook };
}

export default async function W2AssetHoldingPage() {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
            {t.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3rem]">
            {t.title}
          </h1>
          <p className="mt-2 text-base text-foreground/60 sm:text-lg">{t.titleZh}</p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/75 sm:text-base">
            {t.hook}
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-foreground/10 pt-6 sm:grid-cols-4">
            {t.facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{k}</dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#register"
              className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep"
            >
              {t.cta}
            </a>
            <a
              href="#demo"
              className="text-sm text-foreground/55 underline decoration-foreground/25 underline-offset-4 transition hover:text-foreground"
            >
              {t.demoTitle}
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gold/10 blur-2xl" aria-hidden />
          <div className="overflow-hidden rounded-2xl border border-foreground/10 shadow-2xl">
            <Image
              src="/event/w2-asset-holding-shell-trap.jpg"
              alt={`${t.title} ${t.titleZh}`}
              width={1200}
              height={1697}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                01 — {t.coversTitle}
              </p>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/75">{t.coversIntro}</p>
              <ol className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                {t.covers.map((item, i) => (
                  <li key={item} className="flex items-baseline gap-3 text-sm text-foreground/80">
                    <span className="text-[11px] font-semibold tabular-nums text-brand-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div id="demo" className="grid scroll-mt-24 gap-8 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                02 — {t.demoLabel}
              </p>
              <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{t.demoTitle}</h2>
            </div>
            <div className="rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.05] p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-foreground/80">{t.demoBody}</p>
            </div>
          </div>

          <div className="grid gap-8 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                03 — {t.galleryLabel}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {t.gallery.map((g) => (
                <figure key={g.src} className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={g.src}
                      alt={g.alt}
                      fill
                      sizes="(min-width: 640px) 45vw, 100vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <figcaption className="border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-foreground/60">
                    {g.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="grid gap-8 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                04 — {t.detailLabel}
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {t.details.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{k}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-foreground/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="register" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">{t.registerEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.cta}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t.registerNote}</p>
          <div className="mt-8">
            <WebinarRegistrationSection
              slug={SLUG}
              title={t.title}
              locale={locale}
              downloadHref={
                locale === "zh-Hant"
                  ? "/event/checklists/asset-holding-shell-checklist-zh.pdf"
                  : "/event/checklists/asset-holding-shell-checklist-en.pdf"
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
