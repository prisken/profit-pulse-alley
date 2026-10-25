import type { Metadata } from "next";
import Image from "next/image";

import W1FounderRegistration from "@/components/events/W1FounderRegistration";
import { getServerSiteLocale } from "@/lib/i18n/server";

const SLUG = "w1-founder-protection-stack";

const copy = {
  en: {
    kicker: "PPA Webinar Series 2026 · Week 1",
    title: "The Founder Disappears. Where Does the Money Land?",
    subtitle:
      "A live Profit Pulse Ally Defense Workshop for Hong Kong founders who want to protect company cashflow, shareholder continuity, and family liquidity.",
    cta: "Reserve Seat + Get the Founder Continuity Checklist",
    downloadLabel: "Download the Founder Continuity Checklist (PDF)",
    ctaSecondary: "See what you’ll leave with",
    facts: [
      ["Date", "Saturday, 7 November 2026"],
      ["Format", "Live online workshop"],
      ["Cantonese", "10:30 – 11:30"],
      ["English", "12:00 – 13:00"],
    ],
    sections: [
      {
        label: "Why now",
        title: "Three things are true at once",
        items: [
          "HK SME owners are still operating in a cautious margin and credit environment.",
          "One founder can control clients, bank lines, supplier trust, IP, and family income.",
          "A keyman policy, shareholder agreement, and family protection plan solve different problems.",
        ],
      },
      {
        label: "What you will experience",
        title: "A working session, not a slideshow",
        items: [
          "Live 90-Day Founder Crash Test",
          "Keyman vs buy-sell structure split",
          "Three-bucket founder protection map",
          "Founder Continuity Checklist",
          "No product pitch — educational strategy lab only",
        ],
      },
      {
        label: "Who should attend",
        title: "Built for owner-controlled companies",
        items: [
          "2–5 shareholder companies",
          "Founder-led SMEs",
          "Professional firms",
          "Family businesses",
          "Companies with bank loans, leases, or personal guarantees",
          "Companies where one founder controls key clients or bank relationships",
        ],
      },
      {
        label: "What you will leave with",
        title: "Decisions you can act on",
        items: [
          "Clarity on where claim money should land",
          "Checklist of shareholder and policy questions",
          "Red flags to discuss with CPA / solicitor / licensed adviser",
          "Option to book a private Founder Risk Gap Chat",
        ],
      },
    ],
    registerEyebrow: "Reserve your seat",
    checklistNote:
      "Every registrant receives the Founder Continuity Checklist — the 21 questions to answer before a founder exits, dies, or becomes disabled.",
    disclaimer:
      "This workshop is for general education only. It does not provide tax, legal, investment, or insurance product advice. Please consult your CPA, solicitor, and licensed adviser for company-specific recommendations.",
  },
  "zh-Hant": {
    kicker: "PPA 2026 網上研討會系列 · 第一週",
    title: "創辦人突然離場，錢會去邊？",
    subtitle:
      "一場專為香港創辦人而設的 Profit Pulse Ally 防守工作坊：守住公司現金流、股東延續與家族流動性。",
    cta: "預留座位 + 索取《創辦人延續檢查清單》",
    downloadLabel: "下載《創辦人延續檢查清單》（PDF）",
    ctaSecondary: "看看你會帶走什麼",
    facts: [
      ["日期", "2026 年 11 月 7 日（星期六）"],
      ["形式", "網上直播工作坊"],
      ["廣東話場", "10:30 – 11:30"],
      ["英語場", "12:00 – 13:00"],
    ],
    sections: [
      {
        label: "為何是現在",
        title: "三件事同時發生",
        items: [
          "香港中小企東主仍在利潤受壓、信貸審慎的環境中經營。",
          "一位創辦人可以同時掌控客戶、銀行額度、供應商信任、知識產權與家庭收入。",
          "要員保險、股東協議與家庭保障計劃，處理的是三個不同問題。",
        ],
      },
      {
        label: "你將會體驗",
        title: "是一場工作會議，不是簡報會",
        items: [
          "現場 90 日創辦人壓力測試",
          "要員保險 vs 股東買賣架構拆解",
          "三桶創辦人保障地圖",
          "《創辦人延續檢查清單》",
          "不推銷產品——只做教育性策略實驗室",
        ],
      },
      {
        label: "適合參加",
        title: "為創辦人主導的公司而設",
        items: [
          "2–5 位股東的公司",
          "創辦人主導的中小企",
          "專業事務所",
          "家族企業",
          "有銀行貸款、租約或個人擔保的公司",
          "由一位創辦人掌控主要客戶或銀行關係的公司",
        ],
      },
      {
        label: "你會帶走",
        title: "可以立即行動的決定",
        items: [
          "清楚知道賠償金應該落在哪裡",
          "一份股東與保單問題清單",
          "可與會計師／律師／持牌顧問討論的風險警號",
          "可預約私人「創辦人風險缺口對話」",
        ],
      },
    ],
    registerEyebrow: "預留座位",
    checklistNote:
      "所有報名者均可獲得《創辦人延續檢查清單》——創辦人退股、離世或失去工作能力前必答的 21 條問題。",
    disclaimer:
      "本工作坊僅供一般教育用途，不構成稅務、法律、投資或保險產品建議。公司具體情況請諮詢你的會計師、律師及持牌顧問。",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return {
    title: `${t.title} — ${t.kicker}`,
    description: t.subtitle,
  };
}

export default async function W1FounderProtectionPage() {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      {/* hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
            {t.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.25rem]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/70 sm:text-base">
            {t.subtitle}
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-foreground/10 pt-6 sm:grid-cols-4">
            {t.facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{k}</dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#register"
              className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep"
            >
              {t.cta}
            </a>
            <a
              href="#leave-with"
              className="text-sm text-foreground/55 underline decoration-foreground/25 underline-offset-4 transition hover:text-foreground"
            >
              {t.ctaSecondary}
            </a>
          </div>

          <p className="mt-6 max-w-xl text-xs leading-relaxed text-foreground/50">{t.checklistNote}</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gold/10 blur-2xl" aria-hidden />
          <div className="overflow-hidden rounded-2xl border border-foreground/10 shadow-2xl">
            <Image
              src="/event/w1-founder-protection-stack.jpg"
              alt={t.title}
              width={1200}
              height={1697}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* sections */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {t.sections.map((s, i) => (
            <div
              key={s.label}
              id={i === 3 ? "leave-with" : undefined}
              className="grid gap-6 border-b border-foreground/10 py-10 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-12"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                  {String(i + 1).padStart(2, "0")} — {s.label}
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{s.title}</h2>
              </div>
              <ul className="space-y-3">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/75">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-brand-gold" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* registration */}
      <section id="register" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">{t.registerEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.cta}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t.checklistNote}</p>
          <div className="mt-8">
            <W1FounderRegistration
              slug={SLUG}
              locale={locale}
              downloadHref={
                locale === "zh-Hant"
                  ? "/event/checklists/founder-continuity-checklist-zh.pdf"
                  : "/event/checklists/founder-continuity-checklist-en.pdf"
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
