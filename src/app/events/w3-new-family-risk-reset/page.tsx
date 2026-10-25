import type { Metadata } from "next";
import Image from "next/image";

import W3FamilyRegistration from "@/components/events/W3FamilyRegistration";
import { getServerSiteLocale } from "@/lib/i18n/server";

const SLUG = "w3-new-family-risk-reset";

const copy = {
  en: {
    kicker: "PPA Webinar Series 2026 · Week 3",
    title: "New Family. Old Policies. Hidden Gaps.",
    titleZh: "新家庭。舊保單。隱藏缺口。",
    sub: "A Profit Pulse Ally Defense Workshop for newlyweds, expecting parents, and new parents who want to avoid duplicated cover, missing protection, and family-risk mismatch.",
    cta: "Reserve Seat + Get New Family Risk Reset Checklist",
    downloadLabel: "Download the New Family Risk Reset Checklist (PDF)",
    facts: [
      ["Date", "Saturday, 21 November 2026"],
      ["Cantonese", "10:30 – 11:35 HKT"],
      ["English", "12:00 – 13:00 HKT"],
      ["Format", "Online live workshop"],
    ],
    problem: {
      label: "The problem",
      title: "You may already have insurance",
      intro: "But after marriage or a baby, the real questions change:",
      items: [
        "Is your spouse protected or just listed?",
        "Is your baby covered or assumed?",
        "Does employer medical disappear if you change jobs?",
        "Are you paying twice for the same benefit?",
        "Is the biggest family risk still uncovered?",
        "Will claim money reach the right person?",
      ],
    },
    why: {
      label: "Why now",
      title: "The ground has moved",
      items: [
        "Hong Kong is increasing family and newborn support.",
        "Medical cost pressure is rising.",
        "Employer benefits may not be permanent.",
        "VHIS and child coverage options require planning.",
        "Marriage and birth change beneficiaries, cash flow, and dependency.",
      ],
    },
    experience: {
      label: "What attendees will experience",
      title: "A live reset, not a sales talk",
      items: [
        "Live New Family Coverage X-Ray",
        "Household risk simulation",
        "Duplicate vs missing protection analysis",
        "Employer dependency check",
        "Beneficiary route check",
        "New Family Risk Reset Checklist",
        "No product pitch",
      ],
    },
    who: {
      label: "Who should attend",
      title: "Best for",
      items: [
        "Newly married couples",
        "Engaged couples",
        "Expecting parents",
        "Parents with newborns or toddlers",
        "Dual-income families",
        "Founders with young families",
        "Parents relying on employer medical",
        "Couples with mortgage, helper, childcare, or one-parent income risk",
        "Advisers, HR partners, family offices, and community partners serving young families",
      ],
    },
    panelsLabel: "From the session",
    panels: [
      { src: "/event/w3-old-policy-folder.jpg", alt: "Your old policy folder may protect your old life", caption: "Your old policy folder may protect your old life." },
      { src: "/event/w3-reset-better.jpg", alt: "Don’t buy more. Reset better.", caption: "Don’t buy more. Reset better." },
      { src: "/event/w3-risk-architecture.jpg", alt: "Marriage and parenthood change your risk architecture", caption: "Marriage and parenthood change your risk architecture." },
    ],
    registerEyebrow: "Reserve your seat",
    registerTitle: "Reserve your seat",
    registerNote: "Every registrant receives the New Family Risk Reset Checklist — and the option to answer six short questions so the session speaks to your household.",
    disclaimer:
      "This workshop is for general education only. It does not provide insurance, investment, legal, tax, or medical advice. No product recommendation will be made during the live session. Please consult a licensed insurance intermediary, financial adviser, solicitor, tax adviser, or medical professional for your personal circumstances.",
  },
  "zh-Hant": {
    kicker: "PPA 2026 網上研討會系列 · 第三週",
    title: "新家庭。舊保單。隱藏缺口。",
    titleZh: "New Family. Old Policies. Hidden Gaps.",
    sub: "專為新婚夫婦、準父母及新手父母而設的 Profit Pulse Ally 防守工作坊：避免重複投保、保障缺失與家庭風險錯配。",
    cta: "預留座位 + 索取《新家庭保障重整清單》",
    downloadLabel: "下載《新家庭保障重整清單》（PDF）",
    facts: [
      ["日期", "2026 年 11 月 21 日（星期六）"],
      ["廣東話場", "10:30 – 11:35 HKT"],
      ["英語場", "12:00 – 13:00 HKT"],
      ["形式", "網上直播工作坊"],
    ],
    problem: {
      label: "問題所在",
      title: "你可能已經有保險",
      intro: "但結婚或生孩子之後，真正的問題已經改變：",
      items: [
        "你的配偶是有保障，還是只是被列為受益人？",
        "你的寶寶是有保障，還是只是假設有？",
        "轉工後僱主醫療保障會否消失？",
        "你是否為同一項保障付費兩次？",
        "最大的家庭風險是否仍然未受保障？",
        "賠償金會否到達正確的人手中？",
      ],
    },
    why: {
      label: "為何是現在",
      title: "基礎已經改變",
      items: [
        "香港正加強家庭及新生兒支援。",
        "醫療費用壓力持續上升。",
        "僱主福利未必是永久的。",
        "VHIS 及兒童保障選項需要規劃。",
        "結婚與生育改變受益人、現金流與依賴關係。",
      ],
    },
    experience: {
      label: "你將會體驗",
      title: "一場真正的重整，不是推銷會",
      items: [
        "現場新家庭保障 X 光檢查",
        "家庭風險模擬",
        "重複與缺失保障分析",
        "僱主依賴檢查",
        "受益人去向檢查",
        "《新家庭保障重整清單》",
        "不推銷產品",
      ],
    },
    who: {
      label: "適合參加",
      title: "最適合",
      items: [
        "新婚夫婦",
        "準婚夫婦",
        "準父母",
        "有初生嬰兒或幼兒的父母",
        "雙收入家庭",
        "有年幼家庭的創辦人",
        "依賴僱主醫療保障的父母",
        "有按揭、家傭、託兒或單一收入風險的夫婦",
        "服務年輕家庭的顧問、人力資源夥伴、家族辦公室及社區夥伴",
      ],
    },
    panelsLabel: "當日內容",
    panels: [
      { src: "/event/w3-old-policy-folder.jpg", alt: "你的舊保單文件夾，可能只保障你的舊生活", caption: "你的舊保單文件夾，可能只保障你的舊生活。" },
      { src: "/event/w3-reset-better.jpg", alt: "不是買更多，而是重整得更好", caption: "不是買更多，而是重整得更好。" },
      { src: "/event/w3-risk-architecture.jpg", alt: "結婚與為人父母，改變你的風險架構", caption: "結婚與為人父母，改變你的風險架構。" },
    ],
    registerEyebrow: "預留座位",
    registerTitle: "預留座位",
    registerNote: "所有報名者均可獲得《新家庭保障重整清單》，並可回答六條簡短問題，讓當日內容更貼合你的家庭。",
    disclaimer:
      "本工作坊僅供一般教育用途，不構成保險、投資、法律、稅務或醫療建議。現場不會作出任何產品推薦。個人情況請諮詢持牌保險中介人、財務顧問、律師、稅務顧問或醫療專業人員。",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return { title: `${t.title} — ${t.kicker}`, description: t.sub };
}

export default async function W3NewFamilyPage() {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  const blocks = [t.problem, t.why, t.experience, t.who];

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">{t.kicker}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3rem]">{t.title}</h1>
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
            <Image src="/event/w3-new-family-risk-reset.jpg" alt={`${t.title} ${t.titleZh}`} width={1200} height={1697} priority className="h-auto w-full" />
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
            <div className="grid gap-4 sm:grid-cols-3">
              {t.panels.map((p) => (
                <figure key={p.src} className="flex h-full flex-col overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                  <div className="relative aspect-[4/5] w-full bg-black/40">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 640px) 30vw, 100vw" className="object-contain" />
                  </div>
                  <figcaption className="mt-auto min-h-[3.25rem] border-t border-foreground/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground/60">{p.caption}</figcaption>
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
            <W3FamilyRegistration
              slug={SLUG}
              locale={locale}
              downloadHref={
                locale === "zh-Hant"
                  ? "/event/checklists/new-family-risk-reset-checklist-zh.pdf"
                  : "/event/checklists/new-family-risk-reset-checklist-en.pdf"
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
