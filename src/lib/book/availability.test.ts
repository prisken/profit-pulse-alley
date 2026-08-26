import { describe, expect, it } from "vitest";

import {
  BUFFER_MINUTES,
  SESSION_MINUTES,
  generateCandidateSlots,
  getWeekOptions,
  hktDayOfWeek,
  pickThreeSlots,
  type CandidateSlot,
} from "@/lib/book/availability";

/** 2026-08-17 is a Monday. */
const MON_2026_08_17 = "2026-08-17";

function hkt(y: number, mo: number, d: number, h: number, mi: number): Date {
  // wall clock HKT -> UTC (UTC+8 fixed)
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600 * 1000);
}

describe("hktDayOfWeek", () => {
  it("maps known days", () => {
    expect(hktDayOfWeek(20682)).toBe(1); // 2026-08-17 = Monday
    expect(hktDayOfWeek(20683)).toBe(2); // Tue
    expect(hktDayOfWeek(20688)).toBe(0); // 2026-08-23 = Sunday
  });
});

describe("getWeekOptions", () => {
  it("before Wed 12:00 offers current + next + week after", () => {
    const now = hkt(2026, 8, 19, 10, 0); // Wed 10:00
    const opts = getWeekOptions(now);
    expect(opts.map((o) => o.key)).toEqual(["2026-08-17", "2026-08-24", "2026-08-31"]);
    expect(opts[0].label.en).toMatch(/17 Aug/);
  });

  it("Monday 00:00 still offers current + next + week after", () => {
    const now = hkt(2026, 8, 17, 0, 30); // Mon 00:30
    const opts = getWeekOptions(now);
    expect(opts.map((o) => o.key)).toEqual(["2026-08-17", "2026-08-24", "2026-08-31"]);
  });

  it("at Wed 12:00 exactly switches to next + week after + week after that", () => {
    const now = hkt(2026, 8, 19, 12, 0); // Wed 12:00
    const opts = getWeekOptions(now);
    expect(opts.map((o) => o.key)).toEqual(["2026-08-24", "2026-08-31", "2026-09-07"]);
  });

  it("Saturday offers next + week after + week after that", () => {
    const now = hkt(2026, 8, 22, 15, 0); // Sat
    const opts = getWeekOptions(now);
    expect(opts.map((o) => o.key)).toEqual(["2026-08-24", "2026-08-31", "2026-09-07"]);
  });

  it("next Monday 09:00 rolls forward to that week + following + next", () => {
    const now = hkt(2026, 8, 24, 9, 0); // next Mon
    const opts = getWeekOptions(now);
    expect(opts.map((o) => o.key)).toEqual(["2026-08-24", "2026-08-31", "2026-09-07"]);
  });
});

describe("generateCandidateSlots", () => {
  const now = hkt(2026, 8, 19, 10, 0); // Wed 10:00 HKT
  const base = { mondayKey: MON_2026_08_17, now, busy: [] as { start: Date; end: Date }[] };

  it("weekday office: Mon–Fri 10:00–17:00 starts, none on weekend", () => {
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    const days = new Set(
      slots.map((s) => s.start.toISOString().slice(0, 10)),
    );
    // now = Wed 10:00 + 2h lead -> Mon/Tue/Wed-before-noon all past
    expect(days.has("2026-08-17")).toBe(false);
    expect(days.has("2026-08-20")).toBe(true); // Thu
    expect(days.has("2026-08-21")).toBe(true); // Fri
    expect(days.has("2026-08-22")).toBe(false);
    expect(days.has("2026-08-23")).toBe(false);
    expect(slots.length).toBeGreaterThan(10);
  });

  it("excludes past slots (Wed 10:00 -> no 10:00/10:30 today)", () => {
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    const today = slots.filter((s) => s.start.toISOString().slice(0, 10) === "2026-08-19");
    expect(today.length).toBeGreaterThan(0);
    const earliestToday = Math.min(...today.map((s) => s.start.getTime()));
    expect(earliestToday).toBeGreaterThanOrEqual(now.getTime() + 120 * 60 * 1000);
  });

  it("weekend only Sat/Sun 10:00–12:00 starts (12:00 ends exactly at 13:00)", () => {
    const slots = generateCandidateSlots({ ...base, dayPref: "weekend", timePref: "office" });
    // Sat + Sun x (10:00,10:30,11:00,11:30,12:00) = 10
    expect(slots.length).toBe(10);
  });

  it("busy intervals remove overlapping slots (with buffer)", () => {
    const busy = [{ start: hkt(2026, 8, 20, 10, 0), end: hkt(2026, 8, 20, 11, 0) }]; // Thu 10:00-11:00
    const slots = generateCandidateSlots({
      ...base,
      dayPref: "weekday",
      timePref: "office",
      busy,
    });
    const thu = slots.filter((s) => s.start.toISOString().slice(0, 10) === "2026-08-20");
    const starts = thu.map((s) => s.start.getTime());
    // 10:00 would be (9:45..11:15 with buffer) overlapping -> excluded;
    // 10:30 start = 10:15..11:45 buffer -> still overlaps 10:00-11:00 busy? 10:15 < 11:00 -> yes excluded
    for (const t of starts) {
      const startHkt = new Date(t + 8 * 3600 * 1000);
      const h = startHkt.getUTCHours();
      expect(h).toBeGreaterThanOrEqual(11);
    }
  });

  it("after-office: Mon–Fri 18:30–20:00 starts", () => {
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "after_office" });
    const starts = slots.map((s) => new Date(s.start.getTime() + 8 * 3600 * 1000).getUTCHours());
    expect(starts.every((h) => h >= 18)).toBe(true);
    expect(slots.length).toBeGreaterThan(10);
  });

  it("weekend after-office: Sat/Sun 18:30–20:00 starts", () => {
    const slots = generateCandidateSlots({ ...base, dayPref: "weekend", timePref: "after_office" });
    // Sat + Sun x (18:30,19:00,19:30,20:00) = 8
    expect(slots.length).toBe(8);
    const starts = slots.map((s) => new Date(s.start.getTime() + 8 * 3600 * 1000).getUTCHours());
    expect(starts.every((h) => h >= 18)).toBe(true);
  });
});

