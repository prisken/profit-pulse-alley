import { describe, expect, it } from "vitest";

import { buildDuplicateCardCreateData } from "@/lib/market-pulse/duplicate-card-data";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";

const source = {
  cycleId: "cycle-1",
  cardType: "SIGNAL" as const,
  companyName: "Acme Corp",
  companyNameZh: "艾克米",
  ticker: "ACME",
  exchange: "NYSE",
  logoUrl: "https://example.com/logo.png",
  logoInitials: "AC",
  priceLabel: "$100",
  priceDirection: "+1.2%",
  headline: "Acme beats estimates",
  newsBody: "Market context body",
  sourceName: "Reuters",
  sourceUrl: "https://example.com/news",
  cardImageUrl: "https://example.com/card.jpg",
  cardImageAlt: "Chart",
  summary: "Summary text",
  userPrompt: "What is your read?",
  ppaSignal: "BULLISH" as const,
  ppaInsight: "Strong momentum",
  headlineZhHant: null,
  newsBodyZhHant: null,
  cardImageAltZhHant: null,
  summaryZhHant: null,
  userPromptZhHant: null,
  ppaInsightZhHant: null,
};

describe("buildDuplicateCardCreateData", () => {
  it("copies editable content and assigns the current cycle day with next sort order", () => {
    const duplicate = buildDuplicateCardCreateData({
      source,
      targetCycleId: "cycle-1",
      targetCycleStartsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      existingCards: [
        { dayIndex: 1, sortOrder: 0 },
        { dayIndex: 2, sortOrder: 0 },
      ],
    });

    expect(duplicate.cycleId).toBe("cycle-1");
    expect(duplicate.dayIndex).toBe(1);
    expect(duplicate.sortOrder).toBe(1);
    expect(duplicate.headline).toBe(source.headline);
    expect(duplicate.ticker).toBe(source.ticker);
    expect(duplicate.newsBody).toBe(source.newsBody);
    expect(duplicate.cardImageUrl).toBe(source.cardImageUrl);
    expect(duplicate.userPrompt).toBe(source.userPrompt);
    expect(duplicate.ppaSignal).toBe(source.ppaSignal);
    expect(duplicate.ppaInsight).toBe(source.ppaInsight);
    expect(duplicate.sourceDate.getTime()).toBe(MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime());
  });

  it("resets publish, reveal, and lock fields to draft-safe values", () => {
    const duplicate = buildDuplicateCardCreateData({
      source,
      targetCycleId: "cycle-2",
      targetCycleStartsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      existingCards: [],
    });

    expect(duplicate.status).toBe("DRAFT");
    expect(duplicate.publishedAt).toBeNull();
    expect(duplicate.revealAt).toBeNull();
    expect(duplicate.ppaSignalLockedAt).toBeNull();
    expect(duplicate.dayIndex).toBe(1);
  });

  it("preserves REST card type and clears PPA fields on duplicate", () => {
    const duplicate = buildDuplicateCardCreateData({
      source: {
        ...source,
        cardType: "REST",
        companyName: "",
        ticker: "",
        ppaSignal: null,
        ppaInsight: null,
      },
      targetCycleId: "cycle-1",
      targetCycleStartsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      existingCards: [],
    });

    expect(duplicate.cardType).toBe("REST");
    expect(duplicate.ppaSignal).toBeNull();
    expect(duplicate.ppaInsight).toBeNull();
    expect(duplicate.headline).toBe(source.headline);
    expect(duplicate.status).toBe("DRAFT");
    expect(duplicate.publishedAt).toBeNull();
    expect(duplicate.ppaSignalLockedAt).toBeNull();
  });
});
