import { afterEach, describe, expect, it } from "vitest";

import {
  getCycleDayForDate,
  getCycleDayReleaseAt,
  getEffectiveCardReleaseAt,
  hasDerivedCycleDayReleasePassed,
  hasLegacyPublishedAtGatePassed,
  isCardReleasedForPlay,
  isCardWithinRevealWindow,
} from "@/lib/market-pulse/card-release-schedule";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

/** Cycle start: 2026-07-01 00:00 HKT = 2026-06-30T16:00:00.000Z */
const CYCLE_START = MARKET_PULSE_PUBLIC_LAUNCH_AT;
const DAY_1_RELEASE_UTC = "2026-07-01T01:00:00.000Z";
const DAY_2_RELEASE_UTC = "2026-07-02T01:00:00.000Z";
const DAY_10_RELEASE_UTC = "2026-07-10T01:00:00.000Z";
const CYCLE_REVEAL = new Date("2026-07-10T16:00:00.000Z");

function card(overrides: Partial<ReturnType<typeof buildMarketPulseTestCard>> = {}) {
  return buildMarketPulseTestCard({
    dayIndex: 1,
    status: "PUBLISHED",
    publishedAt: null,
    revealAt: null,
    ...overrides,
  });
}

describe("getCycleDayReleaseAt — explicit UTC instants", () => {
  it("maps cycle 2026-06-30T16:00:00.000Z to Day 1 release 2026-07-01T01:00:00.000Z", () => {
    expect(CYCLE_START.toISOString()).toBe("2026-06-30T16:00:00.000Z");
    expect(getCycleDayReleaseAt(CYCLE_START, 1).toISOString()).toBe(DAY_1_RELEASE_UTC);
  });

  it("releases Day 2 at 2026-07-02T01:00:00.000Z", () => {
    expect(getCycleDayReleaseAt(CYCLE_START, 2).toISOString()).toBe(DAY_2_RELEASE_UTC);
  });

  it("releases Day 10 at 2026-07-10T01:00:00.000Z", () => {
    expect(getCycleDayReleaseAt(CYCLE_START, 10).toISOString()).toBe(DAY_10_RELEASE_UTC);
  });

  it("does not depend on server process timezone", () => {
    const originalTz = process.env.TZ;
    const day1 = () => getCycleDayReleaseAt(CYCLE_START, 1).toISOString();
    const day2 = () => getCycleDayReleaseAt(CYCLE_START, 2).toISOString();

    try {
      process.env.TZ = "America/New_York";
      expect(day1()).toBe(DAY_1_RELEASE_UTC);
      expect(day2()).toBe(DAY_2_RELEASE_UTC);
      process.env.TZ = "Asia/Tokyo";
      expect(day1()).toBe(DAY_1_RELEASE_UTC);
      expect(day2()).toBe(DAY_2_RELEASE_UTC);
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });
});

describe("isCardReleasedForPlay", () => {
  const cycle = { startsAt: CYCLE_START };

  it("is not playable before 2026-07-01T01:00:00.000Z", () => {
    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: null }),
        cycle,
        new Date("2026-07-01T00:59:59.999Z"),
      ),
    ).toBe(false);
  });

  it("is playable exactly at 2026-07-01T01:00:00.000Z when publishedAt is null", () => {
    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: null }),
        cycle,
        new Date(DAY_1_RELEASE_UTC),
      ),
    ).toBe(true);
  });

  it("is playable exactly at release when publishedAt is in the past", () => {
    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: new Date("2026-01-01T00:00:00.000Z") }),
        cycle,
        new Date(DAY_1_RELEASE_UTC),
      ),
    ).toBe(true);
  });

  it("is not playable after derived release when publishedAt is in the future", () => {
    const futurePublishedAt = new Date("2026-07-01T03:00:00.000Z");

    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: futurePublishedAt }),
        cycle,
        new Date("2026-07-01T02:00:00.000Z"),
      ),
    ).toBe(false);

    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: futurePublishedAt }),
        cycle,
        futurePublishedAt,
      ),
    ).toBe(true);
  });

  it("does not go live early when only legacy publishedAt is in the past", () => {
    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, publishedAt: CYCLE_START }),
        cycle,
        new Date("2026-06-30T23:59:59.999Z"),
      ),
    ).toBe(false);
  });

  it("requires PUBLISHED status", () => {
    expect(
      isCardReleasedForPlay(
        card({ dayIndex: 1, status: "DRAFT" }),
        cycle,
        new Date(DAY_1_RELEASE_UTC),
      ),
    ).toBe(false);
  });
});

