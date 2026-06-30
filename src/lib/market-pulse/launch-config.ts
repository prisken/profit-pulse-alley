/**
 * Market Pulse launch schedule and public copy (single source of truth).
 *
 * Public opening: 1 July 2026 at 00:00 Hong Kong Time (Asia/Hong_Kong, UTC+8).
 * UTC equivalent: 2026-06-30T16:00:00.000Z
 *
 * First cycle window: 1–10 July 2026 inclusive (HKT calendar days).
 * Exclusive end boundary: 11 July 2026 00:00 HKT → 2026-07-10T16:00:00.000Z
 */

export const MARKET_PULSE_PUBLIC_LAUNCH_AT_MS = Date.UTC(2026, 5, 30, 16, 0, 0, 0);

export const MARKET_PULSE_PUBLIC_LAUNCH_AT = new Date(
  MARKET_PULSE_PUBLIC_LAUNCH_AT_MS,
);

/** Inclusive first-cycle start (same instant as public launch). */
export const MARKET_PULSE_FIRST_CYCLE_START_AT = new Date(
  MARKET_PULSE_PUBLIC_LAUNCH_AT_MS,
);

/** Exclusive end of the first 10-day cycle (HKT midnight after day 10). */
export const MARKET_PULSE_FIRST_CYCLE_END_AT_MS = Date.UTC(2026, 6, 10, 16, 0, 0, 0);

export const MARKET_PULSE_FIRST_CYCLE_END_AT = new Date(
  MARKET_PULSE_FIRST_CYCLE_END_AT_MS,
);

export const MARKET_PULSE_LAUNCH_MESSAGES = {
  en: {
    opens: "Market Pulse is live.",
    firstCycle:
      "Each challenge cycle runs for ten calendar days (Hong Kong time).",
    prize: "One Ocean Park ticket will be awarded to the winner of each cycle.",
  },
  "zh-HK": {
    opens: "Market Pulse 已上線。",
    firstCycle: "每期挑戰為十個曆日（香港時間）。",
    prize: "每期冠軍將獲得一張海洋公園門票。",
  },
} as const;

export type MarketPulseLocale = keyof typeof MARKET_PULSE_LAUNCH_MESSAGES;

export type MarketPulseLaunchMessages =
  (typeof MARKET_PULSE_LAUNCH_MESSAGES)[MarketPulseLocale];

export function getMarketPulseLaunchMessages(
  locale: MarketPulseLocale = "en",
): MarketPulseLaunchMessages {
  return MARKET_PULSE_LAUNCH_MESSAGES[locale];
}

/** Short prize line for cycle banners and admin defaults. */
export const MARKET_PULSE_CYCLE_PRIZE_SHORT = "1 Ocean Park ticket per cycle winner";

/** @deprecated Use `getMarketPulseLaunchMessages("en").opens`. */
export const MARKET_PULSE_OPENS_MESSAGE = MARKET_PULSE_LAUNCH_MESSAGES.en.opens;

/** @deprecated Use `getMarketPulseLaunchMessages("en").firstCycle`. */
export const MARKET_PULSE_FIRST_CYCLE_MESSAGE =
  MARKET_PULSE_LAUNCH_MESSAGES.en.firstCycle;

/** @deprecated Use `getMarketPulseLaunchMessages("en").prize`. */
export const MARKET_PULSE_PRIZE_MESSAGE = MARKET_PULSE_LAUNCH_MESSAGES.en.prize;

/** Friendly error returned when a non-admin submits before public launch. */
export const MARKET_PULSE_PUBLIC_LAUNCH_SUBMIT_ERROR =
  "Market Pulse is not open for play yet. Check back when the current cycle is live.";

export type MarketPulseAccessRole = "USER" | "ADMIN";

export function isBeforePublicLaunch(at: Date = new Date()): boolean {
  return at.getTime() < MARKET_PULSE_PUBLIC_LAUNCH_AT_MS;
}

/** Whether play UI and new decision submission are allowed (admins bypass pre-launch). */
export function canAccessMarketPulsePlay(
  role: MarketPulseAccessRole | undefined,
  at: Date = new Date(),
): boolean {
  if (!isBeforePublicLaunch(at)) {
    return true;
  }
  return role === "ADMIN";
}

export function canSubmitMarketPulseDecision(
  role: MarketPulseAccessRole | undefined,
  at: Date = new Date(),
): boolean {
  return canAccessMarketPulsePlay(role, at);
}

/** Whether pre-launch marketing (countdown, announcement banner) should show. */
export function shouldShowMarketPulsePreLaunchUi(at: Date = new Date()): boolean {
  return isBeforePublicLaunch(at);
}

/** Whether inaugural launch setup guidance should appear in admin UI. */
export function shouldShowMarketPulseLaunchSetupUi(at: Date = new Date()): boolean {
  return isBeforePublicLaunch(at);
}
