import { describe, expect, it } from "vitest";

import {
  localizeMarketPulseCard,
  localizeMarketPulseCardPublicPayload,
  localizeMarketPulseCardText,
  localizeMarketPulseRevealCardFields,
  localizeMarketPulseSwipeCardData,
  type MarketPulseCardLocalizableSource,
} from "@/lib/market-pulse/card-localization";
import { getMarketPulseCardPublicPayload } from "@/lib/market-pulse/reveal-access";
import { stripPpaFromCardPayload, toMarketPulseSwipeCardData } from "@/lib/market-pulse/swipe-card";
import { buildMarketPulseTestCard } from "@/lib/market-pulse/market-pulse-test-fixtures";

const bilingualSource: MarketPulseCardLocalizableSource = {
  companyName: "Acme Corp",
  companyNameZh: "艾克米公司",
  headline: "Acme expands",
  headlineZhHant: "艾克米擴張",
  newsBody: "English body",
  newsBodyZhHant: "繁體正文",
  summary: "English summary",
  summaryZhHant: "繁體摘要",
  cardImageAlt: "English alt",
  cardImageAltZhHant: "繁體替代文字",
  userPrompt: "English prompt",
  userPromptZhHant: "繁體提示",
  ppaInsight: "English insight",
  ppaInsightZhHant: "繁體洞察",
};

const englishOnlySource: MarketPulseCardLocalizableSource = {
  companyName: "Acme Corp",
  companyNameZh: null,
  headline: "Acme expands",
  headlineZhHant: null,
  newsBody: "English body",
  newsBodyZhHant: null,
  summary: "English summary",
  summaryZhHant: null,
  cardImageAlt: "English alt",
  cardImageAltZhHant: null,
  userPrompt: "English prompt",
  userPromptZhHant: null,
  ppaInsight: "English insight",
  ppaInsightZhHant: null,
};

const baseCycle = {
  status: "OPEN" as const,
  revealAt: new Date("2026-01-10T00:00:00.000Z"),
};

describe("localizeMarketPulseCardText", () => {
  it("uses zh-Hant fields when locale is zh-Hant", () => {
    const text = localizeMarketPulseCardText(bilingualSource, "zh-Hant");

    expect(text.companyName).toBe("艾克米公司");
    expect(text.companyNameZh).toBeNull();
    expect(text.headline).toBe("艾克米擴張");
    expect(text.newsBody).toBe("繁體正文");
    expect(text.summary).toBe("繁體摘要");
    expect(text.cardImageAlt).toBe("繁體替代文字");
    expect(text.userPrompt).toBe("繁體提示");
    expect(text.ppaInsight).toBe("繁體洞察");
  });

  it("falls back to English when zh-Hant field is missing", () => {
    const text = localizeMarketPulseCardText(englishOnlySource, "zh-Hant");

    expect(text.companyName).toBe("Acme Corp");
    expect(text.headline).toBe("Acme expands");
    expect(text.newsBody).toBe("English body");
    expect(text.ppaInsight).toBe("English insight");
  });

  it("uses existing English fields for en locale", () => {
    const text = localizeMarketPulseCardText(bilingualSource, "en");

    expect(text).toEqual({
      companyName: "Acme Corp",
      companyNameZh: "艾克米公司",
      headline: "Acme expands",
      newsBody: "English body",
      summary: "English summary",
      cardImageAlt: "English alt",
      userPrompt: "English prompt",
      ppaInsight: "English insight",
    });
  });

  it("falls back from empty zh-Hant strings to English", () => {
    const text = localizeMarketPulseCardText(
      {
        ...bilingualSource,
        headlineZhHant: "   ",
        ppaInsightZhHant: "",
      },
      "zh-Hant",
    );

    expect(text.headline).toBe("Acme expands");
    expect(text.ppaInsight).toBe("English insight");
  });
});

describe("localizeMarketPulseCard", () => {
  it("is an alias for localizeMarketPulseCardText", () => {
    expect(localizeMarketPulseCard(bilingualSource, "zh-Hant")).toEqual(
      localizeMarketPulseCardText(bilingualSource, "zh-Hant"),
    );
  });
});