describe("hasDerivedCycleDayReleasePassed", () => {
  it("is false before and true at the UTC release instant", () => {
    const releaseAt = new Date(DAY_1_RELEASE_UTC);

    expect(
      hasDerivedCycleDayReleasePassed(
        CYCLE_START,
        1,
        new Date(releaseAt.getTime() - 1),
      ),
    ).toBe(false);
    expect(hasDerivedCycleDayReleasePassed(CYCLE_START, 1, releaseAt)).toBe(true);
  });
});

describe("hasLegacyPublishedAtGatePassed", () => {
  it("passes when publishedAt is null", () => {
    expect(hasLegacyPublishedAtGatePassed(null, new Date())).toBe(true);
  });

  it("passes when publishedAt is in the past", () => {
    expect(
      hasLegacyPublishedAtGatePassed(
        new Date("2026-01-01T00:00:00.000Z"),
        new Date("2026-06-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("blocks when publishedAt is in the future", () => {
    const now = new Date("2026-07-01T02:00:00.000Z");
    const future = new Date(now.getTime() + 3_600_000);

    expect(hasLegacyPublishedAtGatePassed(future, now)).toBe(false);
  });
});

describe("getEffectiveCardReleaseAt", () => {
  it("returns derived UTC instant when publishedAt is absent", () => {
    expect(getEffectiveCardReleaseAt(card({ publishedAt: null }), CYCLE_START)).toEqual(
      new Date(DAY_1_RELEASE_UTC),
    );
  });

  it("returns derived time when publishedAt is earlier than derived", () => {
    expect(
      getEffectiveCardReleaseAt(
        card({ publishedAt: CYCLE_START }),
        CYCLE_START,
      ).toISOString(),
    ).toBe(DAY_1_RELEASE_UTC);
  });

  it("returns publishedAt when it defers beyond derived release", () => {
    const deferred = new Date("2026-07-01T04:00:00.000Z");

    expect(
      getEffectiveCardReleaseAt(card({ publishedAt: deferred }), CYCLE_START),
    ).toEqual(deferred);
  });
});

describe("getCycleDayForDate", () => {
  it("returns day 1 on the cycle start HKT calendar date", () => {
    expect(getCycleDayForDate(CYCLE_START, CYCLE_START)).toBe(1);
    expect(getCycleDayForDate(CYCLE_START, new Date(DAY_1_RELEASE_UTC))).toBe(1);
  });

  it("returns day 2 on the next HKT calendar date", () => {
    expect(getCycleDayForDate(CYCLE_START, new Date(DAY_2_RELEASE_UTC))).toBe(2);
  });
});

describe("isCardWithinRevealWindow", () => {
  it("blocks play at and after the cycle reveal cutoff", () => {
    const playableCard = card({ revealAt: null });
    const beforeReveal = new Date(CYCLE_REVEAL.getTime() - 1);
    const atReveal = CYCLE_REVEAL;

    expect(
      isCardWithinRevealWindow(playableCard, { revealAt: CYCLE_REVEAL }, beforeReveal),
    ).toBe(true);
    expect(
      isCardWithinRevealWindow(playableCard, { revealAt: CYCLE_REVEAL }, atReveal),
    ).toBe(false);
  });
});

describe("isCardReleasedForPlay — process TZ independence", () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  });

  it("returns the same playability before/at release regardless of TZ", () => {
    const cycle = { startsAt: CYCLE_START };
    const playableCard = card({ dayIndex: 1, publishedAt: null });
    const before = new Date("2026-07-01T00:30:00.000Z");
    const at = new Date(DAY_1_RELEASE_UTC);

    for (const tz of ["UTC", "America/Los_Angeles", "Europe/London"] as const) {
      process.env.TZ = tz;
      expect(isCardReleasedForPlay(playableCard, cycle, before)).toBe(false);
      expect(isCardReleasedForPlay(playableCard, cycle, at)).toBe(true);
    }
  });
});
