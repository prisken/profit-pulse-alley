import { describe, expect, it } from "vitest";

import {
  cardNeedsPpa,
  getAdminCardPpaStatus,
  isCardLiveForPlayers,
} from "@/lib/market-pulse/admin-card-ppa-status";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";

const CYCLE_START = MARKET_PULSE_PUBLIC_LAUNCH_AT;

describe("getAdminCardPpaStatus", () => {
  it("returns complete when signal, insight, and lock are set", () => {
    const status = getAdminCardPpaStatus({
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(status.kind).toBe("complete");
    expect(status.needsPpa).toBe(false);
  });

  it("returns missing_signal when signal is absent", () => {
    const status = getAdminCardPpaStatus({
      ppaSignal: null,
      ppaInsight: "Insight",
      ppaSignalLockedAt: null,
    });

    expect(status.kind).toBe("missing_signal");
    expect(status.needsPpa).toBe(true);
  });

  it("returns missing_insight when insight is blank", () => {
    const status = getAdminCardPpaStatus({
      ppaSignal: "BULLISH",
      ppaInsight: "  ",
      ppaSignalLockedAt: null,
    });

    expect(status.kind).toBe("missing_insight");
  });

  it("returns not_locked when only lock is missing", () => {
    const status = getAdminCardPpaStatus({
      ppaSignal: "BULLISH",
      ppaInsight: "Insight",
      ppaSignalLockedAt: null,
    });

    expect(status.kind).toBe("not_locked");
  });

  it("returns missing_signal_insight when both are missing", () => {
    const status = getAdminCardPpaStatus({
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });

    expect(status.kind).toBe("missing_signal_insight");
    expect(status.missingFields).toEqual(
      expect.arrayContaining(["ppaSignal", "ppaInsight", "ppaLocked"]),
    );
  });
});

describe("cardNeedsPpa", () => {
  it("is true when any PPA field is missing", () => {
    expect(
      cardNeedsPpa({
        ppaSignal: "BULLISH",
        ppaInsight: "x",
        ppaSignalLockedAt: null,
      }),
    ).toBe(true);
  });

  it("is false when PPA is complete", () => {
    expect(
      cardNeedsPpa({
        ppaSignal: "BULLISH",
        ppaInsight: "x",
        ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("isCardLiveForPlayers", () => {
  it("is true after derived release when publishedAt is in the past", () => {
    expect(
      isCardLiveForPlayers(
        {
          status: "PUBLISHED",
          publishedAt: "2026-01-01T00:00:00.000Z",
          dayIndex: 1,
        },
        CYCLE_START,
        new Date(getCycleDayReleaseAt(CYCLE_START, 1).getTime() + 60_000),
      ),
    ).toBe(true);
  });

  it("is false before derived 9:00 AM HKT even with past publishedAt", () => {
    expect(
      isCardLiveForPlayers(
        {
          status: "PUBLISHED",
          publishedAt: "2026-01-01T00:00:00.000Z",
          dayIndex: 1,
        },
        CYCLE_START,
        new Date(getCycleDayReleaseAt(CYCLE_START, 1).getTime() - 1),
      ),
    ).toBe(false);
  });

  it("is false when future publishedAt blocks after derived release", () => {
    const derived = getCycleDayReleaseAt(CYCLE_START, 1);
    const futurePublishedAt = new Date(derived.getTime() + 3_600_000);

    expect(
      isCardLiveForPlayers(
        {
          status: "PUBLISHED",
          publishedAt: futurePublishedAt.toISOString(),
          dayIndex: 1,
        },
        CYCLE_START,
        new Date(derived.getTime() + 60_000),
      ),
    ).toBe(false);
  });

  it("is false for draft cards", () => {
    expect(
      isCardLiveForPlayers(
        { status: "DRAFT", publishedAt: null, dayIndex: 1 },
        CYCLE_START,
      ),
    ).toBe(false);
  });
});
