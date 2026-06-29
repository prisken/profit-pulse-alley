"use client";

import Link from "next/link";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  className?: string;
  showLinks?: boolean;
  surface?: string;
  cycleId?: string;
};

export default function MarketPulseInlineDisclaimer({
  className = "",
  showLinks = true,
  surface = "market-pulse",
  cycleId,
}: Props) {
  const { t } = useTranslations();

  return (
    <footer
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:px-6 ${className}`}
    >
      <p className="text-center text-sm leading-relaxed text-zinc-500">
        {t("legal.disclaimer.inlineMarketPulse")}
      </p>
      {showLinks ? (
        <p className="mt-3 text-center text-xs text-zinc-600">
          <Link
            href="/investment-disclaimer"
            className={`text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline ${focusRing}`}
          >
            {t("mp.disclaimer.link.investment")}
          </Link>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <Link
            href="/contest-rules"
            onClick={() => {
              trackMarketPulseEvent(
                MARKET_PULSE_ANALYTICS_EVENTS.prize_claim_started,
                {
                  cycleId,
                  cta: "contest_rules",
                  surface,
                },
              );
            }}
            className={`text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline ${focusRing}`}
          >
            {t("mp.disclaimer.link.contest")}
          </Link>
        </p>
      ) : null}
    </footer>
  );
}
