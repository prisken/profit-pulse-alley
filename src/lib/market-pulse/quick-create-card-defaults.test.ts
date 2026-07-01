import { describe, expect, it } from "vitest";

import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import { MARKET_PULSE_PUBLIC_LAUNCH_AT } from "@/lib/market-pulse/launch-config";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_TICKER,
  buildQuickDraftCardDefaults,
  nextQuickDraftDayIndex,
} from "@/lib/market-pulse/quick-create-card-defaults";

describe("quick-create-card-defaults re-exports", () => {
  it("re-exports cycle-card-defaults helpers", () => {
    expect(nextQuickDraftDayIndex([])).toBe(1);

    const defaults = buildQuickDraftCardDefaults({
      cycle: {
        startsAt: MARKET_PULSE_PUBLIC_LAUNCH_AT,
        revealAt: new Date("2026-04-01T12:00:00+08:00"),
        prizeLabel: null,
      },
      cards: [],
    });

    expect(defaults.dayIndex).toBe(1);
    expect(defaults.headline).toBe(QUICK_DRAFT_CARD_HEADLINE);
    expect(defaults.companyName).toBe(QUICK_DRAFT_CARD_COMPANY_NAME);
    expect(defaults.ticker).toBe(QUICK_DRAFT_CARD_TICKER);
    expect(defaults.userPrompt).toBe(MARKET_PULSE_DEFAULT_USER_PROMPT);
    expect(defaults.status).toBe("DRAFT");
    expect(defaults.sourceDate.getTime()).toBe(MARKET_PULSE_PUBLIC_LAUNCH_AT.getTime());
  });
});
