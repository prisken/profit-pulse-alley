/**
 * Booking availability core — pure logic, no I/O.
 *
 * Model:
 * - Weeks are Mon–Sun, labeled by their Monday ("Week of 17 Aug").
 * - Week options follow the rule (three weeks offered):
 *   [Mon 00:00 HKT, Wed 12:00 HKT)  -> current + next + week after
 *   [Wed 12:00 HKT, next Mon 12:00) -> next + week after + week after that
 * - Sessions are 60 minutes; slots are generated from availability windows,
 *   aligned to :00/:30, minus past times, minus Google Calendar busy blocks
 *   (with a configurable buffer).
 * - The UI asks for 3 slots from 3 different days — see pickThreeSlots.
 *
 * HKT = UTC+8 fixed (no DST). Never use server/browser local time.
 */
import {
  HKT_UTC_OFFSET_MS,
  MS_PER_DAY,
  MS_PER_HOUR,
  addHktCalendarDays,
  formatHktDateOnlyFromUtcInstant,
  getHktCalendarDayIndex,
  hktMidnightUtcFromCalendarDayIndex,
} from "@/lib/market-pulse/hkt-time";

export const BOOK_TZ_LABEL = "Asia/Hong_Kong";
export const SESSION_MINUTES = 60;
export const BUFFER_MINUTES = 15;
export const SLOT_STEP_MINUTES = 30;
/** Earliest a slot may start: now + lead (blocks same-minute chaos). */
export const MIN_LEAD_MINUTES = 120;
export const WEEK_CUTOFF_HKT_HOUR = 12; // Wed 12:00 HKT boundary
export const WEEK_CUTOFF_DAY_OFFSET = 2; // Wednesday = Monday + 2

export type DayPref = "weekday" | "weekend";
export type TimePref = "office" | "after_office";

export type WeekOption = {
  key: string; // "2026-08-17" (Monday, HKT)
  label: { en: string; zhHant: string };
  startIso: string;
  endIso: string;
};

export type TimeWindow = {
  dayType: DayPref;
  timePref: TimePref;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

/**
 * Prisken's availability windows (defaults — edit freely).
 * Windows are inclusive of start, exclusive of end.
 */
export const AVAILABILITY_WINDOWS: TimeWindow[] = [
  { dayType: "weekday", timePref: "office", startHour: 10, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayType: "weekday", timePref: "after_office", startHour: 18, startMinute: 30, endHour: 21, endMinute: 0 },
  { dayType: "weekend", timePref: "office", startHour: 10, startMinute: 0, endHour: 13, endMinute: 0 },
  { dayType: "weekend", timePref: "after_office", startHour: 18, startMinute: 30, endHour: 21, endMinute: 0 },
];

export type BusyInterval = { start: Date; end: Date };

/** Day of week (0=Sun, 1=Mon … 6=Sat) for an HKT calendar day index. */
export function hktDayOfWeek(dayIndex: number): number {
  // 1970-01-01 (dayIndex 0) was a Thursday (4).
  return ((dayIndex + 4) % 7 + 7) % 7;
}

/** HKT day index of the Monday of the week containing `now`. */
export function hktMondayIndex(now: Date): number {
  const dayIndex = getHktCalendarDayIndex(now);
  const dow = hktDayOfWeek(dayIndex);
  return dayIndex - ((dow + 6) % 7); // days since Monday
}

/** UTC instant for 12:00 HKT on the Wednesday of the Monday-start week. */
export function hktWeekCutoff(mondayIndex: number): Date {
  const wednesdayIndex = mondayIndex + WEEK_CUTOFF_DAY_OFFSET;
  return new Date(
    hktMidnightUtcFromCalendarDayIndex(wednesdayIndex).getTime() +
      WEEK_CUTOFF_HKT_HOUR * MS_PER_HOUR,
  );
}

/**
 * HKT wall-clock date parts for a UTC instant, using numeric month/day so we
 * can compose CJK dates explicitly ("8月24日") instead of relying on Intl's
 * zh-Hant month "short" rendering (which can come back as bare "8").
 */
function hktCalendarParts(date: Date, locale: "en" | "zh-Hant") {
  const formatter = new Intl.DateTimeFormat(
    locale === "zh-Hant" ? "zh-Hant-HK" : "en-GB",
    {
      timeZone: BOOK_TZ_LABEL,
      year: "numeric",
      month: locale === "zh-Hant" ? "numeric" : "short",
      day: "numeric",
      weekday: "short",
    },
  );
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    weekday: value("weekday"),
  };
}

