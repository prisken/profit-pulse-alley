import { describe, expect, it } from "vitest";

import { translate } from "@/lib/i18n/messages";
import { enMessages } from "@/lib/i18n/messages/en";
import {
  parseSiteLocale,
  siteLocaleToMarketPulseLocale,
} from "@/lib/i18n/locales";

describe("parseSiteLocale", () => {
  it("defaults to English for unknown values", () => {
    expect(parseSiteLocale(null)).toBe("en");
    expect(parseSiteLocale("fr")).toBe("en");
  });

  it("accepts supported locales", () => {
    expect(parseSiteLocale("zh-Hant")).toBe("zh-Hant");
  });
});

describe("siteLocaleToMarketPulseLocale", () => {
  it("maps zh-Hant to zh-HK launch copy", () => {
    expect(siteLocaleToMarketPulseLocale("zh-Hant")).toBe("zh-HK");
    expect(siteLocaleToMarketPulseLocale("en")).toBe("en");
  });
});

describe("translate", () => {
  it("includes core navigation keys in both locales", () => {
    for (const key of Object.keys(enMessages) as (keyof typeof enMessages)[]) {
      expect(translate("en", key)).toBeTruthy();
      expect(translate("zh-Hant", key)).toBeTruthy();
    }
  });

  it("translates bullish and cautious", () => {
    expect(translate("en", "signal.bullish")).toBe("Bullish");
    expect(translate("zh-Hant", "signal.cautious")).toBe("謹慎");
  });
});
