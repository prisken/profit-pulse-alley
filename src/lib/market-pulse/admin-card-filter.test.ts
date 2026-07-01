import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  DEFAULT_ADMIN_CARD_FILTERS,
  filterAdminCards,
  isCardImageMissing,
  isCardNeedsPpa,
  isCardPublished,
} from "@/lib/market-pulse/admin-card-filter";

function buildCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    id: "card-1",
    cycleId: "cycle-a",
    dayIndex: 1,
    companyName: "Acme",
    companyNameZh: null,
    ticker: "ACME",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: null,
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: null,
    status: "DRAFT",
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    ...overrides,
  };
}

const cards = [
  buildCard({
    id: "c1",
    cycleId: "cycle-a",
    status: "PUBLISHED",
    cardImageUrl: "https://x/y.jpg",
    ppaSignal: "BULLISH",
    ppaInsight: "Complete",
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
  }),
  buildCard({ id: "c2", cycleId: "cycle-a", status: "DRAFT", ppaSignalLockedAt: null }),
  buildCard({ id: "c3", cycleId: "cycle-b", dayIndex: 2, status: "READY" }),
];

describe("filterAdminCards", () => {
  it("returns all cards with default filters", () => {
    expect(filterAdminCards(cards, DEFAULT_ADMIN_CARD_FILTERS)).toHaveLength(3);
  });

  it("filters by cycle", () => {
    expect(
      filterAdminCards(cards, { ...DEFAULT_ADMIN_CARD_FILTERS, cycleId: "cycle-b" }),
    ).toHaveLength(1);
  });

  it("filters published cards", () => {
    expect(
      filterAdminCards(cards, {
        ...DEFAULT_ADMIN_CARD_FILTERS,
        publishFilter: "PUBLISHED",
      }),
    ).toHaveLength(1);
  });

  it("filters missing image", () => {
    expect(
      filterAdminCards(cards, {
        ...DEFAULT_ADMIN_CARD_FILTERS,
        missingImageOnly: true,
      }),
    ).toHaveLength(2);
  });

  it("filters cards that need PPA", () => {
    expect(
      filterAdminCards(cards, {
        ...DEFAULT_ADMIN_CARD_FILTERS,
        needsPpaOnly: true,
      }),
    ).toHaveLength(2);
    expect(isCardNeedsPpa(buildCard({ ppaSignalLockedAt: null }))).toBe(true);
    expect(
      isCardNeedsPpa(
        buildCard({
          ppaSignal: "BULLISH",
          ppaInsight: "x",
          ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
    ).toBe(false);
  });
});

describe("card helpers", () => {
  it("detects published status", () => {
    expect(isCardPublished(buildCard({ status: "PUBLISHED" }))).toBe(true);
    expect(isCardPublished(buildCard({ status: "DRAFT" }))).toBe(false);
  });

  it("detects missing image", () => {
    expect(isCardImageMissing(buildCard())).toBe(true);
    expect(isCardImageMissing(buildCard({ cardImageUrl: "  " }))).toBe(true);
    expect(isCardImageMissing(buildCard({ cardImageUrl: "https://a/b.png" }))).toBe(
      false,
    );
  });
});