/** "24 Aug" (en) / "8月24日" (zh-Hant). */
export function hktDateLabel(date: Date, locale: "en" | "zh-Hant"): string {
  const p = hktCalendarParts(date, locale);
  return locale === "zh-Hant" ? `${p.month}月${p.day}日` : `${p.day} ${p.month}`;
}

/** "Sat 24 Aug" (en) / "8月24日（週六）" (zh-Hant). */
export function hktDateLabelWithWeekday(
  date: Date,
  locale: "en" | "zh-Hant",
): string {
  const p = hktCalendarParts(date, locale);
  return locale === "zh-Hant"
    ? `${p.month}月${p.day}日（${p.weekday}）`
    : `${p.weekday} ${p.day} ${p.month}`;
}

/** Week range, e.g. "17 Aug – 24 Aug 2026" / "2026年8月17日 – 8月24日". */
export function weekRangeLabel(
  week: Pick<WeekOption, "startIso" | "endIso">,
  locale: "en" | "zh-Hant",
): string {
  const start = new Date(week.startIso);
  const end = new Date(week.endIso);
  if (locale === "zh-Hant") {
    const s = hktCalendarParts(start, "zh-Hant");
    const e = hktCalendarParts(end, "zh-Hant");
    return s.year === e.year
      ? `${s.year}年${s.month}月${s.day}日 – ${e.month}月${e.day}日`
      : `${s.year}年${s.month}月${s.day}日 – ${e.year}年${e.month}月${e.day}日`;
  }
  const s = hktCalendarParts(start, "en");
  const e = hktCalendarParts(end, "en");
  return s.year === e.year
    ? `${s.day} ${s.month} – ${e.day} ${e.month} ${e.year}`
    : `${s.day} ${s.month} ${s.year} – ${e.day} ${e.month} ${e.year}`;
}

function weekLabel(mondayIndex: number, locale: "en" | "zh-Hant"): string {
  const monday = hktMidnightUtcFromCalendarDayIndex(mondayIndex);
  const p = hktCalendarParts(monday, locale);
  // Date only — the UI template adds "Week of " / " 當週" around it.
  return locale === "zh-Hant" ? `${p.month}月${p.day}日` : `${p.day} ${p.month}`;
}

function toWeekOption(mondayIndex: number): WeekOption {
  const monday = hktMidnightUtcFromCalendarDayIndex(mondayIndex);
  const nextMonday = addHktCalendarDays(monday, 7);
  return {
    key: formatHktDateOnlyFromUtcInstant(monday),
    label: { en: weekLabel(mondayIndex, "en"), zhHant: weekLabel(mondayIndex, "zh-Hant") },
    startIso: monday.toISOString(),
    endIso: nextMonday.toISOString(),
  };
}

/**
 * The three bookable weeks per the rule:
 * before Wed 12:00 HKT -> current + next + week after;
 * after -> next + week after + week after that.
 */
export function getWeekOptions(now: Date): WeekOption[] {
  const mondayIndex = hktMondayIndex(now);
  const cutoff = hktWeekCutoff(mondayIndex);
  const afterCutoff = now.getTime() >= cutoff.getTime();
  const first = afterCutoff ? mondayIndex + 7 : mondayIndex;
  return [toWeekOption(first), toWeekOption(first + 7), toWeekOption(first + 14)];
}

export function isWeekday(dow: number): boolean {
  return dow >= 1 && dow <= 5;
}

export type CandidateSlot = { start: Date; end: Date };

