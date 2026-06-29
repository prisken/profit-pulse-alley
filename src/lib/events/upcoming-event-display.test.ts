import { describe, expect, it } from "vitest";

import { getFortifySalesMarketingShowcase } from "@/lib/events/upcoming-event-display";

describe("getFortifySalesMarketingShowcase", () => {
  it("uses English title and July 17 date for en locale", () => {
    const showcase = getFortifySalesMarketingShowcase("en");

    expect(showcase.title).toContain("Sales and Marketing");
    expect(showcase.date).toBe("July 17, 2026");
    expect(showcase.location).toBe("TBC");
  });

  it("uses Traditional Chinese title and localized date for zh-Hant", () => {
    const showcase = getFortifySalesMarketingShowcase("zh-Hant");

    expect(showcase.title).toBe("守業增值創未來 / 銷售與市場推廣");
    expect(showcase.date).toBe("2026年7月17日");
    expect(showcase.location).toBe("待定");
  });
});
