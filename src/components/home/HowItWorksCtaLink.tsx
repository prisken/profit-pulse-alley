"use client";

import { ArrowRight } from "lucide-react";

import MarketPulseTrackedLink from "@/components/market-pulse/MarketPulseTrackedLink";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
} from "@/lib/market-pulse/analytics";
import {
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

export type HowItWorksCtaLinkProps = Readonly<{
  href: string;
  label: string;
  ariaLabel: string;
  status?: string;
}>;

export default function HowItWorksCtaLink({
  href,
  label,
  ariaLabel,
  status,
}: HowItWorksCtaLinkProps) {
  return (
    <MarketPulseTrackedLink
      href={href}
      aria-label={ariaLabel}
      event={MARKET_PULSE_ANALYTICS_EVENTS.how_it_works_cta_clicked}
      payload={{ surface: "home", status, cta: "play_today" }}
      className={mergeMpClasses(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-2.5 text-balance text-sm font-bold text-zinc-950 shadow-md shadow-emerald-900/30 transition-colors hover:bg-emerald-300 sm:min-h-12 sm:px-8 sm:text-base",
        MP_FOCUS_RING,
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
    </MarketPulseTrackedLink>
  );
}
