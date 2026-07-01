import { describe, expect, it } from "vitest";

import {
  buildCardsOnDayCountMap,
  compareMarketPulseCardsByPlayOrder,
  formatMarketPulseCardDayLabel,
  formatMarketPulseCardDayLabelLocalized,
} from "@/lib/market-pulse/card-play-order";

describe("compareMarketPulseCardsByPlayOrder", () => {
  it("sorts by dayIndex, then sortOrder, then createdAt, then id", () => {
    const cards = [
      { dayIndex: 3, sortOrder: 1, createdAt: "2026-06-01T10:00:00Z", id: "b" },
      { dayIndex: 2, sortOrder: 0, createdAt: "2026-06-01T09:00:00Z", id: "a" },
      { dayIndex: 3, sortOrder: 0, createdAt: "2026-06-01T09:00:00Z", id: "c" },
    ];

    const sorted = [...cards].sort(compareMarketPulseCardsByPlayOrder);

    expect(sorted.map((card) => card.id)).toEqual(["a", "c", "b"]);
  });
});

describe("formatMarketPulseCardDayLabel", () => {
  it("uses single-day label when only one card on the day", () => {
    expect(formatMarketPulseCardDayLabel(3, 0, 1)).toBe("Day 3");
  });

  it("uses multi-card label when multiple cards share a day", () => {
    expect(formatMarketPulseCardDayLabel(3, 0, 2)).toBe("Day 3 · Card 1");
    expect(formatMarketPulseCardDayLabel(3, 1, 2)).toBe("Day 3 · Card 2");
  });
});

describe("buildCardsOnDayCountMap", () => {
  it("counts cards per day index", () => {
    const counts = buildCardsOnDayCountMap([
      { dayIndex: 1 },
      { dayIndex: 3 },
      { dayIndex: 3 },
    ]);

    expect(counts.get(1)).toBe(1);
    expect(counts.get(3)).toBe(2);
  });
});

describe("formatMarketPulseCardDayLabelLocalized", () => {
  it("delegates to single or multi label formatters", () => {
    const single = formatMarketPulseCardDayLabelLocalized(3, 0, 1, {
      single: (day) => `D${day}`,
      multi: (day, card) => `D${day}C${card}`,
    });
    const multi = formatMarketPulseCardDayLabelLocalized(3, 1, 2, {
      single: (day) => `D${day}`,
      multi: (day, card) => `D${day}C${card}`,
    });

    expect(single).toBe("D3");
    expect(multi).toBe("D3C2");
  });
});
