/**
 * Hong Kong Time (HKT) — fixed UTC+8, no daylight saving.
 *
 * All Market Pulse scheduling uses UTC epoch math plus a constant +8 hour shift
 * to identify HKT calendar days. Never use server local timezone, browser
 * timezone, or `new Date(year, month, day, 9, 0, 0)`.
 *
 * Conversion rule: 09:00 HKT on HKT calendar date D equals 01:00 UTC on D.
 * Example: 2026-07-01 09:00 HKT = 2026-07-01T01:00:00.000Z
 */

export const HKT_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Standard Market Pulse card release hour in HKT (fixed). */
export const MARKET_PULSE_CARD_RELEASE_HKT_HOUR = 9;

/** 09:00 HKT is 01:00 UTC on the same HKT calendar date (UTC+8, no DST). */
export const MARKET_PULSE_CARD_RELEASE_UTC_HOUR = 1;

/** HKT calendar day index since Unix epoch for any UTC instant. */
export function getHktCalendarDayIndex(utcInstant: Date): number {
  return Math.floor((utcInstant.getTime() + HKT_UTC_OFFSET_MS) / MS_PER_DAY);
}

/** UTC instant for 00:00:00.000 HKT on the given HKT calendar day index. */
export function hktMidnightUtcFromCalendarDayIndex(hktDayIndex: number): Date {
  return new Date(hktDayIndex * MS_PER_DAY - HKT_UTC_OFFSET_MS);
}

/** UTC instant for 00:00:00.000 HKT on the calendar day containing `utcInstant`. */
export function startOfHktCalendarDay(utcInstant: Date): Date {
  return hktMidnightUtcFromCalendarDayIndex(getHktCalendarDayIndex(utcInstant));
}

/** Advance a UTC instant by whole HKT calendar days (86_400_000 ms each). */
export function addHktCalendarDays(utcInstant: Date, days: number): Date {
  return new Date(utcInstant.getTime() + days * MS_PER_DAY);
}

/** @deprecated Prefer {@link addHktCalendarDays}. */
export function addHktDays(instant: Date, days: number): Date {
  return addHktCalendarDays(instant, days);
}

/** UTC instant for 09:00 HKT on the given HKT calendar day index. */
export function hktReleaseAtUtcFromCalendarDayIndex(hktDayIndex: number): Date {
  return new Date(
    hktMidnightUtcFromCalendarDayIndex(hktDayIndex).getTime() +
      MARKET_PULSE_CARD_RELEASE_HKT_HOUR * MS_PER_HOUR,
  );
}
