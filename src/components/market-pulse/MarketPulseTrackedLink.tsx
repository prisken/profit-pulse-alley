"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  trackMarketPulseEvent,
  type MarketPulseAnalyticsEventName,
  type MarketPulseAnalyticsPayload,
} from "@/lib/market-pulse/analytics";

export type MarketPulseTrackedLinkProps = Readonly<{
  href: string;
  event: MarketPulseAnalyticsEventName;
  payload?: MarketPulseAnalyticsPayload;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}>;

export default function MarketPulseTrackedLink({
  href,
  event,
  payload = {},
  children,
  className,
  "aria-label": ariaLabel,
}: MarketPulseTrackedLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      onClick={() =>
        trackMarketPulseEvent(event, {
          ...payload,
          route: href,
        })
      }
    >
      {children}
    </Link>
  );
}
