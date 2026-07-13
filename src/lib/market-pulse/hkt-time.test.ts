import { afterEach, describe, expect, it } from "vitest";

import {
  addHktCalendarDays,
  getHktCalendarDayIndex,
  guidedCycleEndAtFromDateOnly,
  guidedCycleRevealAtFromDateOnly,
  guidedCycleStartAtFromDateOnly,
  hktMidnightUtcFromCalendarDayIndex,
  hktReleaseAtUtcFromCalendarDayIndex,
  HKT_UTC_OFFSET_MS,
  MARKET_PULSE_CARD_RELEASE_HKT_HOUR,
  MARKET_PULSE_CARD_RELEASE_UTC_HOUR,
  MS_PER_DAY,
  MS_PER_HOUR,
  parseHktDatetimeLocal,
  startOfHktCalendarDay,
  toHktDatetimeLocalValue,
} from "@/lib/market-pulse/hkt-time";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

/** 1 Jul 2026 00:00 HKT = 2026-06-30T16:00:00.000Z */
const JUL_1_MIDNIGHT_HKT_UTC = new Date("2026-06-30T16:00:00.000Z");

describe("HKT fixed UTC+8 math", () => {
  it("uses a constant +8 hour offset with no DST", () => {
    expect(HKT_UTC_OFFSET_MS).toBe(8 * MS_PER_HOUR);
    expect(MARKET_PULSE_CARD_RELEASE_HKT_HOUR).toBe(9);
    expect(MARKET_PULSE_CARD_RELEASE_UTC_HOUR).toBe(1);
  });

  it("maps 2026-06-30T16:00:00.000Z to the 2026-07-01 HKT calendar day", () => {
    expect(startOfHktCalendarDay(JUL_1_MIDNIGHT_HKT_UTC).toISOString()).toBe(
      "2026-06-30T16:00:00.000Z",
    );
  });

  it("converts 09:00 HKT to 01:00 UTC on the same HKT calendar date", () => {
    const hktDay = getHktCalendarDayIndex(JUL_1_MIDNIGHT_HKT_UTC);
    expect(hktReleaseAtUtcFromCalendarDayIndex(hktDay).toISOString()).toBe(
      "2026-07-01T01:00:00.000Z",
    );
  });

  it("advances HKT calendar days by whole 24h UTC steps", () => {
    const day2Midnight = addHktCalendarDays(JUL_1_MIDNIGHT_HKT_UTC, 1);
    expect(day2Midnight.toISOString()).toBe("2026-07-01T16:00:00.000Z");

    const day2Release = hktReleaseAtUtcFromCalendarDayIndex(
      getHktCalendarDayIndex(day2Midnight),
    );
    expect(day2Release.toISOString()).toBe("2026-07-02T01:00:00.000Z");
  });

  it("builds midnight UTC from HKT day index without locale parsing", () => {
    const dayIndex = getHktCalendarDayIndex(JUL_1_MIDNIGHT_HKT_UTC);
    expect(hktMidnightUtcFromCalendarDayIndex(dayIndex).toISOString()).toBe(
      "2026-06-30T16:00:00.000Z",
    );
    expect(hktMidnightUtcFromCalendarDayIndex(dayIndex + 9).toISOString()).toBe(
      "2026-07-09T16:00:00.000Z",
    );
  });

  it("is independent of process TZ environment variable", () => {
    const originalTz = process.env.TZ;
    const compute = () =>
      hktReleaseAtUtcFromCalendarDayIndex(
        getHktCalendarDayIndex(JUL_1_MIDNIGHT_HKT_UTC),
      ).toISOString();

    try {
      process.env.TZ = "America/Los_Angeles";
      expect(compute()).toBe("2026-07-01T01:00:00.000Z");
      process.env.TZ = "Pacific/Kiritimati";
      expect(compute()).toBe("2026-07-01T01:00:00.000Z");
      process.env.TZ = "UTC";
      expect(compute()).toBe("2026-07-01T01:00:00.000Z");
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });
});

describe("HKT day index consistency", () => {
  afterEach(() => {
    // no-op — keep describe block structure for future hooks
  });

  it("counts whole MS_PER_DAY steps from epoch with +8h shift", () => {
    const instant = new Date("2026-07-10T04:30:00.000Z");
    const dayIndex = getHktCalendarDayIndex(instant);
    const midnight = hktMidnightUtcFromCalendarDayIndex(dayIndex);
    expect(instant.getTime() - midnight.getTime()).toBeLessThan(MS_PER_DAY);
    expect(hktReleaseAtUtcFromCalendarDayIndex(dayIndex).toISOString()).toBe(
      "2026-07-10T01:00:00.000Z",
    );
  });
});

describe("HKT datetime-local admin helpers", () => {
  it("round-trips July 1 2026 00:00 HKT regardless of process TZ", () => {
    const originalTz = process.env.TZ;
    const iso = MARKET_PULSE_PUBLIC_LAUNCH_AT.toISOString();

    try {
      process.env.TZ = "UTC";
      const local = toHktDatetimeLocalValue(iso);
      expect(local).toBe("2026-07-01T00:00");
      expect(parseHktDatetimeLocal(local)?.toISOString()).toBe(iso);

      process.env.TZ = "America/Los_Angeles";
      expect(toHktDatetimeLocalValue(iso)).toBe("2026-07-01T00:00");
      expect(parseHktDatetimeLocal("2026-07-01T00:00")?.toISOString()).toBe(iso);
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });

  it("parses admin datetime-local strings as HKT wall clock", () => {
    expect(parseHktDatetimeLocal("2026-07-01T16:00")?.toISOString()).toBe(
      "2026-07-01T08:00:00.000Z",
    );
  });
});

describe("HKT date-only guided cycle helpers", () => {
  it("converts guided start date to 09:00 HKT (01:00 UTC)", () => {
    expect(guidedCycleStartAtFromDateOnly("2026-08-01")?.toISOString()).toBe(
      "2026-08-01T01:00:00.000Z",
    );
  });

  it("converts guided end date to 21:00 HKT (13:00 UTC)", () => {
    expect(guidedCycleEndAtFromDateOnly("2026-08-10")?.toISOString()).toBe(
      "2026-08-10T13:00:00.000Z",
    );
  });

  it("converts guided reveal date to 09:00 HKT (01:00 UTC)", () => {
    expect(guidedCycleRevealAtFromDateOnly("2026-08-11")?.toISOString()).toBe(
      "2026-08-11T01:00:00.000Z",
    );
  });
});