describe("pickThreeSlots", () => {
  it("returns 3 slots from 3 distinct days, earliest each", () => {
    const base = { mondayKey: MON_2026_08_17, now: hkt(2026, 8, 17, 0, 0), busy: [] as { start: Date; end: Date }[] };
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    const chosen = pickThreeSlots(slots);
    expect(chosen.length).toBe(3);
    const days = new Set(chosen.map((s) => s.start.toISOString().slice(0, 10)));
    expect(days.size).toBe(3);
    // first slot of the first available day should be 10:00 HKT
    const first = chosen[0];
    const firstHkt = new Date(first.start.getTime() + 8 * 3600 * 1000);
    expect(firstHkt.getUTCHours()).toBe(10);
    expect(firstHkt.getUTCMinutes()).toBe(0);
  });

  it("returns fewer when fewer days available", () => {
    const chosen = pickThreeSlots([]);
    expect(chosen.length).toBe(0);
  });

  it("variant 1 pages to the NEXT 3 days (different dates, not just times)", () => {
    const base = { mondayKey: MON_2026_08_17, now: hkt(2026, 8, 17, 0, 0), busy: [] as { start: Date; end: Date }[] };
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    const v0 = pickThreeSlots(slots, 0);
    const v1 = pickThreeSlots(slots, 1);
    // Mon–Fri week: page 0 = Mon/Tue/Wed, page 1 = Thu/Fri (+ fill)
    const dayOf = (s: CandidateSlot) => s.start.toISOString().slice(0, 10);
    expect(v0.map(dayOf)).toEqual(["2026-08-17", "2026-08-18", "2026-08-19"]);
    expect(v1.map(dayOf).slice(0, 2)).toEqual(["2026-08-20", "2026-08-21"]);
  });

  it("pages cycle back through days with later times (loop never dead)", () => {
    const base = { mondayKey: MON_2026_08_17, now: hkt(2026, 8, 17, 0, 0), busy: [] as { start: Date; end: Date }[] };
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    // 5 weekdays -> 2 pages per pass. variant 2 = second pass, page 0:
    // Mon/Tue/Wed at the SECOND time of each day (10:30 HKT).
    const v2 = pickThreeSlots(slots, 2);
    expect(v2.length).toBe(3);
    const hktWall = (d: Date) => new Date(d.getTime() + 8 * 3600 * 1000);
    expect(hktWall(v2[0]!.start).getUTCHours()).toBe(10);
    expect(hktWall(v2[0]!.start).getUTCMinutes()).toBe(30);
  });

  it("very high variant returns empty (all slots exhausted)", () => {
    const base = { mondayKey: MON_2026_08_17, now: hkt(2026, 8, 17, 0, 0), busy: [] as { start: Date; end: Date }[] };
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    // 14 slots/day; variant 100 -> pass 50 -> beyond every day's slots
    expect(pickThreeSlots(slots, 100).length).toBe(0);
  });

  it("sessions are SESSION_MINUTES long", () => {
    const base = { mondayKey: MON_2026_08_17, now: hkt(2026, 8, 17, 9, 0), busy: [] as { start: Date; end: Date }[] };
    const slots = generateCandidateSlots({ ...base, dayPref: "weekday", timePref: "office" });
    for (const s of slots) {
      expect(s.end.getTime() - s.start.getTime()).toBe(SESSION_MINUTES * 60 * 1000);
    }
    void BUFFER_MINUTES;
  });
});
