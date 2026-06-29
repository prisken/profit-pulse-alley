import { describe, expect, it } from "vitest";

import { getPastEventsShowcase } from "@/lib/events/home-events-hub";

describe("getPastEventsShowcase", () => {
  it("includes archived Fortify Your Future event", () => {
    const past = getPastEventsShowcase("en");
    const fortify = past.find(
      (event) => event.archiveHref === "/events/fortify-your-future",
    );

    expect(fortify).toBeDefined();
    expect(fortify?.title).toContain("Fortify Your Future");
  });

  it("localizes Fortify past card title for zh-Hant", () => {
    const past = getPastEventsShowcase("zh-Hant");
    const fortify = past.find(
      (event) => event.archiveHref === "/events/fortify-your-future",
    );

    expect(fortify?.title).toBe("守業增值創未來");
  });

  it("omits archive links for placeholder past events without pages", () => {
    const past = getPastEventsShowcase("en");
    const salon = past.find((event) =>
      event.title.includes("Zero-Cost Life Salon"),
    );
    const roundtable = past.find((event) =>
      event.title.includes("Funding Roundtable"),
    );

    expect(salon?.archiveHref).toBeUndefined();
    expect(roundtable?.archiveHref).toBeUndefined();
  });
});
