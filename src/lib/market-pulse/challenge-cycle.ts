import { MARKET_PULSE_PUBLIC_LAUNCH_AT_MS } from "@/lib/market-pulse/launch-config";
import type {
  ChallengeCountdown,
  MarketPulseChallengeCycle,
} from "@/lib/market-pulse/types";

/** Length of each leaderboard challenge window (in-game simulation is also 10 days). */
export const CHALLENGE_CYCLE_DAYS = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const CHALLENGE_CYCLE_MS = CHALLENGE_CYCLE_DAYS * MS_PER_DAY;

/** First cycle start: 1 Jul 2026, 00:00 Hong Kong (UTC+8). */
export const CHALLENGE_CYCLE_EPOCH_MS = MARKET_PULSE_PUBLIC_LAUNCH_AT_MS;

const HKT_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type { ChallengeCountdown, MarketPulseChallengeCycle };

function getChallengeCycleIndex(now = Date.now()): number {
  const elapsed = Math.max(0, now - CHALLENGE_CYCLE_EPOCH_MS);
  return Math.floor(elapsed / CHALLENGE_CYCLE_MS);
}

export function formatHktDate(date: Date): string {
  return HKT_DATE_FORMAT.format(date);
}

/**
 * Stable cycle key from inclusive HKT window dates, e.g. `2026-01-01_2026-01-10`.
 * `endAt` is the exclusive next-cycle boundary (HKT midnight).
 */
export function formatMarketPulseCycleId(startAt: Date, endAt: Date): string {
  const startLabel = formatHktDate(startAt);
  const inclusiveEnd = new Date(endAt.getTime() - MS_PER_DAY);
  const endLabel = formatHktDate(inclusiveEnd);
  return `${startLabel}_${endLabel}`;
}

export function getChallengeCycleStart(now = Date.now()): Date {
  const cycleIndex = getChallengeCycleIndex(now);
  return new Date(CHALLENGE_CYCLE_EPOCH_MS + cycleIndex * CHALLENGE_CYCLE_MS);
}

export function getChallengeCycleEnd(now = Date.now()): Date {
  const cycleIndex = getChallengeCycleIndex(now);
  return new Date(
    CHALLENGE_CYCLE_EPOCH_MS + (cycleIndex + 1) * CHALLENGE_CYCLE_MS,
  );
}

export function getChallengeCycleRemainingMs(now = Date.now()): number {
  return Math.max(0, getChallengeCycleEnd(now).getTime() - now);
}

export function getCurrentMarketPulseCycle(
  now = Date.now(),
): MarketPulseChallengeCycle {
  const cycleIndex = getChallengeCycleIndex(now);
  const startAt = getChallengeCycleStart(now);
  const endAt = getChallengeCycleEnd(now);

  return {
    cycleId: formatMarketPulseCycleId(startAt, endAt),
    cycleIndex,
    startAt,
    endAt,
    now: new Date(now),
    remainingMs: getChallengeCycleRemainingMs(now),
  };
}

/** @deprecated Prefer `getCurrentMarketPulseCycle`. */
export function getChallengeCycle(now = Date.now()): MarketPulseChallengeCycle {
  return getCurrentMarketPulseCycle(now);
}

export function getChallengeCountdown(now = Date.now()): ChallengeCountdown {
  let totalMs = getChallengeCycleRemainingMs(now);

  const days = Math.floor(totalMs / MS_PER_DAY);
  totalMs -= days * MS_PER_DAY;

  const hours = Math.floor(totalMs / (60 * 60 * 1000));
  totalMs -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(totalMs / (60 * 1000));
  totalMs -= minutes * 60 * 1000;

  const seconds = Math.floor(totalMs / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: getChallengeCycleRemainingMs(now),
  };
}
