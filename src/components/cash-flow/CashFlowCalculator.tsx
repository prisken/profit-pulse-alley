"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Locale = "en" | "zh-Hant";

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    monthlyLabel: string;
    monthlyHint: string;
    yearsLabel: string;
    yearsHint: string;
    cta: string;
    gateTitle: string;
    gateLead: string;
    emailLabel: string;
    emailPlaceholder: string;
    gateCta: string;
    gatePrivacy: string;
    resultTitle: string;
    resultCapital: string;
    resultCapitalNote: string;
    resultYears: string;
    resultYearsNote: string;
    rateNote: string;
    disclaimer: string;
    disclaimerLink: string;
    recalc: string;
    sending: string;
    errorEmail: string;
    errorGeneric: string;
  }
> = {
  en: {
    eyebrow: "Freedom Number Calculator",
    title: "Calculate Your Freedom Number",
    lead: "A simple, conservative estimate of what it might take for long-term vehicles to cover your extras. Educational only.",
    monthlyLabel: "Monthly 'redundant / desired' expenses (HKD)",
    monthlyHint: "e.g. coffee + commute + WeWork + perks + travel · HK$2,000 – HK$30,000",
    yearsLabel: "Years to milestone (optional)",
    yearsHint: "Default 15 · 10–20 typical",
    cta: "Calculate",
    gateTitle: "Get your illustrated result by email",
    gateLead: "Enter your email and we'll send the numbers plus educational Zero-Cost Life insights.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    gateCta: "Send me the result",
    gatePrivacy: "Educational only. See the Privacy Policy.",
    resultTitle: "Illustrated estimate",
    resultCapital: "Capital needed today (illustrated)",
    resultCapitalNote: "to generate your monthly amount at a conservative 4–5% illustrated rate",
    resultYears: "Years to Zero-Cost (illustrated)",
    resultYearsNote: "at your entered monthly contribution — illustrative, not guaranteed",
    rateNote:
      "Illustrated rates 4–5% annual are within official illustration ranges for certain long-term participating products. Actual returns depend on insurer performance and markets. Not guaranteed.",
    disclaimer:
      "This calculator is for educational purposes only. It uses simplified, conservative illustrated rates that are not guaranteed. Actual returns depend on insurer performance and markets. You may lose money. This is not advice, not a recommendation, and not an offer of any product. Profit Pulse Ally is not a licensed insurance intermediary. Always consult a licensed professional and read official documents.",
    disclaimerLink: "Full Investment Disclaimer",
    recalc: "Re-calculate",
    sending: "Sending…",
    errorEmail: "Please enter a valid email.",
    errorGeneric: "Something went wrong — please try again.",
  },
  "zh-Hant": {
    eyebrow: "Freedom Number 計算器",
    title: "計算你的 Freedom Number",
    lead: "一個簡單、保守的估算，了解長期工具可能需要多少資金來覆蓋你的額外開支。僅供教育用途。",
    monthlyLabel: "每月「額外／想要」開支（港幣）",
    monthlyHint: "例如：咖啡＋通勤＋WeWork＋福利＋旅行 · HK$2,000 – HK$30,000",
    yearsLabel: "達到里程碑的年數（可選）",
    yearsHint: "預設 15 · 通常 10–20",
    cta: "計算",
    gateTitle: "透過電郵收取你的演示結果",
    gateLead: "輸入電郵，我們會把數字和 Zero-Cost Life 教育見解發送給你。",
    emailLabel: "電郵",
    emailPlaceholder: "you@example.com",
    gateCta: "發送結果給我",
    gatePrivacy: "僅供教育用途。請參閱私隱政策。",
    resultTitle: "演示估算",
    resultCapital: "今日所需資本（演示）",
    resultCapitalNote: "以保守的 4–5% 演示利率產生你的每月金額",
    resultYears: "Zero-Cost 所需年數（演示）",
    resultYearsNote: "按你輸入的每月供款計算 — 僅供演示，不保證",
    rateNote:
      "4–5% 年化演示利率屬於某些長期分紅產品的官方演示範圍。實際回報取決於保險公司表現及市場。不保證。",
    disclaimer:
      "此計算器僅供教育用途。它使用簡化的保守演示利率，並不保證。實際回報取決於保險公司表現及市場。你可能損失金錢。這不是建議、不是推薦，也不是任何產品的要約。Profit Pulse Ally 並非持牌保險中介人。請務必諮詢持牌專業人士並閱讀官方文件。",
    disclaimerLink: "完整投資免責聲明",
    recalc: "重新計算",
    sending: "傳送中…",
    errorEmail: "請輸入有效的電郵地址。",
    errorGeneric: "發生錯誤 — 請重試。",
  },
};

function fmtHkd(n: number): string {
  return "HK$" + Math.round(n).toLocaleString("en-HK");
}

