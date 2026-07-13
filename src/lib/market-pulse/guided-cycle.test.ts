import { describe, expect, it } from "vitest";

import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
} from "@/lib/market-pulse/cycle-card-defaults";
import {
  buildGuidedCycleCardCreates,
  buildGuidedCycleDayPlan,
  validateGuidedCycleInput,
} from "@/lib/market-pulse/guided-cycle";
import {
  guidedCycleEndAtFromDateOnly,
  guidedCycleRevealAtFromDateOnly,
  guidedCycleStartAtFromDateOnly,
} from "@/lib/market-pulse/hkt-time";

const BASE_INPUT = {
  name: "August 2026 Cycle",
  startDate: "2026-08-01",
  endDate: "2026-08-10",
  revealDate: "2026-08-11",
  defaultSignalCardsPerDay: 2,
};

describe("validateGuidedCycleInput", () => {
  it("rejects reveal date on the same HKT calendar day as end date", () => {
    const result = validateGuidedCycleInput({
      ...BASE_INPUT,
      revealDate: "2026-08-10",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.revealDate).toContain("after end date");
    }
  });

  it("accepts reveal date after end date and resolves UTC instants", () => {
    const result = validateGuidedCycleInput(BASE_INPUT);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.dates.startsAt.toISOString()).toBe("2026-08-01T01:00:00.000Z");
      expect(result.dates.endsAt.toISOString()).toBe("2026-08-10T13:00:00.000Z");
      expect(result.dates.revealAt.toISOString()).toBe("2026-08-11T01:00:00.000Z");
    }
  });
});

describe("buildGuidedCycleDayPlan", () => {
  it("generates inclusive HKT days from start through end", () => {
    const plan = buildGuidedCycleDayPlan({
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      defaultSignalCardsPerDay: 2,
    });

    expect(plan).toHaveLength(10);
    expect(plan?.[0]).toMatchObject({
      dayIndex: 1,
      hktDate: "2026-08-01",
      dayType: "SIGNAL",
      signalCardCount: 2,
    });
    expect(plan?.[9]).toMatchObject({
      dayIndex: 10,
      hktDate: "2026-08-10",
    });
  });
});

describe("buildGuidedCycleCardCreates", () => {
  const startsAt = guidedCycleStartAtFromDateOnly("2026-08-01")!;

  it("creates configured SIGNAL drafts and one REST draft per rest day", () => {
    const dayPlan = buildGuidedCycleDayPlan({
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      defaultSignalCardsPerDay: 2,
      dayOverrides: [{ dayIndex: 2, dayType: "REST" }],
    })!;

    const cards = buildGuidedCycleCardCreates(startsAt, dayPlan);
    const signalCards = cards.filter((card) => card.cardType === "SIGNAL");
    const restCards = cards.filter((card) => card.cardType === "REST");

    expect(signalCards).toHaveLength(4);
    expect(restCards).toHaveLength(1);
    expect(restCards[0]?.headline).toBe(QUICK_REST_DRAFT_CARD_HEADLINE);
    expect(restCards[0]?.companyName).toBe("");
    expect(restCards[0]?.ticker).toBe("");
    expect(restCards[0]?.ppaSignal).toBeNull();
  });

  it("assigns dayIndex, sortOrder, and sourceDate from the HKT day plan", () => {
    const dayPlan = buildGuidedCycleDayPlan({
      startDate: "2026-08-01",
      endDate: "2026-08-02",
      defaultSignalCardsPerDay: 2,
    })!;

    const cards = buildGuidedCycleCardCreates(startsAt, dayPlan);
    const day1Cards = cards.filter((card) => card.dayIndex === 1);

    expect(day1Cards).toHaveLength(2);
    expect(day1Cards.map((card) => card.sortOrder)).toEqual([0, 1]);
    expect(day1Cards[0]?.sourceDate.toISOString()).toBe("2026-08-01T01:00:00.000Z");
    expect(day1Cards[0]?.headline).toBe(QUICK_DRAFT_CARD_HEADLINE);
    expect(day1Cards[0]?.companyName).toBe(QUICK_DRAFT_CARD_COMPANY_NAME);
    expect(day1Cards[0]?.ticker).toBe(QUICK_DRAFT_CARD_TICKER);
    expect(day1Cards[0]?.userPrompt).toBe(MARKET_PULSE_DEFAULT_USER_PROMPT);
  });
});

describe("guided cycle resolved dates", () => {
  it("maps the approved example instants", () => {
    expect(guidedCycleStartAtFromDateOnly("2026-08-01")?.toISOString()).toBe(
      "2026-08-01T01:00:00.000Z",
    );
    expect(guidedCycleEndAtFromDateOnly("2026-08-10")?.toISOString()).toBe(
      "2026-08-10T13:00:00.000Z",
    );
    expect(guidedCycleRevealAtFromDateOnly("2026-08-11")?.toISOString()).toBe(
      "2026-08-11T01:00:00.000Z",
    );
  });
});
