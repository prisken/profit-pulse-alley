/**
 * Shared Market Pulse scoring and decision constants.
 * Safe for import from client components and server modules (no Prisma).
 */

export const PARTICIPATION_POINTS = 10;
export const MATCH_BONUS_POINTS = 50;
export const STREAK_BONUS_POINTS = 100;
export const STREAK_INTERVAL = 3;

export const VALID_DECISIONS = ["BULLISH", "CAUTIOUS"] as const;

export type MarketPulseDecision = (typeof VALID_DECISIONS)[number];

/** User-facing labels keyed by decision value. */
export const SIGNAL_LABELS = {
  BULLISH: "Bullish",
  CAUTIOUS: "Cautious",
} as const satisfies Record<MarketPulseDecision, string>;

export type MarketPulseSignalToneName = "positive" | "cautious";

/** Styling hints for UI layers (Tailwind classes match the site zinc palette). */
export type MarketPulseSignalTone = {
  tone: MarketPulseSignalToneName;
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
};

const SIGNAL_TONES: Record<MarketPulseDecision, MarketPulseSignalTone> = {
  BULLISH: {
    tone: "positive",
    label: SIGNAL_LABELS.BULLISH,
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    ringClass: "ring-emerald-500/40",
  },
  CAUTIOUS: {
    tone: "cautious",
    label: SIGNAL_LABELS.CAUTIOUS,
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    ringClass: "ring-amber-500/40",
  },
};

export function isMarketPulseDecision(
  value: string,
): value is MarketPulseDecision {
  return (VALID_DECISIONS as readonly string[]).includes(value);
}

/** @alias isMarketPulseDecision */
export const isValidMarketPulseDecision = isMarketPulseDecision;

export function formatSignal(signal: MarketPulseDecision): string {
  return SIGNAL_LABELS[signal];
}

export function getSignalTone(signal: MarketPulseDecision): MarketPulseSignalTone {
  return SIGNAL_TONES[signal];
}