/** UTC instant for wall-clock start on an HKT calendar day. */
function hktWallClockUtc(dayIndex: number, hour: number, minute: number): Date {
  const midnight = hktMidnightUtcFromCalendarDayIndex(dayIndex);
  return new Date(midnight.getTime() + (hour * 60 + minute) * 60 * 1000);
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * All candidate slots for a chosen week + preferences, filtered by:
 * - past times (now + MIN_LEAD)
 * - Google Calendar busy intervals (with BUFFER_MINUTES on each side)
 */
export function generateCandidateSlots(opts: {
  mondayKey: string; // "2026-08-17"
  dayPref: DayPref;
  timePref: TimePref;
  now: Date;
  busy: BusyInterval[];
}): CandidateSlot[] {
  const { dayPref, timePref, now, busy } = opts;
  const mondayUtc = new Date(opts.mondayKey + "T00:00:00.000Z");
  const mondayIndex = getHktCalendarDayIndex(mondayUtc);
  const minStartMs = now.getTime() + MIN_LEAD_MINUTES * 60 * 1000;
  const sessionMs = SESSION_MINUTES * 60 * 1000;
  const bufferMs = BUFFER_MINUTES * 60 * 1000;

  const windows = AVAILABILITY_WINDOWS.filter(
    (w) => w.dayType === dayPref && w.timePref === timePref,
  );
  if (windows.length === 0) {
    return [];
  }

  const slots: CandidateSlot[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = mondayIndex + offset;
    const dow = hktDayOfWeek(dayIndex);
    const matchesDay =
      dayPref === "weekday" ? isWeekday(dow) : dow === 0 || dow === 6;
    if (!matchesDay) {
      continue;
    }

    for (const win of windows) {
      const windowStartMs = hktWallClockUtc(
        dayIndex,
        win.startHour,
        win.startMinute,
      ).getTime();
      const windowEndMs = hktWallClockUtc(
        dayIndex,
        win.endHour,
        win.endMinute,
      ).getTime();

      for (
        let t = windowStartMs;
        t + sessionMs <= windowEndMs;
        t += SLOT_STEP_MINUTES * 60 * 1000
      ) {
        const start = new Date(t);
        const end = new Date(t + sessionMs);
        if (start.getTime() < minStartMs) {
          continue;
        }
        const busyStart = new Date(t - bufferMs);
        const busyEnd = new Date(t + sessionMs + bufferMs);
        const overlaps = busy.some((b) =>
          intervalsOverlap(busyStart, busyEnd, b.start, b.end),
        );
        if (overlaps) {
          continue;
        }
        slots.push({ start, end });
      }
    }
  }
  return slots;
}

/**
 * Pick up to 3 slots for a "page" of options. `variant` is the page index.
 *
 * Pages first walk through DIFFERENT days (3 per page), so "show more options"
 * surfaces genuinely new dates; when the days are exhausted it cycles back
 * through the same days offering later times. When every slot of every day
 * has been shown, it returns [] — the caller loops back to variant 0.
 *
 * If a page has fewer than 3 distinct days (e.g. weekend: only 2 days), the
 * remaining slots come from the next time on those days, so a page always
 * offers up to 3 clickable choices.
 */
export function pickThreeSlots(slots: CandidateSlot[], variant = 0): CandidateSlot[] {
  const byDay = new Map<string, CandidateSlot[]>();
  for (const slot of slots) {
    const key = formatHktDateOnlyFromUtcInstant(slot.start);
    const list = byDay.get(key);
    if (list) {
      list.push(slot);
    } else {
      byDay.set(key, [slot]);
    }
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  const days = [...byDay.keys()].sort();
  if (days.length === 0) {
    return [];
  }

  const pagesPerPass = Math.max(1, Math.ceil(days.length / 3));
  const pass = Math.floor(variant / pagesPerPass);
  const pageInPass = variant % pagesPerPass;
  const pageDays = days.slice(pageInPass * 3, pageInPass * 3 + 3);
  if (pageDays.length === 0) {
    return [];
  }

  const chosen: CandidateSlot[] = [];
  // Primary: earliest slot of each day on this page.
  for (const day of pageDays) {
    const slot = byDay.get(day)?.[pass];
    if (slot) {
      chosen.push(slot);
    }
  }
  // Fill: if the page has fewer than 3 distinct days, add the next time on
  // those days so the page is never short of choices.
  if (chosen.length < 3) {
    for (const day of pageDays) {
      if (chosen.length >= 3) {
        break;
      }
      const daySlots = byDay.get(day) ?? [];
      const extra = daySlots[pass + 1];
      if (extra && !chosen.some((c) => c.start.getTime() === extra.start.getTime())) {
        chosen.push(extra);
      }
    }
  }
  return chosen;
}

/** Human labels for a slot, HKT wall clock. */
export function slotLabels(slot: CandidateSlot, locale: "en" | "zh-Hant"): {
  dayLabel: string;
  timeLabel: string;
} {
  const fmtTime = new Intl.DateTimeFormat(
    locale === "zh-Hant" ? "zh-Hant-HK" : "en-GB",
    {
      timeZone: BOOK_TZ_LABEL,
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    },
  );
  return {
    dayLabel: hktDateLabelWithWeekday(slot.start, locale),
    timeLabel: `${fmtTime.format(slot.start)} – ${fmtTime.format(slot.end)}`,
  };
}
