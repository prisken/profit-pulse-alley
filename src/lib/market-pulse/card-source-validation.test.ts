import { describe, expect, it } from "vitest";

import { validateCardSource } from "@/lib/market-pulse/card-validation";

describe("validateCardSource (due-diligence guard)", () => {
  it("accepts a named source with a direct article URL", () => {
    expect(
      validateCardSource({
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/markets/asia/hsbc-buyback-2026-08-06/",
      }),
    ).toBeNull();
  });

  it("rejects a missing source name", () => {
    expect(
      validateCardSource({
        sourceName: "",
        sourceUrl: "https://www.reuters.com/markets/",
      }),
    ).toBe("Source name is required before publishing.");
    expect(
      validateCardSource({
        sourceName: "   ",
        sourceUrl: "https://www.reuters.com/markets/",
      }),
    ).toBe("Source name is required before publishing.");
    expect(
      validateCardSource({
        sourceUrl: "https://www.reuters.com/markets/",
      }),
    ).toBe("Source name is required before publishing.");
  });

  it("rejects a missing source URL", () => {
    expect(
      validateCardSource({
        sourceName: "Reuters",
        sourceUrl: "",
      }),
    ).toBe("Source URL is required before publishing.");
    expect(
      validateCardSource({
        sourceName: "Reuters",
      }),
    ).toBe("Source URL is required before publishing.");
  });

  it("rejects non-http(s) URLs", () => {
    expect(
      validateCardSource({
        sourceName: "Reuters",
        sourceUrl: "ftp://reuters.com/article",
      }),
    ).toBe("Source URL must be a valid http(s) link.");
    expect(
      validateCardSource({
        sourceName: "Reuters",
        sourceUrl: "not-a-url",
      }),
    ).toBe("Source URL must be a valid http(s) link.");
  });

  it("rejects Google News shim URLs (not citable)", () => {
    expect(
      validateCardSource({
        sourceName: "Futu",
        sourceUrl:
          "https://news.google.com/rss/articles/CBMiowFBVV95cUxPOE1aNlBCb3N3NXRsRFcxMXRhWjE1RHhkNGY1MjNfWVhKMDhtYVVZOWFkYnFsRTYwSENzbmY2SE80djJGSHQ5eGExQVlXTmZpWUJHSTVleWdtdVlqR2N3cDlRZ1VrR1djTDd0SVo3emM4TkdvaE",
      }),
    ).toBe("Source URL must be a direct article link (Google News shims are not citable).");
  });

  it("accepts https with a real hostname", () => {
    expect(
      validateCardSource({
        sourceName: "Moomoo",
        sourceUrl: "https://www.moomoo.com/news/post/12345",
      }),
    ).toBeNull();
  });
});
