"use client";

import { ArrowRight } from "lucide-react";

import MarketPulseTrackedLink from "@/components/market-pulse/MarketPulseTrackedLink";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
} from "@/lib/market-pulse/analytics";
import {
  MP_FOCUS_RING,
  MP_PRIMARY_BTN,
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
        MP_PRIMARY_BTN,
        "min-h-11 max-w-full px-6 py-2.5 text-balance text-sm sm:min-h-12 sm:px-8 sm:text-base",
        MP_FOCUS_RING,
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
    </MarketPulseTrackedLink>
  );
}
