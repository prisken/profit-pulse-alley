import { describe, expect, it } from "vitest";

import { DEMO_CARDS, DEMO_CYCLE_NAME } from "./seed-market-pulse-data";

describe("Market Pulse demo seed data", () => {
  it("uses a clearly marked demo cycle name", () => {
    expect(DEMO_CYCLE_NAME).toMatch(/\[DEMO\]/i);
  });

  it("defines 10 unique day indexes with required demo fields", () => {
    expect(DEMO_CARDS).toHaveLength(10);
    const dayIndexes = DEMO_CARDS.map((card) => card.dayIndex);
    expect(new Set(dayIndexes).size).toBe(10);

    for (const card of DEMO_CARDS) {
      expect(card.companyName.trim()).not.toBe("");
      expect(card.ticker.trim()).not.toBe("");
      expect(card.headline.trim()).not.toBe("");
      expect(card.sourceName.trim()).not.toBe("");
      expect(card.summary.trim()).not.toBe("");
      expect(card.ppaInsight.trim()).not.toBe("");
      expect(["BULLISH", "CAUTIOUS"]).toContain(card.ppaSignal);
    }
  });

  it("includes the documented sample headlines", () => {
    expect(DEMO_CARDS[0]?.headline).toMatch(/TSMC/i);
    expect(DEMO_CARDS[1]?.headline).toMatch(/NVIDIA/i);
    expect(DEMO_CARDS[2]?.headline).toMatch(/HSBC/i);
  });
});