describe("getMarketPulseCardPublicPayload with locale", () => {
  it("keeps PPA fields stripped before reveal for any locale", () => {
    const card = buildMarketPulseTestCard({
      dayIndex: 1,
      headlineZhHant: "繁體標題",
      ppaInsightZhHant: "繁體洞察",
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: baseCycle,
      at: new Date("2026-01-05T00:00:00.000Z"),
      locale: "zh-Hant",
    });

    expect(payload.headline).toBe("繁體標題");
    expect(payload.ppaSignal).toBeUndefined();
    expect(payload.ppaInsight).toBeUndefined();
  });

  it("localizes post-reveal PPA insight with zh-Hant fallback", () => {
    const card = buildMarketPulseTestCard({
      dayIndex: 1,
      ppaInsight: "English insight",
      ppaInsightZhHant: "繁體洞察",
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: baseCycle,
      at: new Date("2026-01-10T00:00:00.000Z"),
      locale: "zh-Hant",
    });

    expect(payload.ppaInsight).toBe("繁體洞察");
  });

  it("falls back to English post-reveal insight when zh-Hant missing", () => {
    const card = buildMarketPulseTestCard({
      dayIndex: 1,
      ppaInsight: "English insight",
      ppaInsightZhHant: null,
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: { ...baseCycle, status: "REVEALED" },
      at: new Date("2026-01-10T00:00:00.000Z"),
      locale: "zh-Hant",
    });

    expect(payload.ppaInsight).toBe("English insight");
  });

  it("leaves English-only cards unchanged for en locale", () => {
    const card = buildMarketPulseTestCard({ dayIndex: 1 });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: baseCycle,
      locale: "en",
    });

    expect(payload.headline).toBe("Test headline");
    expect(payload.companyName).toBe("Test Co");
    expect(payload.companyNameZh).toBeNull();
  });
});

describe("localizeMarketPulseSwipeCardData", () => {
  it("preserves non-text swipe fields while localizing text", () => {
    const swipe = localizeMarketPulseSwipeCardData(
      {
        id: "card-1",
        cardType: "SIGNAL",
        companyName: "Acme Corp",
        companyNameZh: "艾克米公司",
        ticker: "ACME",
        exchange: "HKEX",
        logoUrl: "https://example.com/logo.png",
        logoInitials: "AC",
        priceLabel: "$10",
        priceDirection: "up",
        headline: "Acme expands",
        newsBody: "English body",
        sourceName: "News",
        sourceUrl: "https://example.com",
        sourceDate: "2026-01-01T00:00:00.000Z",
        cardImageUrl: "https://example.com/card.png",
        cardImageAlt: "English alt",
        summary: "English summary",
        userPrompt: "English prompt",
      },
      bilingualSource,
      "zh-Hant",
    );

    expect(swipe.ticker).toBe("ACME");
    expect(swipe.logoInitials).toBe("AC");
    expect(swipe.priceLabel).toBe("$10");
    expect(swipe.cardImageUrl).toBe("https://example.com/card.png");
    expect(swipe.headline).toBe("艾克米擴張");
    expect(swipe.companyName).toBe("艾克米公司");
    expect(swipe.companyNameZh).toBeNull();
  });
});

describe("localizeMarketPulseCardPublicPayload", () => {
  it("does not add ppaInsight when payload omitted it pre-reveal", () => {
    const payload = localizeMarketPulseCardPublicPayload(
      {
        id: "card-1",
        cycleId: "cycle-1",
        dayIndex: 1,
        companyName: "Acme Corp",
        companyNameZh: null,
        ticker: "ACME",
        exchange: null,
        logoUrl: null,
        logoInitials: null,
        priceLabel: null,
        priceDirection: null,
        headline: "Acme expands",
        newsBody: null,
        sourceName: null,
        sourceUrl: null,
        sourceDate: null,
        cardImageUrl: null,
        cardImageAlt: null,
        summary: null,
        userPrompt: null,
        status: "PUBLISHED",
        publishedAt: null,
        revealAt: null,
        isRevealed: false,
      },
      bilingualSource,
      "zh-Hant",
    );

    expect(payload).not.toHaveProperty("ppaInsight");
    expect(payload.headline).toBe("艾克米擴張");
  });
});

describe("localizeMarketPulseRevealCardFields", () => {
  it("localizes reveal row text including ppa insight", () => {
    expect(localizeMarketPulseRevealCardFields(bilingualSource, "zh-Hant")).toEqual({
      companyName: "艾克米公司",
      headline: "艾克米擴張",
      ppaInsight: "繁體洞察",
    });
  });
});

describe("client payload stripping with localized cards", () => {
  it("stripPpaFromCardPayload still removes PPA after zh-Hant localization", () => {
    const card = buildMarketPulseTestCard({
      dayIndex: 1,
      headlineZhHant: "繁體標題",
      ppaInsightZhHant: "繁體洞察",
    });

    const payload = getMarketPulseCardPublicPayload(card, {
      cycle: baseCycle,
      at: new Date("2026-01-10T00:00:00.000Z"),
      locale: "zh-Hant",
    });

    const stripped = stripPpaFromCardPayload(payload);
    expect(stripped).not.toHaveProperty("ppaSignal");
    expect(stripped).not.toHaveProperty("ppaInsight");
    expect(toMarketPulseSwipeCardData(stripped).headline).toBe("繁體標題");
  });
});
