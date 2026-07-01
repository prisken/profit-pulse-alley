import { describe, expect, it } from "vitest";

import {
  isValidOptionalHttpUrl,
  validateCardPublishable,
  validateMarketPulseCardDraftSave,
  validateMarketPulseCardForm,
} from "@/lib/market-pulse/card-validation";
import { DEFAULT_CARD_FORM_VALUES } from "@/lib/market-pulse/card-validation";

const baseValues = {
  ...DEFAULT_CARD_FORM_VALUES,
  cycleId: "cycle-1",
  dayIndex: 1,
  companyName: "Acme Corp",
  ticker: "ACME",
  headline: "Earnings beat expectations",
  summary: "Revenue grew faster than expected in the demo quarter.",
};

describe("validateMarketPulseCardForm", () => {
  it("requires core fields", () => {
    const result = validateMarketPulseCardForm({
      ...DEFAULT_CARD_FORM_VALUES,
      cycleId: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.cycleId).toBeTruthy();
    expect(result.errors.companyName).toBeTruthy();
  });

  it("allows duplicate day index within cycle", () => {
    const result = validateMarketPulseCardForm(baseValues, {
      existingDayIndexes: [1, 2],
    });
    expect(result.valid).toBe(true);
    expect(result.errors.dayIndex).toBeUndefined();
  });

  it("requires unique sort order on the same cycle day", () => {
    const result = validateMarketPulseCardForm(baseValues, {
      existingSortOrdersOnDay: [{ sortOrder: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.sortOrder).toMatch(/already uses this order/i);
  });

  it("requires PPA for READY status", () => {
    const result = validateMarketPulseCardForm({
      ...baseValues,
      status: "READY",
      ppaSignal: "",
      ppaInsight: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.ppaSignal).toBeTruthy();
    expect(result.errors.ppaInsight).toBeTruthy();
  });

  it("requires summary", () => {
    const result = validateMarketPulseCardForm({
      ...baseValues,
      summary: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.summary).toMatch(/summary/i);
  });

  it("validates optional http(s) URLs", () => {
    expect(isValidOptionalHttpUrl("")).toBe(true);
    expect(isValidOptionalHttpUrl("https://example.com/a.jpg")).toBe(true);
    expect(isValidOptionalHttpUrl("not-a-url")).toBe(false);
  });

  it("requires image alt when image URL is set", () => {
    const result = validateMarketPulseCardForm({
      ...baseValues,
      cardImageUrl: "https://example.com/hero.jpg",
      cardImageAlt: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.cardImageAlt).toBeTruthy();
  });
});

describe("validateMarketPulseCardDraftSave", () => {
  it("allows missing summary for draft saves", () => {
    const result = validateMarketPulseCardDraftSave({
      ...baseValues,
      summary: "",
    });
    expect(result.valid).toBe(true);
  });

  it("still requires core database fields", () => {
    const result = validateMarketPulseCardDraftSave({
      ...baseValues,
      headline: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.headline).toBeTruthy();
  });
});

describe("validateCardPublishable", () => {
  it("requires locked PPA for signal cards", () => {
    const error = validateCardPublishable({
      cardType: "SIGNAL",
      headline: "News",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary text",
      ppaSignal: "BULLISH",
      ppaInsight: "Strong outlook",
      ppaSignalLockedAt: null,
    });
    expect(error).toMatch(/locked/i);
  });

  it("allows rest cards to publish without ticker or PPA", () => {
    const error = validateCardPublishable({
      cardType: "REST",
      headline: "Weekend rest",
      companyName: "",
      ticker: "",
      summary: null,
      newsBody: "Take a breather this weekend.",
      ppaSignal: null,
      ppaInsight: null,
      ppaSignalLockedAt: null,
    });
    expect(error).toBeNull();
  });

  it("requires rest card title and body", () => {
    expect(
      validateCardPublishable({
        cardType: "REST",
        headline: "",
        companyName: "",
        ticker: "",
        summary: null,
        newsBody: "Body",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ).toMatch(/title/i);

    expect(
      validateCardPublishable({
        cardType: "REST",
        headline: "Rest day",
        companyName: "",
        ticker: "",
        summary: null,
        newsBody: "",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ).toMatch(/body/i);
  });
});

describe("REST card form validation", () => {
  const restBase = {
    ...DEFAULT_CARD_FORM_VALUES,
    cycleId: "cycle-1",
    dayIndex: 1,
    cardType: "REST" as const,
    headline: "Weekend rest",
    newsBody: "Enjoy the break.",
  };

  it("does not require ticker, company, or PPA", () => {
    const result = validateMarketPulseCardForm({
      ...restBase,
      status: "READY",
      companyName: "",
      ticker: "",
      summary: "",
      ppaSignal: "",
      ppaInsight: "",
    });
    expect(result.valid).toBe(true);
  });

  it("requires headline and body for publish-ready form", () => {
    const result = validateMarketPulseCardForm({
      ...restBase,
      headline: "",
      newsBody: "",
      summary: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.headline).toBeTruthy();
    expect(result.errors.newsBody).toBeTruthy();
  });
});
