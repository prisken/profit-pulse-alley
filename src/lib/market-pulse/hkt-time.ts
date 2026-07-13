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

const HKT_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const HKT_DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export type HktDateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

/** Parse `YYYY-MM-DD` admin date-only input (HKT calendar date, no time). */
export function parseHktDateOnly(value: string): HktDateOnlyParts | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(HKT_DATE_ONLY_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

/** Canonical `YYYY-MM-DD` key for an HKT calendar date string. */
export function hktDateOnlyDayKey(value: string): string | null {
  const parts = parseHktDateOnly(value);
  if (!parts) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * Convert an HKT calendar date + wall-clock hour to a UTC instant.
 * Fixed UTC+8 — independent of server or browser timezone.
 */
export function hktDateOnlyToUtcInstant(value: string, hour: number): Date | null {
  const parts = parseHktDateOnly(value);
  if (!parts || hour < 0 || hour > 23) {
    return null;
  }

  const hktWallClockUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    0,
    0,
    0,
  );
  return new Date(hktWallClockUtcMs - HKT_UTC_OFFSET_MS);
}

/** Guided cycle start: 09:00 HKT on the start date. */
export function guidedCycleStartAtFromDateOnly(value: string): Date | null {
  return hktDateOnlyToUtcInstant(value, MARKET_PULSE_CARD_RELEASE_HKT_HOUR);
}

/** Guided cycle end: 21:00 HKT on the end date. */
export function guidedCycleEndAtFromDateOnly(value: string): Date | null {
  return hktDateOnlyToUtcInstant(value, 21);
}

/** Guided cycle reveal: 09:00 HKT on the reveal date. */
export function guidedCycleRevealAtFromDateOnly(value: string): Date | null {
  return hktDateOnlyToUtcInstant(value, MARKET_PULSE_CARD_RELEASE_HKT_HOUR);
}

/** Format a UTC instant as `YYYY-MM-DD` in the HKT calendar. */
export function formatHktDateOnlyFromUtcInstant(instant: Date): string {
  const hktMs = instant.getTime() + HKT_UTC_OFFSET_MS;
  const hkt = new Date(hktMs);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${hkt.getUTCFullYear()}-${pad(hkt.getUTCMonth() + 1)}-${pad(hkt.getUTCDate())}`;
}

/** Advance an HKT calendar date string by whole days. */
export function addHktDateOnlyDays(value: string, days: number): string | null {
  const midnight = hktDateOnlyToUtcInstant(value, 0);
  if (!midnight) {
    return null;
  }

  return formatHktDateOnlyFromUtcInstant(addHktCalendarDays(midnight, days));
}

/** Compare two HKT date-only strings. Returns null when either is invalid. */
export function compareHktDateOnly(a: string, b: string): number | null {
  const keyA = hktDateOnlyDayKey(a);
  const keyB = hktDateOnlyDayKey(b);
  if (!keyA || !keyB) {
    return null;
  }
  return keyA.localeCompare(keyB);
}

/**
 * Parse an HTML datetime-local value as HKT wall-clock time → UTC instant.
 * Independent of server or browser local timezone.
 */
export function parseHktDatetimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(HKT_DATETIME_LOCAL_PATTERN);
  if (!match) {
    const legacy = new Date(trimmed);
    return Number.isNaN(legacy.getTime()) ? null : legacy;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  if (
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const hktWallClockUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  return new Date(hktWallClockUtcMs - HKT_UTC_OFFSET_MS);
}

/** Format a UTC instant for an HTML datetime-local input (HKT wall-clock). */
export function toHktDatetimeLocalValue(iso: string): string {
  const utcMs = new Date(iso).getTime();
  if (Number.isNaN(utcMs)) {
    return "";
  }

  const hktMs = utcMs + HKT_UTC_OFFSET_MS;
  const hkt = new Date(hktMs);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${hkt.getUTCFullYear()}-${pad(hkt.getUTCMonth() + 1)}-${pad(hkt.getUTCDate())}T${pad(hkt.getUTCHours())}:${pad(hkt.getUTCMinutes())}`;
}
