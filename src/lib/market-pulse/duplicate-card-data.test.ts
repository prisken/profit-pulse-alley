import { describe, expect, it } from "vitest";

import { buildDuplicateCardCreateData } from "@/lib/market-pulse/duplicate-card-data";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import { quickDraftCardSourceDate } from "@/lib/market-pulse/quick-create-card-defaults";

const source = {
  cycleId: "cycle-1",
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
};

describe("buildDuplicateCardCreateData", () => {
  it("copies editable content and assigns the next day in the target cycle", () => {
    const duplicate = buildDuplicateCardCreateData({
      source,
      targetCycleId: "cycle-1",
      targetCycleStartsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
      existingCards: [{ dayIndex: 1 }, { dayIndex: 2 }],
    });

    expect(duplicate.cycleId).toBe("cycle-1");
    expect(duplicate.dayIndex).toBe(3);
    expect(duplicate.headline).toBe(source.headline);
    expect(duplicate.ticker).toBe(source.ticker);
    expect(duplicate.newsBody).toBe(source.newsBody);
    expect(duplicate.cardImageUrl).toBe(source.cardImageUrl);
    expect(duplicate.userPrompt).toBe(source.userPrompt);
    expect(duplicate.ppaSignal).toBe(source.ppaSignal);
    expect(duplicate.ppaInsight).toBe(source.ppaInsight);
    expect(duplicate.sourceDate.getTime()).toBe(
      quickDraftCardSourceDate(MARKET_PULSE_PUBLIC_LAUNCH_AT, 3).getTime(),
    );
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
});
