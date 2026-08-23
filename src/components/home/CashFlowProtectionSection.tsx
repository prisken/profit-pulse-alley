import Link from "next/link";

import { getServerTranslations } from "@/lib/i18n/server";
import { MP_HOME_SECTION, MP_TERMINAL_PANEL, mergeMpClasses } from "@/lib/market-pulse/visual-primitives";

type Locale = "en" | "zh-Hant";

const COPY: Record<Locale, {
  eyebrow: string;
  headline: string;
  sub: string;
  bullets: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  disclaimer: string;
  disclaimerLink: string;
}> = {
  en: {
    eyebrow: "Zero-Cost Life · Cash-Flow Protection",
    headline:
      "Protect Your Business Cash Flow. Let Long-Term Vehicles Cover the Rest.",
    sub: "Business owners already think in systems. Here's how the same principles can help extras stay off your operating cash flow.",
    bullets: [
      "Generate potential returns over time to help offset lifestyle extras, subscriptions, perks or \u201Cnice-to-haves\u201D so your operating cash flow stays intact for growth.",
      "This is an educational framework only — not a product recommendation or guarantee.",
      "Speak with a licensed professional about long-term participating products from established insurers such as AIA.",
    ],
    ctaPrimary: "Play Market Pulse & Learn the Rhythm",
    ctaSecondary: "Calculate Your Freedom Number",
    disclaimer:
      "Educational illustration only. Returns are not guaranteed. You may lose money. Consult a licensed advisor.",
    disclaimerLink: "Full Investment Disclaimer",
  },
  "zh-Hant": {
    eyebrow: "Zero-Cost Life · 現金流保障",
    headline: "保護你的企業現金流。讓長期工具覆蓋其餘開支。",
    sub: "企業主已經習慣用系統思考。以下是如何用同樣原則，讓額外開支遠離你的營運現金流。",
    bullets: [
      "隨時間產生潛在回報，幫助抵銷生活額外開支、訂閱、福利或「錦上添花」項目，讓營運現金流保持完整用於增長。",
      "這只是一個教育框架——不是產品推薦或保證。",
      "請與持牌專業人士討論來自 AIA 等知名保險公司的長期分紅產品。",
    ],
    ctaPrimary: "玩 Market Pulse 學習節奏",
    ctaSecondary: "計算你的 Freedom Number",
    disclaimer:
      "僅供教育示意。回報不保證。你可能損失金錢。請諮詢持牌顧問。",
    disclaimerLink: "完整投資免責聲明",
  },
};

/**
 * Homepage mid-page block — after "Think in systems" pillars, before Operators.
 * Educational only, IA-compliant copy. Dual CTAs.
 */
export default async function CashFlowProtectionSection() {
  const { locale } = await getServerTranslations();
  const c = COPY[locale === "en" ? "en" : "zh-Hant"];

  return (
    <section
      id="cash-flow-protection"
      className={mergeMpClasses(MP_HOME_SECTION, "border-brand-gold/10")}
      aria-labelledby="cash-flow-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid min-w-0 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
          <div className="flex min-w-0 flex-col">
            <p className="mp-text-ticker text-brand-gold">{c.eyebrow}</p>
            <h2
              id="cash-flow-heading"
              className="brand-display mt-2.5 text-balance text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl md:text-[1.75rem]"
            >
              {c.headline}
            </h2>
            <p className="mt-2.5 max-w-xl text-pretty text-sm leading-relaxed text-mp-muted sm:text-base">
              {c.sub}
            </p>

            <ul className="mt-5 grid gap-2.5">
              {c.bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300 sm:text-[15px]"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold"
                    aria-hidden="true"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href="/market-pulse/play"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-deep sm:px-7"
              >
                {c.ctaPrimary}
              </Link>
              <Link
                href="/cash-flow-protector"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-mp-obsidian-panel px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/25 hover:bg-mp-obsidian-elevated sm:px-7"
              >
                {c.ctaSecondary}
              </Link>
            </div>

            <p className="mt-4 max-w-xl text-xs leading-relaxed text-zinc-500">
              {c.disclaimer}{" "}
              <Link
                href="/investment-disclaimer"
                className="font-semibold text-amber-400/90 underline underline-offset-2 hover:text-amber-300"
              >
                {c.disclaimerLink}
              </Link>
            </p>
          </div>

          {/* Before/after visual — simple, mobile-friendly, no invented figures */}
          <div
            className={mergeMpClasses(
              MP_TERMINAL_PANEL,
              "bg-gradient-to-b from-white/[0.05] to-transparent p-4 sm:p-5",
            )}
            aria-hidden="true"
          >
            <div className="grid gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3.5">
                <p className="mp-text-ticker text-zinc-500">
                  {locale === "en" ? "Before — extras eat into operations" : "之前 — 額外開支侵蝕營運"}
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[72%] rounded-full bg-zinc-600/70" />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {locale === "en" ? "☕ Commute · WeWork · Perks · Travel" : "☕ 咖啡 · 通勤 · WeWork · 福利 · 旅行"}
                </p>
              </div>

              <div className="rounded-xl border border-brand-gold/25 bg-black/30 p-3.5">
                <p className="mp-text-ticker text-brand-gold">
                  {locale === "en" ? "After — extras potentially covered by compounding" : "之後 — 額外開支可能由複利覆蓋"}
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[38%] rounded-full bg-brand-gold" />
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[34%] rounded-full bg-brand-gold/50" />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {locale === "en" ? "Core cash flow protected · Extras on a growing bar" : "核心現金流受保護 · 額外開支在增長柱上"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
