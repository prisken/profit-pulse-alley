import type { Metadata } from "next";
import Link from "next/link";

import CommunityPartnersSection from "@/components/home/CommunityPartnersSection";
import GroupMedicalForm from "@/components/group-medical/GroupMedicalForm";
import { getServerSiteLocale } from "@/lib/i18n/server";

const copy = {
  en: {
    kicker: "PPA Group Medical",
    title: "Group medical, minus the 60-page PDF.",
    sub: "Tell us four things. Within one working day you get a one-page quote — the plans, the premiums, and the gaps nobody mentions in the pitch.",
    cta: "Get my one-page quote",
    micro: "60 seconds · no discovery call · no obligation",
    stats: [
      ["1", "page, not a brochure"],
      ["1", "working day, not a week"],
      ["0", "sales calls unless you ask"],
    ],
    whatTitle: "What lands in your inbox",
    what: [
      ["📄", "One page, real numbers", "Three shortlisted plans side by side, with premiums you can actually budget for."],
      ["⚠️", "The gaps, named", "Pre-existing conditions, outpatient limits, dental, and the exclusions that bite at claim time."],
      ["🧾", "A clear next step", "If it fits, we help you bind it. If it doesn’t, we tell you that too."],
    ],
    whyTitle: "Why founders and HR teams ask us",
    why: [
      "Independent — we quote across insurers, not one house.",
      "Built for Hong Kong teams, from 2 to 500 staff.",
      "Claims support in Cantonese and English, not a call-centre script.",
      "No product pitch on the first call. Ever.",
    ],
    formTitle: "Get your quote",
    trust: [
      "Independent — we quote across insurers",
      "Cantonese + English claims support",
      "Briefings with HK banks and professional firms",
    ],
    mockNote: "Illustrative only — not a quotation. A real 20-person team would see different numbers.",
    humanTitle: "Who actually prepares your quote",
    humanName: "Prisken Lo",
    humanRole: "Founder, Profit Pulse Ally",
    humanBody: "He prepares the quotes himself and answers the follow-up questions. No hand-off to a call centre.",
    cta2: "Get my one-page quote",
    faqTitle: "The questions people actually ask",
    faq: [
      ["Is this really free?", "Requesting a quote is free. If you place a policy, the insurer pays us a commission — we confirm the arrangement in writing before anything is signed."],
      ["Will an agent call me?", "No. We email unless you choose WhatsApp or ask for a call."],
      ["What’s the minimum team size?", "From two staff upwards, subject to each insurer’s rules."],
      ["We already have a plan — can you still quote?", "Yes. Send your renewal and we’ll benchmark it against the market."],
      ["Which insurers do you cover?", "We quote across Hong Kong’s major group medical insurers, and we can include your incumbent for a like-for-like comparison."],
    ],
    trustNote: "Your details stay with PPA. We only contact you about this enquiry.",
    partnersHeading: "The room we work in",
    disclaimer:
      "This is an indicative quotation service, not a contract of insurance. Final terms, premiums and eligibility are set by the insurer. Profit Pulse Ally is not an insurer and does not provide medical advice.",
  },
  "zh-Hant": {
    kicker: "PPA 團體醫療",
    title: "團體醫療保險，唔需要六十頁 PDF。",
    sub: "填四個欄位。一個工作天內，你會收到一頁報價：計劃、保費，同埋推銷時無人話你知的保障缺口。",
    cta: "索取一頁報價",
    micro: "60 秒 · 毋須開會 · 絕無壓力",
    stats: [
      ["1", "頁，唔係一本小冊子"],
      ["1", "個工作天，唔係一個星期"],
      ["0", "個推銷電話（除非你要求）"],
    ],
    whatTitle: "你會收到什麼",
    what: [
      ["📄", "一頁，真數字", "三份入圍計劃並排比較，保費是你真正可以預算的數字。"],
      ["⚠️", "缺口，講清楚", "已有病症、門診上限、牙科，以及索償時才發現的除外責任。"],
      ["🧾", "清楚的下一步", "合適就幫你落實；不合適，我們也會直接告訴你。"],
    ],
    whyTitle: "創辦人與 HR 為何找我們",
    why: [
      "獨立——我們跨保險公司報價，不只賣一間。",
      "為香港團隊而設，2 人到 500 人皆可。",
      "廣東話及英語索償支援，不是客服稿。",
      "第一次通話不推銷產品，永遠不會。",
    ],
    formTitle: "索取報價",
    trust: [
      "獨立——跨保險公司報價",
      "廣東話及英語索償支援",
      "與香港銀行及專業機構合辦簡報",
    ],
    mockNote: "僅作示意，並非報價。真實 20 人團隊的數字會有所不同。",
    humanTitle: "為你準備報價的人",
    humanName: "Prisken Lo",
    humanRole: "創辦人，Profit Pulse Ally",
    humanBody: "報價由他親手準備，後續問題也由他回答。不會轉交客服中心。",
    cta2: "索取一頁報價",
    faqTitle: "大家真正想問的問題",
    faq: [
      ["真的免費嗎？", "索取報價免費。若你落實保單，保險公司會向我們支付佣金——任何簽署前，我們會以書面確認安排。"],
      ["會有經紀致電我嗎？", "不會。除非你選擇 WhatsApp 或主動要求通話，我們以電郵聯絡。"],
      ["最少幾多人？", "由兩名員工起，視乎各保險公司規則。"],
      ["我們已有計劃，仍可報價嗎？", "可以。把續保資料給我們，我們會與市場作對比。"],
      ["你們涵蓋哪些保險公司？", "我們跨香港主要團體醫療保險公司報價，亦可加入你現有的承保公司作同類比較。"],
    ],
    trustNote: "你的資料只留在 PPA，我們只會就這次查詢聯絡你。",
    partnersHeading: "我們合作的場景",
    disclaimer:
      "本服務提供參考報價，並非保險合約。最終條款、保費及承保資格由保險公司決定。Profit Pulse Ally 並非保險公司，亦不提供醫療建議。",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return {
    title: `${t.title} — Profit Pulse Ally`,
    description: t.sub,
  };
}

export default async function GroupMedicalPage() {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-16 lg:pt-20">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">{t.kicker}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/75 sm:text-base">{t.sub}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a href="#quote" className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3.5 text-sm font-bold text-brand-black transition hover:bg-brand-gold-deep">
              {t.cta}
            </a>
            <span className="text-xs text-foreground/50">{t.micro}</span>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-foreground/10 pt-6">
            {t.stats.map(([n, label]) => (
              <div key={label}>
                <dt className="text-3xl font-bold tabular-nums text-brand-gold">{n}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-foreground/65">{label}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-wrap gap-2">
            {t.trust.map((item) => (
              <li key={item} className="rounded-full border border-foreground/12 bg-foreground/[0.03] px-3 py-1.5 text-[11px] font-medium text-foreground/70">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 -z-10 rotate-2 rounded-[2rem] bg-brand-gold/15 blur-2xl" aria-hidden />
          <div className="rotate-1 rounded-2xl border border-foreground/10 bg-background p-5 shadow-2xl transition hover:rotate-0">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-foreground/40">
              <span>PPA Quote</span>
              <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 font-semibold text-brand-gold">1 page</span>
            </div>
            <div className="mt-4 space-y-3">
              {[["Plan A", "HKD 1,180 / staff / yr"], ["Plan B", "HKD 2,050 / staff / yr"], ["Plan C", "HKD 3,400 / staff / yr"]].map(([p, v], i) => (
                <div key={p} className={`flex items-baseline justify-between rounded-xl border border-foreground/8 px-3 py-2.5 ${i === 1 ? "bg-brand-gold/[0.07]" : ""}`}>
                  <span className="text-xs font-semibold">{p}</span>
                  <span className="text-[13px] tabular-nums text-foreground/80">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-foreground/55">{t.mockNote}</p>
            <div className="mt-4 rounded-xl border border-dashed border-foreground/15 px-3 py-2.5 text-[11px] leading-relaxed text-foreground/55">
              ✅ Outpatient covered · ⚠️ Dental excluded · ⏳ Pre-existing: 12-month wait
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.whatTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {t.what.map(([emoji, title, body]) => (
              <div key={title} className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5">
                <p className="text-2xl">{emoji}</p>
                <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/10 bg-brand-gold/[0.05]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <p className="text-sm font-semibold text-foreground/85">
            {locale === "zh-Hant" ? "準備好睇一頁真數字？" : "Ready to see real numbers on one page?"}
          </p>
          <a href="#quote" className="inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-gold-deep">
            {t.cta2}
          </a>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.whyTitle}</h2>
            <ul className="mt-5 space-y-3">
              {t.why.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/75">
                  <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-brand-gold" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-gold/15 text-sm font-bold text-brand-gold">PL</div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{t.humanTitle}</p>
                <p className="mt-1 text-sm font-semibold">{t.humanName}</p>
                <p className="text-[11px] text-foreground/50">{t.humanRole}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/65">{t.humanBody}</p>
              </div>
            </div>
          </div>
          <div id="quote" className="scroll-mt-24">
            <GroupMedicalForm locale={locale} />
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.faqTitle}</h2>
          <dl className="mt-6 divide-y divide-foreground/10">
            {t.faq.map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="text-sm font-semibold">{q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-foreground/65">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <CommunityPartnersSection />
      </section>

      <footer className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="max-w-3xl text-[13px] leading-relaxed text-foreground/60">{t.disclaimer}</p>
          <p className="mt-4 text-xs text-foreground/45">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">Profit Pulse Ally</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
