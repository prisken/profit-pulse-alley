import type { MarketPulsePlayPageData, MarketPulsePlayPageStatus } from "@/lib/market-pulse/play-data";

const RUNTIME_GATED_STATUSES: MarketPulsePlayPageStatus[] = [
  "playable",
  "sign_in_required",
  "no_card_today",
  "between_cycles",
  "cycle_unavailable",
];

export function shouldGateRuntimeClosed(
  status: MarketPulsePlayPageStatus,
  runtimeOpen: boolean,
): boolean {
  if (runtimeOpen || status === "pre_launch" || status === "locked") {
    return false;
  }
  return RUNTIME_GATED_STATUSES.includes(status);
}

export function gateRuntimeClosedPageData(
  data: MarketPulsePlayPageData,
  runtimeOpen: boolean,
): MarketPulsePlayPageData {
  if (!shouldGateRuntimeClosed(data.status, runtimeOpen)) {
    return { ...data, runtimeOpen };
  }

  return {
    ...data,
    runtimeOpen: false,
    status: "runtime_closed",
    ...{
      cardsToday: [],
      activeCardIndex: 0,
      card: null,
      lockedDecision: null,
      cardProgress: null,
    },
  };
}
