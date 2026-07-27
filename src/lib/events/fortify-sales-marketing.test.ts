import { describe, expect, it } from "vitest";

import {
  FORTIFY_LUNCH_LEARN_POSTER,
  FORTIFY_LUNCH_LEARN_REGISTRATION_PATH,
  getFortifySalesMarketingEvent,
} from "@/lib/events/fortify-sales-marketing";

describe("getFortifySalesMarketingEvent", () => {
  it("returns open English Lunch & Learn details", () => {
    const event = getFortifySalesMarketingEvent("en");

    expect(event.eventDateTime).toContain("30th July 2026");
    expect(event.eventLocation).toContain("WeWork Taikoo");
    expect(event.eventCost).toBe("Free");
    expect(event.registrationDisabled).toBe(false);
    expect(event.registrationLink).toBe(FORTIFY_LUNCH_LEARN_REGISTRATION_PATH);
    expect(event.speakers[0]?.name).toBe("Vickie Yau");
    expect(event.heroImage?.desktopSrc).toBe(FORTIFY_LUNCH_LEARN_POSTER);
  });

  it("returns Traditional Chinese Lunch & Learn details", () => {
    const event = getFortifySalesMarketingEvent("zh-Hant");

    expect(event.title).toBe("守業增值創未來（Lunch & Learn）");
    expect(event.eventDateTime).toContain("2026年7月30日");
    expect(event.eventCost).toBe("免費");
    expect(event.registrationText).toBe("立即報名");
  });
});
