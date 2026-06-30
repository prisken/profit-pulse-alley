import type { MarketPulseCycleStatus } from "@prisma/client";

import { FIRST_CYCLE_GUIDANCE } from "@/lib/market-pulse/first-cycle-admin-guidance";
import {
  MARKET_PULSE_FIRST_CYCLE_END_AT_MS,
  MARKET_PULSE_PUBLIC_LAUNCH_AT_MS,
} from "@/lib/market-pulse/launch-config";

const HKT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const QUICK_CREATE_CYCLE_PRIZE_LABEL = FIRST_CYCLE_GUIDANCE.prizeLabel;

export const DEFAULT_QUICK_CYCLE_DURATION_MS =
  MARKET_PULSE_FIRST_CYCLE_END_AT_MS - MARKET_PULSE_PUBLIC_LAUNCH_AT_MS;

export const QUICK_CREATE_CYCLE_STATUS: MarketPulseCycleStatus = "DRAFT";

export type QuickCreateCycleReference = {
  name: string;
  startsAt: Date;
  endsAt: Date;
  revealAt: Date;
};

export type QuickCreateCycleDefaults = {
  name: string;
  startsAt: Date;
  endsAt: Date;
  revealAt: Date;
  prizeLabel: string;
  status: MarketPulseCycleStatus;
};

const CYCLE_NUMBER_PATTERN = /\bcycle\s*0*(\d+)\b/i;

export function parseCycleNumberFromName(name: string): number | null {
  const match = name.trim().match(CYCLE_NUMBER_PATTERN);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatSequentialCycleName(sequence: number): string {
  return `Cycle ${String(sequence).padStart(2, "0")}`;
}

export function formatDateBasedCycleName(at: Date): string {
  const hktLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    month: "short",
    year: "numeric",
  }).format(at);
  return `Cycle ${hktLabel}`;
}

export function resolveNextQuickCycleName(existingNames: string[]): string {
  const normalizedExisting = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const parsedNumbers = existingNames
    .map(parseCycleNumberFromName)
    .filter((value): value is number => value !== null);

  let candidate =
    parsedNumbers.length > 0
      ? formatSequentialCycleName(Math.max(...parsedNumbers) + 1)
      : existingNames.length > 0
        ? formatSequentialCycleName(existingNames.length + 1)
        : formatSequentialCycleName(1);

  if (!normalizedExisting.has(candidate.toLowerCase())) {
    return candidate;
  }

  const numberedCandidate = parseCycleNumberFromName(candidate);
  if (numberedCandidate != null) {
    let next = numberedCandidate + 1;
    while (next < 1000) {
      candidate = formatSequentialCycleName(next);
      if (!normalizedExisting.has(candidate.toLowerCase())) {
        return candidate;
      }
      next += 1;
    }
  }

  let dateCandidate = formatDateBasedCycleName(new Date());
  let suffix = 2;
  while (normalizedExisting.has(dateCandidate.toLowerCase())) {
    dateCandidate = `${formatDateBasedCycleName(new Date())} (${suffix})`;
    suffix += 1;
  }
  return dateCandidate;
}

export function startOfHktCalendarDay(instant: Date): Date {
  const hktDayIndex = Math.floor((instant.getTime() + HKT_OFFSET_MS) / DAY_MS);
  return new Date(hktDayIndex * DAY_MS - HKT_OFFSET_MS);
}

export function addHktDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * DAY_MS);
}

export function nextHktMidnightOnOrAfter(instant: Date): Date {
  const dayStart = startOfHktCalendarDay(instant);
  if (instant.getTime() <= dayStart.getTime()) {
    return dayStart;
  }
  return addHktDays(dayStart, 1);
}

function cycleDurationMs(reference: QuickCreateCycleReference | null): number {
  if (!reference) {
    return DEFAULT_QUICK_CYCLE_DURATION_MS;
  }
  const duration = reference.endsAt.getTime() - reference.startsAt.getTime();
  return duration > 0 ? duration : DEFAULT_QUICK_CYCLE_DURATION_MS;
}

export function buildQuickCreateCycleDefaults(
  existingCycles: QuickCreateCycleReference[],
  now: Date = new Date(),
): QuickCreateCycleDefaults {
  const sortedByEnd = [...existingCycles].sort(
    (a, b) => b.endsAt.getTime() - a.endsAt.getTime(),
  );
  const latest = sortedByEnd[0] ?? null;
  const durationMs = cycleDurationMs(latest);

  const startsAt =
    latest != null
      ? new Date(latest.endsAt)
      : nextHktMidnightOnOrAfter(now);
  const endsAt = new Date(startsAt.getTime() + durationMs);
  const revealAt = new Date(endsAt);

  return {
    name: resolveNextQuickCycleName(existingCycles.map((cycle) => cycle.name)),
    startsAt,
    endsAt,
    revealAt,
    prizeLabel: QUICK_CREATE_CYCLE_PRIZE_LABEL,
    status: QUICK_CREATE_CYCLE_STATUS,
  };
}
