import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildMarketingEmailFooter,
  buildUnsubscribeUrl,
  shouldIncludeUnsubscribeFooter,
} from "@/lib/email/email-footer";

describe("email-footer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EMAIL_UNSUBSCRIBE_SECRET: "footer-secret",
      NEXT_PUBLIC_SITE_URL: "https://profitpulseally.com",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("includes unsubscribe footer for non-essential email types only", () => {
    expect(shouldIncludeUnsubscribeFooter("market_pulse_reminder")).toBe(true);
    expect(shouldIncludeUnsubscribeFooter("market_pulse_reveal")).toBe(true);
    expect(shouldIncludeUnsubscribeFooter("learning_digest")).toBe(true);
    expect(shouldIncludeUnsubscribeFooter("market_pulse_winner")).toBe(false);
  });

  it("builds an unsubscribe URL without embedding the raw email", () => {
    const url = buildUnsubscribeUrl({
      userId: "user-1",
      email: "player@example.com",
    });

    expect(url.startsWith("https://profitpulseally.com/unsubscribe?token=")).toBe(
      true,
    );
    expect(url).not.toContain("player@example.com");
  });

  it("builds text and html footers with the unsubscribe link", () => {
    const footer = buildMarketingEmailFooter({
      userId: "user-1",
      email: "player@example.com",
    });

    expect(footer.unsubscribeUrl).toContain("/unsubscribe?token=");
    expect(footer.text).toContain("Unsubscribe from non-essential emails");
    expect(footer.html).toContain(footer.unsubscribeUrl);
    expect(footer.html).toContain("/profile");
  });
});
