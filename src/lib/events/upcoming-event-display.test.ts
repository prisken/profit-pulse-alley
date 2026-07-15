import { describe, expect, it } from "vitest";

import { getFortifySalesMarketingShowcase } from "@/lib/events/upcoming-event-display";

describe("getFortifySalesMarketingShowcase", () => {
  it("uses Lunch & Learn title and July date for en locale", () => {
    const showcase = getFortifySalesMarketingShowcase("en");

    expect(showcase.title).toContain("Lunch & Learn");
    expect(showcase.date).toBe("July");
    expect(showcase.location).toBe("TBC");
  });

  it("uses Traditional Chinese title and localized date for zh-Hant", () => {
    const showcase = getFortifySalesMarketingShowcase("zh-Hant");

    expect(showcase.title).toBe("守業增值創未來（Lunch & Learn）");
    expect(showcase.date).toBe("7月");
    expect(showcase.location).toBe("待定");
  });
});
