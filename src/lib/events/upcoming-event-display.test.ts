import { describe, expect, it } from "vitest";

import { getFortifySalesMarketingShowcase } from "@/lib/events/upcoming-event-display";

describe("getFortifySalesMarketingShowcase", () => {
  it("uses Lunch & Learn title and 30 July date for en locale", () => {
    const showcase = getFortifySalesMarketingShowcase("en");

    expect(showcase.title).toContain("Lunch & Learn");
    expect(showcase.date).toContain("30th July 2026");
    expect(showcase.location).toContain("WeWork Taikoo");
  });

  it("uses Traditional Chinese title and localized date for zh-Hant", () => {
    const showcase = getFortifySalesMarketingShowcase("zh-Hant");

    expect(showcase.title).toBe("守業增值創未來（Lunch & Learn）");
    expect(showcase.date).toContain("2026年7月30日");
    expect(showcase.location).toContain("WeWork Taikoo");
  });
});
