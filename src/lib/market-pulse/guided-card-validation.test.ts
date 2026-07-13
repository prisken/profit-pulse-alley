import { describe, expect, it } from "vitest";

import {
  guidedRestSummaryFromBody,
  validateGuidedPpaApprove,
  validateGuidedRestCardSave,
  validateGuidedSignalCardSave,
} from "@/lib/market-pulse/guided-card-validation";

describe("validateGuidedPpaApprove", () => {
  it("requires only PPA decision and insight", () => {
    const result = validateGuidedPpaApprove({
      ppaSignal: "",
      ppaInsight: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.ppaSignal).toBe("PPA decision is missing.");
    expect(result.errors.ppaInsight).toBe("PPA insight is missing.");
  });

  it("accepts complete PPA input without content fields", () => {
    const result = validateGuidedPpaApprove({
      ppaSignal: "BULLISH",
      ppaInsight: "Strong demand.",
    });

    expect(result.valid).toBe(true);
  });
});

describe("validateGuidedCardSave", () => {
  it("allows partial SIGNAL content on save", () => {
    const result = validateGuidedSignalCardSave({
      cardType: "SIGNAL",
      headline: "",
      newsBody: "",
      companyName: "",
      ticker: "",
      summary: "",
      dayIndex: 1,
    });

    expect(result.valid).toBe(true);
  });

  it("requires image alt when image URL is provided", () => {
    const result = validateGuidedSignalCardSave({
      cardType: "SIGNAL",
      headline: "Headline",
      newsBody: "Body",
      companyName: "Acme",
      ticker: "ACME",
      summary: "Summary",
      dayIndex: 1,
      cardImageUrl: "https://example.com/card.jpg",
      cardImageAlt: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.cardImageAlt).toBe(
      "Image alt text is required when image URL is provided.",
    );
  });

  it("validates REST save format without requiring summary input", () => {
    const result = validateGuidedRestCardSave({
      cardType: "REST",
      headline: "Rest day",
      newsBody: "No signal today.",
      dayIndex: 2,
    });

    expect(result.valid).toBe(true);
    expect(guidedRestSummaryFromBody("No signal today.")).toBe("No signal today.");
  });
});
