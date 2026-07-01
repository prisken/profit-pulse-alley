import { describe, expect, it } from "vitest";

import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import {
  localizeMarketPulseSwipeCardData,
} from "@/lib/market-pulse/card-localization";
import { validatePlayerDecisionForCard } from "@/lib/market-pulse/card-type";
import { findPlayableCardsForToday, getCycleDisplayDay } from "@/lib/market-pulse/playable-card";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import { toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const CYCLE_START = new Date("2026-06-01T00:00:00.000Z");
const CYCLE_REVEAL = new Date("2026-06-30T00:00:00.000Z");

function restCard(
  overrides: Partial<ReturnType<typeof buildMarketPulseTestCard>> = {},
) {
  return buildMarketPulseTestCard({
    id: "rest-card-1",
    cycleId: "cycle-1",
    cardType: "REST",
    dayIndex: 1,
    sortOrder: 0,
    companyName: "Market rest",
    ticker: "",
    headline: "Market rest day",
    headlineZhHant: "市場休息日",
    newsBody: "No signal today — claim participation to stay in the challenge.",
    newsBodyZhHant: "今日無訊號 — 領取參與資格以繼續挑戰。",
    ppaSignal: null,
    ppaInsight: null,
    ppaSignalLockedAt: null,
    publishedAt: CYCLE_START,
    createdAt: CYCLE_START,
    updatedAt: CYCLE_START,
    ...overrides,
  });
}

describe("Market rest cards — play flow", () => {
  it("includes REST cards in playable list after 9:00 AM HKT", () => {
    const releaseAt = getCycleDayReleaseAt(CYCLE_START, 1);
    const beforeRelease = new Date(releaseAt.getTime() - 1_000);
    const afterRelease = new Date(releaseAt.getTime() + 1_000);

    expect(getCycleDisplayDay(CYCLE_START, afterRelease)).toBe(1);

    expect(
      findPlayableCardsForToday(
        {
          startsAt: CYCLE_START,
          revealAt: CYCLE_REVEAL,
          cards: [restCard({ publishedAt: null })],
        },
        beforeRelease,
      ),
    ).toHaveLength(0);

    const playable = findPlayableCardsForToday(
      {
        startsAt: CYCLE_START,
        revealAt: CYCLE_REVEAL,
        cards: [restCard({ publishedAt: null })],
      },
      afterRelease,
    );

    expect(playable).toHaveLength(1);
    expect(playable[0]?.cardType).toBe("REST");
  });

  it("exposes no PPA fields in rest card swipe payload", () => {
    const dbCard = restCard({
      ppaSignal: "BULLISH",
      ppaInsight: "Should not leak",
      ppaSignalLockedAt: CYCLE_START,
    });
    const payload = getMarketPulseCardPublicPayload(dbCard, {
      cycle: { status: "OPEN", revealAt: CYCLE_REVEAL },
      at: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(payload.cardType).toBe("REST");
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();

    const swipe = toMarketPulseSwipeCardData({
      ...payload,
      sourceDate: null,
    });

    expect(swipe.cardType).toBe("REST");
    expect(swipe).not.toHaveProperty("ppaSignal");
    expect(swipe).not.toHaveProperty("ppaInsight");
  });

  it("validates player decisions by card type", () => {
    expect(
      validatePlayerDecisionForCard({ cardType: "REST" }, "ACKNOWLEDGED"),
    ).toEqual({ ok: true, decision: "ACKNOWLEDGED" });

    expect(
      validatePlayerDecisionForCard({ cardType: "REST" }, "BULLISH").ok,
    ).toBe(false);

    expect(
      validatePlayerDecisionForCard({ cardType: "SIGNAL" }, "ACKNOWLEDGED").ok,
    ).toBe(false);

    expect(
      validatePlayerDecisionForCard({ cardType: "SIGNAL" }, "BULLISH"),
    ).toEqual({ ok: true, decision: "BULLISH" });
  });

  it("localizes zh-Hant rest card text with English fallback", () => {
    const dbCard = restCard();
    const swipe = toMarketPulseSwipeCardData({
      ...getMarketPulseCardPublicPayload(dbCard, {
        cycle: { status: "OPEN", revealAt: CYCLE_REVEAL },
      }),
      sourceDate: null,
    });

    const localized = localizeMarketPulseSwipeCardData(swipe, dbCard, "zh-Hant");

    expect(localized.headline).toBe("市場休息日");
    expect(localized.newsBody).toBe("今日無訊號 — 領取參與資格以繼續挑戰。");
    expect(swipe.cardType).toBe("REST");
  });

  it("falls back to English rest copy when zh-Hant fields are missing", () => {
    const dbCard = restCard({
      headlineZhHant: null,
      newsBodyZhHant: null,
    });
    const swipe = toMarketPulseSwipeCardData({
      ...getMarketPulseCardPublicPayload(dbCard, {
        cycle: { status: "OPEN", revealAt: CYCLE_REVEAL },
      }),
      sourceDate: null,
    });

    const localized = localizeMarketPulseSwipeCardData(swipe, dbCard, "zh-Hant");

    expect(localized.headline).toBe("Market rest day");
    expect(localized.newsBody).toBe(
      "No signal today — claim participation to stay in the challenge.",
    );
  });
});
