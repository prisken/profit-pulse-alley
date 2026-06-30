import { describe, expect, it } from "vitest";
import type { MarketPulseCard } from "@prisma/client";

import {
  CHALLENGE_CYCLE_EPOCH_MS,
  CHALLENGE_CYCLE_MS,
  getChallengeCycleEnd,
  getCurrentMarketPulseCycle,
} from "@/lib/market-pulse/challenge-cycle";
import {
  getCyclePlayabilityIssue,
  isCyclePlayable,
} from "@/lib/market-pulse/cycle-playability";
import {
  MARKET_PULSE_FIRST_CYCLE_END_AT,
  MARKET_PULSE_FIRST_CYCLE_START_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT,
  MARKET_PULSE_PUBLIC_LAUNCH_AT_MS,
  canAccessMarketPulsePlay,
  canSubmitMarketPulseDecision,
  isBeforePublicLaunch,
} from "@/lib/market-pulse/launch-config";
import {
  findPlayableCardForToday,
  getCycleDisplayDay,
} from "@/lib/market-pulse/playable-card";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";

/** 30 Jun 2026 23:59:59.999 HKT (UTC+8) */
const JUN_30_235959_HKT = new Date("2026-06-30T15:59:59.999Z");

/** 1 Jul 2026 00:00:00.000 HKT */
const JUL_1_0000_HKT = new Date("2026-06-30T16:00:00.000Z");

/** 1 Jul 2026 00:01:00.000 HKT */
const JUL_1_0001_HKT = new Date("2026-06-30T16:01:00.000Z");

/** 10 Jul 2026 12:00 HKT */
const JUL_10_NOON_HKT = new Date("2026-07-10T04:00:00.000Z");

/** 10 Jul 2026 23:59:59.999 HKT */
const JUL_10_235959_HKT = new Date("2026-07-10T15:59:59.999Z");

/** 11 Jul 2026 00:00:00.000 HKT — exclusive end / recommended reveal */
const JUL_11_0000_HKT = new Date("2026-07-10T16:00:00.000Z");

/** 11 Jul 2026 00:00:00.001 HKT */
const JUL_11_0000001_HKT = new Date("2026-07-10T16:00:00.001Z");

const firstCycle = {
  status: "OPEN" as const,
  startsAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
  revealAt: MARKET_PULSE_FIRST_CYCLE_END_AT,
};

function firstCycleCard(dayIndex: number): MarketPulseCard {
  return {
    id: `card-day-${dayIndex}`,
    cycleId: "cycle-first",
    dayIndex,
    companyName: "Example Co",
    companyNameZh: null,
    ticker: "EX",
    exchange: null,
    logoUrl: null,
    logoInitials: "EX",
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: null,
    sourceName: null,
    sourceUrl: null,
    sourceDate: MARKET_PULSE_FIRST_CYCLE_START_AT,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: "Prompt",
    ppaSignal: "BULLISH",
    ppaInsight: "Hidden before reveal",
    status: "PUBLISHED",
    publishedAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
    revealAt: null,
    ppaSignalLockedAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
    createdAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
    updatedAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
  };
}

