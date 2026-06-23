"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Minus,
} from "lucide-react";

import { SIGNAL_LABELS } from "@/lib/market-pulse/constants";
import type { MarketPulseAdminCardPreviewData } from "@/lib/market-pulse/card-validation";
import { getSignalTone } from "@/lib/market-pulse/constants";

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatSourceDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-HK", { dateStyle: "medium" }).format(date);
}

function priceDirectionTone(direction: string | null | undefined): {
  icon: typeof ArrowUpRight;
  className: string;
} {
  const normalized = direction?.trim().toLowerCase() ?? "";
  if (
    normalized.includes("up") ||
    normalized.includes("bull") ||
    normalized.startsWith("+")
  ) {
    return { icon: ArrowUpRight, className: "text-emerald-400" };
  }
  if (
    normalized.includes("down") ||
    normalized.includes("bear") ||
    normalized.startsWith("-")
  ) {
    return { icon: ArrowDownRight, className: "text-rose-400" };
  }
  return { icon: Minus, className: "text-zinc-400" };
}

type Props = {
  card: MarketPulseAdminCardPreviewData;
  className?: string;
};

export default function MarketPulseAdminCardPreview({ card, className = "" }: Props) {
  const sourceDateLabel = formatSourceDate(card.sourceDate);
  const priceTone = priceDirectionTone(card.priceDirection);
  const PriceIcon = priceTone.icon;
  const locked = Boolean(card.ppaSignalLockedAt);
  const ppaTone =
    card.ppaSignal && card.ppaSignal in SIGNAL_LABELS
      ? getSignalTone(card.ppaSignal)
      : null;

  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      <div className="relative min-h-[24rem] rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-zinc-950 p-5 shadow-2xl shadow-black/50 sm:min-h-[26rem] sm:p-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-gradient-to-b from-emerald-500/10 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start gap-4">
            {card.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 bg-white/5 object-cover shadow-inner"
              />
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 to-zinc-900 text-lg font-bold text-emerald-200"
                aria-hidden="true"
              >
                {companyInitials(card.companyName || "?")}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {card.companyName || "Company name"}
              </h2>
              {card.companyNameZh ? (
                <p className="mt-0.5 text-sm text-zinc-400">{card.companyNameZh}</p>
              ) : null}
              <p className="mt-2 font-mono text-sm text-emerald-300/90">
                {card.ticker || "TICKER"}
                {card.exchange ? (
                  <span className="text-zinc-500"> · {card.exchange}</span>
                ) : null}
              </p>
            </div>
          </div>

          {card.priceLabel ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3">
              <PriceIcon className={`h-5 w-5 ${priceTone.className}`} aria-hidden="true" />
              <span className="text-lg font-semibold tabular-nums text-white">
                {card.priceLabel}
              </span>
              {card.priceDirection ? (
                <span className={`text-sm font-medium ${priceTone.className}`}>
                  {card.priceDirection}
                </span>
              ) : null}
            </div>
          ) : null}

          <h3 className="mt-5 text-balance text-lg font-semibold leading-snug text-zinc-100 sm:text-xl">
            {card.headline || "Headline preview"}
          </h3>

          {(card.sourceName || sourceDateLabel) && (
            <p className="mt-3 text-sm text-zinc-500">
              {card.sourceUrl && card.sourceName ? (
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {card.sourceName}
                </a>
              ) : (
                card.sourceName
              )}
              {card.sourceName && sourceDateLabel ? " · " : null}
              {sourceDateLabel}
            </p>
          )}

          {card.summary ? (
            <p className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
              {card.summary}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <p className="mt-6 text-center text-sm font-medium text-zinc-300 sm:text-base">
            What is your read on this market signal?
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200/90">
            Admin · PPA signal
          </p>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-100">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Locked
            </span>
          ) : null}
        </div>

        {card.ppaSignal && ppaTone ? (
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${ppaTone.bgClass} ${ppaTone.borderClass} ${ppaTone.textClass}`}
            >
              {ppaTone.label}
            </span>
            {card.ppaInsight ? (
              <p className="mt-3 text-sm leading-relaxed text-amber-50/90">
                {card.ppaInsight}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-amber-100/50">No PPA insight yet.</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm italic text-amber-100/60">
            Set PPA signal and insight before locking or publishing.
          </p>
        )}
      </div>
    </div>
  );
}
