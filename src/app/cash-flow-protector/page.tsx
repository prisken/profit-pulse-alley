import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CashFlowCalculator from "@/components/cash-flow/CashFlowCalculator";
import { CASH_FLOW_PROTECTOR_LIVE } from "@/lib/cash-flow/feature-flag";
import { getServerSiteLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Cash-Flow Protector Calculator | Profit Pulse Ally"
      : "現金流保障計算器 | Profit Pulse Ally",
    description: isEn
      ? "A free, educational Freedom Number calculator — estimate what long-term vehicles might need to cover your extras. Educational only."
      : "免費的 Freedom Number 教育計算器 — 估算長期工具可能需要多少資金覆蓋你的額外開支。僅供教育用途。",
  };
}

export default async function CashFlowProtectorPage() {
  // HELD pending lawyer/AIA review — not publicly reachable until flag flips.
  if (!CASH_FLOW_PROTECTOR_LIVE) {
    notFound();
  }

  const locale = await getServerSiteLocale();
  const isEn = locale === "en";

  return (
    <main className="min-h-dvh overflow-x-hidden bg-zinc-950 px-3 py-6 text-zinc-200 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm">
          <Link href="/" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
            ← {isEn ? "Home" : "首頁"}
          </Link>
        </p>

        <div className="mt-4 text-center">
          <h1 className="brand-display text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {isEn
              ? "The Freedom Number Calculator"
              : "Freedom Number 計算器"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isEn
              ? "How much capital might it take for long-term vehicles to cover your extras — so your operating cash flow stays intact? A simple, conservative, educational estimate."
              : "長期工具可能需要多少資本來覆蓋你的額外開支——讓你的營運現金流保持完整？一個簡單、保守、教育性的估算。"}
          </p>
        </div>

        <div className="mt-8">
          <CashFlowCalculator locale={isEn ? "en" : "zh-Hant"} />
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <h2 className="brand-display text-lg font-bold text-white sm:text-xl">
            {isEn ? "Want to explore further?" : "想深入了解？"}
          </h2>
          <div className="mt-4 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              href="/market-pulse/play"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-gold px-7 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-deep"
            >
              {isEn ? "Play Market Pulse" : "玩 Market Pulse"}
            </Link>
            <Link
              href="/concept"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-mp-obsidian-panel px-7 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-mp-obsidian-elevated"
            >
              {isEn ? "Zero-Cost Life Philosophy" : "Zero-Cost Life 理念"}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-mp-obsidian-panel px-7 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-mp-obsidian-elevated"
            >
              {isEn ? "Speak with a licensed advisor (referral)" : "與持牌顧問交談（轉介）"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
