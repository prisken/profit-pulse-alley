import type { MarketPulseCard } from "@prisma/client";

import { MARKET_PULSE_ADMIN_CARD_ROW_LOCALIZATION_DEFAULTS } from "@/lib/market-pulse/admin-card-row";
import { MARKET_PULSE_CARD_TYPE_SIGNAL } from "@/lib/market-pulse/card-type";

/** Synthetic IDs for Market Pulse unit tests — no real user data. */
export const TEST_USER_ID = "user_test_mp_001";
export const TEST_USER_ID_2 = "user_test_mp_002";
export const TEST_CYCLE_ID = "cycle_test_mp_001";
export const TEST_CARD_ID = "card_test_mp_001";
export const TEST_DECISION_ID = "decision_test_mp_001";
export const TEST_SETTINGS_ID = "settings_test_mp_001";

export const FIXED_NOW = new Date("2026-01-03T12:00:00.000Z");
export const CYCLE_START = new Date("2026-01-01T00:00:00.000Z");
export const CYCLE_END = new Date("2026-01-11T00:00:00.000Z");
export const CYCLE_REVEAL_FUTURE = new Date("2026-01-10T00:00:00.000Z");
export const CYCLE_REVEAL_PAST = new Date("2026-01-02T00:00:00.000Z");

/** HKT cycle day index for FIXED_NOW against CYCLE_START. */
export const PLAYABLE_DAY_INDEX = 3;

/**
 * Default nullable model fields for MarketPulseCard test fixtures.
 * Matches post–Phase-1 schema defaults so English-only cards stay valid in tests.
 */
export const MARKET_PULSE_CARD_TEST_DEFAULTS = {
  cardType: "SIGNAL",
  sortOrder: 0,
  headlineZhHant: null,
  newsBodyZhHant: null,
  summaryZhHant: null,
  cardImageAltZhHant: null,
  userPromptZhHant: null,
  ppaInsightZhHant: null,
  researchNotes: null,
  reviewStatus: "PENDING",
  reviewedAt: null,
  reviewNote: null,
} as const satisfies Pick<
  MarketPulseCard,
  | "cardType"
  | "sortOrder"
  | "headlineZhHant"
  | "newsBodyZhHant"
  | "summaryZhHant"
  | "cardImageAltZhHant"
  | "userPromptZhHant"
  | "ppaInsightZhHant"
  | "researchNotes"
  | "reviewStatus"
  | "reviewedAt"
  | "reviewNote"
>;

/** Build a full MarketPulseCard row for unit tests (English-only by default). */
export function buildMarketPulseTestCard(
  overrides: Partial<MarketPulseCard> & Pick<MarketPulseCard, "dayIndex">,
): MarketPulseCard {
  const { dayIndex, ...rest } = overrides;
  return {
    id: TEST_CARD_ID,
    cycleId: TEST_CYCLE_ID,
    dayIndex,
    companyName: "Test Co",
    companyNameZh: null,
    ticker: "TEST",
    exchange: null,
    logoUrl: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Test headline",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    newsBody: null,
    summary: null,
    logoInitials: null,
    cardImageUrl: null,
    cardImageAlt: null,
    userPrompt: null,
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: CYCLE_START,
    status: "PUBLISHED",
    publishedAt: CYCLE_START,
    revealAt: null,
    createdAt: CYCLE_START,
    updatedAt: CYCLE_START,
    ...MARKET_PULSE_CARD_TEST_DEFAULTS,
    ...rest,
  };
}

/** Defaults for admin cycle row test fixtures. */
export const MARKET_PULSE_ADMIN_CYCLE_ROW_STATS_DEFAULTS = {
  cardCount: 1,
  signalCardCount: 1,
  restCardCount: 0,
  decisionCount: 0,
  scoreCount: 0,
  prizeClaimCount: 0,
  usersPlayed: 0,
  missingSignalCount: 0,
  unlockedCount: 0,
  averageDecisionsPerParticipant: 0,
  completionRatePercent: null,
  scoreEventCount: 0,
  scoresGenerated: false,
  topWinnerName: null,
  topWinnerScore: null,
  guidedProgress: null,
} as const satisfies Partial<import("@/lib/market-pulse/admin-data").MarketPulseAdminCycleRow>;

/** Defaults for admin card row test fixtures after bilingual / sortOrder schema. */
export const MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS = {
  ...MARKET_PULSE_ADMIN_CARD_ROW_LOCALIZATION_DEFAULTS,
  cardType: MARKET_PULSE_CARD_TYPE_SIGNAL,
  createdAt: CYCLE_START.toISOString(),
} as const satisfies Partial<import("@/lib/market-pulse/admin-data").MarketPulseAdminCardRow>;