describe("Market Pulse launch gate (HKT boundaries)", () => {
  it("uses 1 Jul 2026 00:00 HKT as the public launch instant", () => {
    expect(MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime()).toBe(JUL_1_0000_HKT.getTime());
    expect(MARKET_PULSE_PUBLIC_LAUNCH_AT_MS).toBe(JUL_1_0000_HKT.getTime());
  });

  it("blocks guests and USER one millisecond before launch", () => {
    expect(isBeforePublicLaunch(JUN_30_235959_HKT)).toBe(true);
    expect(canAccessMarketPulsePlay(undefined, JUN_30_235959_HKT)).toBe(false);
    expect(canAccessMarketPulsePlay("USER", JUN_30_235959_HKT)).toBe(false);
    expect(canSubmitMarketPulseDecision("USER", JUN_30_235959_HKT)).toBe(false);
  });

  it("allows ADMIN to test one millisecond before launch", () => {
    expect(canAccessMarketPulsePlay("ADMIN", JUN_30_235959_HKT)).toBe(true);
    expect(canSubmitMarketPulseDecision("ADMIN", JUN_30_235959_HKT)).toBe(true);
  });

  it("opens public access exactly at 1 Jul 2026 00:00 HKT", () => {
    expect(isBeforePublicLaunch(JUL_1_0000_HKT)).toBe(false);
    expect(canAccessMarketPulsePlay(undefined, JUL_1_0000_HKT)).toBe(true);
    expect(canAccessMarketPulsePlay("USER", JUL_1_0000_HKT)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", JUL_1_0000_HKT)).toBe(true);
  });

  it("keeps USER unblocked one minute after launch", () => {
    expect(canAccessMarketPulsePlay("USER", JUL_1_0001_HKT)).toBe(true);
    expect(canSubmitMarketPulseDecision("USER", JUL_1_0001_HKT)).toBe(true);
  });

  it("lets guests browse play after launch (sign-in is enforced separately on submit)", () => {
    expect(canAccessMarketPulsePlay(undefined, JUL_1_0001_HKT)).toBe(true);
  });
});

describe("first public cycle dates (1–10 Jul 2026 HKT)", () => {
  it("aligns challenge epoch and first-cycle constants with launch", () => {
    expect(CHALLENGE_CYCLE_EPOCH_MS).toBe(MARKET_PULSE_PUBLIC_LAUNCH_AT_MS);
    expect(MARKET_PULSE_FIRST_CYCLE_START_AT.getTime()).toBe(JUL_1_0000_HKT.getTime());
    expect(MARKET_PULSE_FIRST_CYCLE_END_AT.getTime()).toBe(JUL_11_0000_HKT.getTime());
  });

  it("labels the first cycle 2026-07-01 through 2026-07-10 in HKT", () => {
    expect(getCurrentMarketPulseCycle(JUL_1_0000_HKT.getTime()).cycleId).toBe(
      "2026-07-01_2026-07-10",
    );
    expect(getCurrentMarketPulseCycle(JUL_10_235959_HKT.getTime()).cycleId).toBe(
      "2026-07-01_2026-07-10",
    );
    expect(getChallengeCycleEnd(JUL_10_NOON_HKT.getTime()).getTime()).toBe(
      JUL_11_0000_HKT.getTime(),
    );
  });

  it("treats 1 Jul 00:00 and 00:01 HKT as day 1", () => {
    expect(getCycleDisplayDay(MARKET_PULSE_FIRST_CYCLE_START_AT, JUL_1_0000_HKT)).toBe(
      1,
    );
    expect(getCycleDisplayDay(MARKET_PULSE_FIRST_CYCLE_START_AT, JUL_1_0001_HKT)).toBe(
      1,
    );

    const playableAtOpen = findPlayableCardForToday(
      {
        startsAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
        cards: [firstCycleCard(1)],
      },
      JUL_1_0000_HKT,
    );
    expect(playableAtOpen?.dayIndex).toBe(1);
  });

  it("treats 10 Jul during the window as day 10 and still playable before reveal", () => {
    expect(
      getCycleDisplayDay(MARKET_PULSE_FIRST_CYCLE_START_AT, JUL_10_NOON_HKT),
    ).toBe(10);
    expect(
      getCycleDisplayDay(MARKET_PULSE_FIRST_CYCLE_START_AT, JUL_10_235959_HKT),
    ).toBe(10);

    expect(isCyclePlayable(firstCycle, JUL_10_NOON_HKT)).toBe(true);
    expect(getCyclePlayabilityIssue(firstCycle, JUL_10_235959_HKT)).toBeNull();

    const playable = findPlayableCardForToday(
      {
        startsAt: MARKET_PULSE_FIRST_CYCLE_START_AT,
        cards: [firstCycleCard(10)],
      },
      JUL_10_NOON_HKT,
    );
    expect(playable?.dayIndex).toBe(10);
  });

  it("closes play after the recommended 11 Jul 2026 00:00 HKT reveal boundary", () => {
    expect(getCyclePlayabilityIssue(firstCycle, JUL_11_0000_HKT)).toBeNull();
    expect(getCyclePlayabilityIssue(firstCycle, JUL_11_0000001_HKT)).toBe(
      "reveal_passed",
    );
    expect(isCyclePlayable(firstCycle, JUL_11_0000001_HKT)).toBe(false);
  });

  it("advances to the next challenge cycle at 11 Jul 00:00 HKT", () => {
    const nextCycle = getCurrentMarketPulseCycle(
      CHALLENGE_CYCLE_EPOCH_MS + CHALLENGE_CYCLE_MS,
    );
    expect(nextCycle.cycleId).toBe("2026-07-11_2026-07-20");
  });
});

describe("PPA privacy vs play gating", () => {
  it("keeps PPA hidden while the cycle is playable before reveal", () => {
    const card = firstCycleCard(3);
    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: firstCycle,
      at: JUL_10_NOON_HKT,
    });

    expect(isCyclePlayable(firstCycle, JUL_10_NOON_HKT)).toBe(true);
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
    expect(payload.isRevealed).toBe(false);
  });
});
