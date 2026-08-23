import { describe, expect, it } from "vitest";

import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  buildQuickDraftCardDefaults,
  deriveCycleCardCreationDefaults,
  formatCycleCardCategoryLabel,
  nextQuickDraftDayIndex,
  pickLatestCycleCardReference,
} from "@/lib/market-pulse/cycle-card-defaults";

const CYCLE = {
  startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
  revealAt: new Date("2026-04-01T12:00:00+08:00"),
  prizeLabel: "1-on-1 financial analysis",
};

describe("pickLatestCycleCardReference", () => {
  it("returns null when no cards exist", () => {
    expect(pickLatestCycleCardReference([])).toBeNull();
  });

  it("returns the card with the highest day index", () => {
    const latest = pickLatestCycleCardReference([
      { id: "a", dayIndex: 1, userPrompt: "A", exchange: null, sourceName: null, sourceUrl: null, headline: "h", companyName: "c", ticker: "t" },
      { id: "b", dayIndex: 3, userPrompt: "B", exchange: "HKEX", sourceName: "Reuters", sourceUrl: "https://example.com", headline: "h", companyName: "c", ticker: "t" },
    ]);

    expect(latest?.id).toBe("b");
  });
});

describe("deriveCycleCardCreationDefaults", () => {
  it("copies prompt and market fields from the latest card", () => {
    const defaults = deriveCycleCardCreationDefaults({
      cycle: CYCLE,
      cards: [
        {
          id: "card-2",
          dayIndex: 2,
          userPrompt: "Custom prompt",
          exchange: "HKEX",
          sourceName: "Bloomberg",
          sourceUrl: "https://news.example.com",
          headline: "Signal headline",
          companyName: "Acme",
          ticker: "ACME",
        },
      ],
    });

    expect(defaults.dayIndex).toBe(1);
    expect(defaults.userPrompt).toBe("Custom prompt");
    expect(defaults.exchange).toBe("HKEX");
    expect(defaults.sourceName).toBe("Bloomberg");
    expect(defaults.sourceUrl).toBe("https://news.example.com");
    expect(defaults.prizeLabel).toBe("1-on-1 financial analysis");
    expect(defaults.referenceCardId).toBe("card-2");
    expect(defaults.referenceDayIndex).toBe(2);
  });

  it("falls back to the global default prompt when no cards exist", () => {
    const defaults = deriveCycleCardCreationDefaults({
      cycle: CYCLE,
      cards: [],
    });

    expect(defaults.dayIndex).toBe(1);
    expect(defaults.userPrompt).toBe(MARKET_PULSE_DEFAULT_USER_PROMPT);
    expect(defaults.exchange).toBeNull();
    expect(defaults.referenceCardId).toBeNull();
  });
});

describe("formatCycleCardCategoryLabel", () => {
  it("joins exchange and source name", () => {
    expect(formatCycleCardCategoryLabel("HKEX", "Reuters")).toBe("HKEX · Reuters");
  });

  it("returns null when both are empty", () => {
    expect(formatCycleCardCategoryLabel(null, "")).toBeNull();
  });
});

describe("nextQuickDraftDayIndex", () => {
  it("starts at day 1 when no cards exist", () => {
    expect(nextQuickDraftDayIndex([])).toBe(1);
  });

  it("returns the current cycle day even when lower day indexes are unused", () => {
    expect(nextQuickDraftDayIndex([3])).toBe(1);
  });

  it("does not advance past the current cycle day when many days already have cards", () => {
    expect(nextQuickDraftDayIndex([1, 2, 3])).toBe(1);
  });
});

describe("buildQuickDraftCardDefaults", () => {
  it("applies draft placeholders and copies shared fields from the latest card", () => {
    const defaults = buildQuickDraftCardDefaults({
      cycle: CYCLE,
      cards: [
        {
          id: "card-1",
          dayIndex: 2,
          userPrompt: "Reuse me",
          exchange: "NYSE",
          sourceName: "WSJ",
          sourceUrl: "https://wsj.com/story",
          headline: "Existing headline",
          companyName: "Existing Co",
          ticker: "EXST",
        },
      ],
    });

    expect(defaults.dayIndex).toBe(1);
    expect(defaults.sortOrder).toBe(0);
    expect(defaults.headline).toBe(QUICK_DRAFT_CARD_HEADLINE);
    expect(defaults.companyName).toBe(QUICK_DRAFT_CARD_COMPANY_NAME);
    expect(defaults.ticker).toBe(QUICK_DRAFT_CARD_TICKER);
    expect(defaults.userPrompt).toBe("Reuse me");
    expect(defaults.exchange).toBe("NYSE");
    expect(defaults.sourceName).toBe("WSJ");
    expect(defaults.sourceUrl).toBe("https://wsj.com/story");
    expect(defaults.status).toBe("DRAFT");
    expect(defaults.sourceDate.getTime()).toBe(MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime());
  });
});
