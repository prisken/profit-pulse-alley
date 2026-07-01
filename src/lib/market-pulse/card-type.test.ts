import { describe, expect, it } from "vitest";

import {
  isMarketPulsePpaSignal,
  isMarketPulseSignalDecision,
  isRestCardAcknowledgement,
  isRestCardType,
  isSignalCardType,
  MARKET_PULSE_CARD_TYPE_REST,
  MARKET_PULSE_CARD_TYPE_SIGNAL,
} from "@/lib/market-pulse/card-type";

describe("card-type", () => {
  it("identifies signal and rest card types", () => {
    expect(isSignalCardType(MARKET_PULSE_CARD_TYPE_SIGNAL)).toBe(true);
    expect(isRestCardType(MARKET_PULSE_CARD_TYPE_REST)).toBe(true);
    expect(isSignalCardType(MARKET_PULSE_CARD_TYPE_REST)).toBe(false);
  });

  it("narrows PPA signals away from acknowledgement", () => {
    expect(isMarketPulsePpaSignal("BULLISH")).toBe(true);
    expect(isMarketPulsePpaSignal("ACKNOWLEDGED")).toBe(false);
    expect(isMarketPulseSignalDecision("CAUTIOUS")).toBe(true);
    expect(isMarketPulseSignalDecision("ACKNOWLEDGED")).toBe(false);
    expect(isRestCardAcknowledgement("ACKNOWLEDGED")).toBe(true);
  });
});
