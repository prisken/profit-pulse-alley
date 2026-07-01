import type { MarketPulseCard, MarketPulseCycle } from "@prisma/client";

import {
  getHktCalendarDayIndex,
  hktReleaseAtUtcFromCalendarDayIndex,
  MARKET_PULSE_CARD_RELEASE_HKT_HOUR,
  MARKET_PULSE_CARD_RELEASE_UTC_HOUR,
} from "@/lib/market-pulse/hkt-time";

export {
  MARKET_PULSE_CARD_RELEASE_HKT_HOUR,
  MARKET_PULSE_CARD_RELEASE_UTC_HOUR,
} from "@/lib/market-pulse/hkt-time";

/** Normalize legacy 0-based day rows to 1-based schedule day for release time. */
export function scheduleDayIndexForCard(cardDayIndex: number): number {
  return cardDayIndex >= 1 ? cardDayIndex : cardDayIndex + 1;
}

/**
 * Absolute UTC release instant for a cycle day.
 *
 * Algorithm (fixed UTC+8, no DST):
 * 1. Derive the cycle start HKT calendar day from `cycleStartsAt` (UTC instant).
 * 2. Add (`dayIndex` - 1) whole HKT calendar days.
 * 3. Set release to 09:00 HKT on that day (= 01:00 UTC on the same HKT date).
 *
 * Example — cycle `startsAt = 2026-06-30T16:00:00.000Z` (2026-07-01 00:00 HKT):
 * - Day 1 → 2026-07-01T01:00:00.000Z (2026-07-01 09:00 HKT)
 * - Day 2 → 2026-07-02T01:00:00.000Z (2026-07-02 09:00 HKT)
 */
export function getCycleDayReleaseAt(
  cycleStartsAt: Date | string,
  dayIndex: number,
): Date {
  const normalizedDay = scheduleDayIndexForCard(dayIndex);
  const cycleStartHktDay = getHktCalendarDayIndex(new Date(cycleStartsAt));
  const releaseHktDay = cycleStartHktDay + Math.max(normalizedDay - 1, 0);
  return hktReleaseAtUtcFromCalendarDayIndex(releaseHktDay);
}

/**
 * 1-based cycle day number for `at`, measured in HKT calendar days from the
 * cycle start date (day 1 = start calendar date in HKT).
 */
export function getCycleDayForDate(cycleStartsAt: Date, at: Date): number {
  const cycleStartHktDay = getHktCalendarDayIndex(cycleStartsAt);
  const atHktDay = getHktCalendarDayIndex(at);
  return Math.max(1, atHktDay - cycleStartHktDay + 1);
}

export function effectiveCardRevealAt(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "revealAt">,
): Date {
  return card.revealAt ?? cycle.revealAt;
}

/**
 * Whether the derived 9:00 AM HKT release for the card's cycle day has passed.
 */
export function hasDerivedCycleDayReleasePassed(
  cycleStartsAt: Date | string,
  dayIndex: number,
  now: Date,
): boolean {
  return now.getTime() >= getCycleDayReleaseAt(cycleStartsAt, dayIndex).getTime();
}

/**
 * Legacy `publishedAt` gate: null/blank passes; otherwise `now` must be >= `publishedAt`.
 * A future `publishedAt` blocks play even when the derived schedule has passed.
 */
export function hasLegacyPublishedAtGatePassed(
  publishedAt: Date | null | undefined,
  now: Date,
): boolean {
  if (!publishedAt) {
    return true;
  }
  return now.getTime() >= publishedAt.getTime();
}

/**
 * Effective player release instant (informational).
 *
 * Derived 9:00 AM HKT is the baseline. Legacy `publishedAt` never moves release
 * earlier than that schedule. When `publishedAt` is later than derived (manual
 * deferral), play waits until `publishedAt`.
 */
export function getEffectiveCardReleaseAt(
  card: Pick<MarketPulseCard, "publishedAt" | "dayIndex">,
  cycleStartsAt: Date | string,
): Date {
  const derived = getCycleDayReleaseAt(cycleStartsAt, card.dayIndex);
  if (card.publishedAt && card.publishedAt.getTime() > derived.getTime()) {
    return card.publishedAt;
  }
  return derived;
}

/**
 * Whether a published card is released for player play.
 *
 * Both gates must pass:
 * 1. `now >= derivedReleaseAtUtc` (09:00 HKT converted to UTC)
 * 2. `publishedAt == null || publishedAt <= now`
 */
export function isCardReleasedForPlay(
  card: Pick<MarketPulseCard, "status" | "publishedAt" | "dayIndex">,
  cycle: Pick<MarketPulseCycle, "startsAt">,
  now: Date,
): boolean {
  if (card.status !== "PUBLISHED") {
    return false;
  }

  if (!hasDerivedCycleDayReleasePassed(cycle.startsAt, card.dayIndex, now)) {
    return false;
  }

  if (!hasLegacyPublishedAtGatePassed(card.publishedAt, now)) {
    return false;
  }

  return true;
}

/** Whether the decision window is still open (before card/cycle reveal cutoff). */
export function isCardWithinRevealWindow(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "revealAt">,
  now: Date,
): boolean {
  return now.getTime() < effectiveCardRevealAt(card, cycle).getTime();
}

/** @deprecated Use {@link getCycleDayReleaseAt}. Kept for admin scheduling call sites. */
export function deriveCardPublishedAtFromSchedule(
  cycleStartsAt: Date | string,
  dayIndex: number,
): Date {
  return getCycleDayReleaseAt(cycleStartsAt, dayIndex);
}
