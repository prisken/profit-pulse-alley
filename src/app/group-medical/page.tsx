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
            <div className="mt-4 rounded-xl border border-dashed border-foreground/15 px-3 py-2.5 text-[11px] leading-relaxed text-foreground/55">
              ✅ Outpatient covered · ⚠️ Dental excluded · 🕳️ Pre-existing: 12-month wait
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
          </div>
          <div id="quote" className="scroll-mt-24">
            <GroupMedicalForm locale={locale} />
          </div>
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
