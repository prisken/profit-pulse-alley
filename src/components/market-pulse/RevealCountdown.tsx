"use client";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";

/** @deprecated Use `MarketPulseCountdown` directly. */
export default function RevealCountdown({
  revealAtIso,
}: Readonly<{
  revealAtIso: string;
  initialRemainingMs?: number;
}>) {
  return <MarketPulseCountdown targetDate={revealAtIso} />;
}
