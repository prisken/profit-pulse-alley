/**
 * Client-safe Market Pulse analytics helper.
 * Integrates with `window.profitPulseAnalytics.track` when present; otherwise
 * logs via console.debug in development and no-ops in production.
 */

export const MARKET_PULSE_ANALYTICS_EVENTS = {
  market_pulse_viewed: "market_pulse_viewed",
  hero_cta_clicked: "hero_cta_clicked",
  how_it_works_cta_clicked: "how_it_works_cta_clicked",
  hub_cta_clicked: "hub_cta_clicked",
  card_viewed: "card_viewed",
  decision_selected: "decision_selected",
  decision_confirmation_opened: "decision_confirmation_opened",
  decision_submitted: "decision_submitted",
  decision_locked: "decision_locked",
  leaderboard_viewed: "leaderboard_viewed",
  reveal_viewed: "reveal_viewed",
  profile_cta_clicked: "profile_cta_clicked",
  report_downloaded: "report_downloaded",
  webinar_cta_clicked: "webinar_cta_clicked",
  prize_claim_started: "prize_claim_started",
} as const;

export type MarketPulseAnalyticsEventName =
  (typeof MARKET_PULSE_ANALYTICS_EVENTS)[keyof typeof MARKET_PULSE_ANALYTICS_EVENTS];

export type MarketPulseAnalyticsPayload = {
  cardId?: string;
  cycleId?: string;
  dayIndex?: number;
  decision?: string;
  tab?: string;
  status?: string;
  cta?: string;
  rank?: number;
  surface?: string;
  route?: string;
};

const BLOCKED_PAYLOAD_KEYS = new Set([
  "email",
  "ppaSignal",
  "ppaInsight",
  "ppa_signal",
  "ppa_insight",
  "userEmail",
  "playerEmail",
]);

const ALLOWED_PAYLOAD_KEYS = new Set([
  "cardId",
  "cycleId",
  "dayIndex",
  "decision",
  "tab",
  "status",
  "cta",
  "rank",
  "surface",
  "route",
]);

declare global {
  interface Window {
    profitPulseAnalytics?: {
      track?: (
        eventName: string,
        payload: Record<string, unknown>,
      ) => void;
    };
  }
}

export function sanitizeMarketPulseAnalyticsPayload(
  payload: Record<string, unknown>,
): MarketPulseAnalyticsPayload {
  const safe: MarketPulseAnalyticsPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    if (BLOCKED_PAYLOAD_KEYS.has(key)) {
      continue;
    }
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      (safe as Record<string, string | number>)[key] = value;
    }
  }

  return safe;
}

export function trackMarketPulseEvent(
  eventName: MarketPulseAnalyticsEventName,
  payload: MarketPulseAnalyticsPayload = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const safePayload = sanitizeMarketPulseAnalyticsPayload(payload);

  const adapter = window.profitPulseAnalytics?.track;
  if (typeof adapter === "function") {
    adapter(eventName, safePayload);
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[market-pulse]", eventName, safePayload);
  }
}