export default function CashFlowCalculator({ locale = "en" }: { locale?: Locale }) {
  const c = COPY[locale];
  const [monthly, setMonthly] = useState(8000);
  const [years, setYears] = useState(15);
  const [contribution, setContribution] = useState(0);
  const [phase, setPhase] = useState<"input" | "gate" | "result">("input");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const rate = 0.04; // conservative illustrated rate — within 4–6.5% official range
  const capital = useMemo(() => (monthly * 12) / rate, [monthly]);

  const yearsToZeroCost = useMemo(() => {
    if (contribution <= 0) return null;
    // n = ln(1 + r*C/P) / ln(1+r) — time for contributions to reach capital target
    const p = contribution * 12;
    if (p >= capital) return 0;
    const r = rate;
    const n = Math.log(1 + (r * capital) / p) / Math.log(1 + r);
    return Math.ceil(n);
  }, [contribution, capital]);

  function submitGate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(c.errorEmail);
      return;
    }
    setSending(true);
    fetch("/api/cash-flow/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), monthly, years, locale }),
    })
      .then((res) => res.json().catch(() => ({ ok: false })))
      .then((data) => {
        if (!data.ok) throw new Error();
        setSending(false);
        setPhase("result");
      })
      .catch(() => {
        setSending(false);
        setError(c.errorGeneric);
      });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-white/[0.08] bg-mp-obsidian-panel p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:p-6">
        <p className="mp-text-ticker text-brand-gold">{c.eyebrow}</p>
        <h2 className="brand-display mt-2 text-xl font-bold text-white sm:text-2xl">
          {c.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.lead}</p>

        {phase === "input" && (
          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="cf-monthly" className="text-sm font-semibold text-zinc-200">
                {c.monthlyLabel}
              </label>
              <input
                id="cf-monthly"
                type="number"
                inputMode="numeric"
                min={2000}
                max={30000}
                step={500}
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-mp-obsidian px-3.5 py-2.5 text-sm text-white placeholder:text-mp-muted"
              />
              <p className="mt-1 text-xs text-zinc-500">{c.monthlyHint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cf-years" className="text-sm font-semibold text-zinc-200">
                  {c.yearsLabel}
                </label>
                <input
                  id="cf-years"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={30}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value) || 15)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-mp-obsidian px-3.5 py-2.5 text-sm text-white"
                />
                <p className="mt-1 text-xs text-zinc-500">{c.yearsHint}</p>
              </div>
              <div>
                <label htmlFor="cf-contribution" className="text-sm font-semibold text-zinc-200">
                  {locale === "en" ? "Monthly contribution (optional, HKD)" : "每月供款（可選，港幣）"}
                </label>
                <input
                  id="cf-contribution"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  value={contribution}
                  onChange={(e) => setContribution(Number(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-mp-obsidian px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPhase("gate")}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-gold px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-deep sm:text-base"
            >
              {c.cta}
            </button>
          </div>
        )}

        {phase === "gate" && (
          <form onSubmit={submitGate} className="mt-5 grid gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{c.gateTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{c.gateLead}</p>
            </div>
            <div>
              <label htmlFor="cf-email" className="sr-only">
                {c.emailLabel}
              </label>
              <input
                id="cf-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={c.emailPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-mp-obsidian px-3.5 py-2.5 text-sm text-white placeholder:text-mp-muted"
              />
              {error ? (
                <p className="mt-1.5 text-xs font-semibold text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-gold px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-deep disabled:opacity-60 sm:text-base"
            >
              {sending ? c.sending : c.gateCta}
            </button>
            <p className="text-xs text-zinc-500">
              {c.gatePrivacy}{" "}
              <Link href="/privacy" className="font-semibold text-amber-400/90 underline underline-offset-2 hover:text-amber-300">
                {locale === "en" ? "Privacy Policy" : "私隱政策"}
              </Link>
            </p>
          </form>
        )}

        {phase === "result" && (
          <div className="mt-5 grid gap-4">
            <h3 className="brand-display text-lg font-bold text-white">{c.resultTitle}</h3>

            <div className="rounded-xl border border-brand-gold/25 bg-black/30 p-4">
              <p className="text-xs text-zinc-500">{c.resultCapital}</p>
              <p className="brand-display mt-1 text-2xl font-bold text-brand-gold sm:text-3xl">
                {fmtHkd(capital)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{c.resultCapitalNote}</p>
            </div>

            {yearsToZeroCost !== null ? (
              <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
                <p className="text-xs text-zinc-500">{c.resultYears}</p>
                <p className="brand-display mt-1 text-2xl font-bold text-white sm:text-3xl">
                  ≈ {yearsToZeroCost} {locale === "en" ? "years" : "年"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{c.resultYearsNote}</p>
              </div>
            ) : null}

            <p className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90">
              {c.rateNote}
            </p>

            <button
              type="button"
              onClick={() => setPhase("input")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-mp-obsidian px-6 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-mp-obsidian-elevated"
            >
              {c.recalc}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-zinc-500">
        {c.disclaimer}{" "}
        <Link
          href="/investment-disclaimer"
          className="font-semibold text-amber-400/90 underline underline-offset-2 hover:text-amber-300"
        >
          {c.disclaimerLink}
        </Link>
      </p>
    </div>
  );
}
