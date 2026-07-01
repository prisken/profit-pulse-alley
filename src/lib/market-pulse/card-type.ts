import type { MarketPulseCardType, MarketPulseSignal } from "@prisma/client";

import type { MarketPulseDecision } from "@/lib/market-pulse/constants";

/** Default card kind for published signal/news cards. */
export const MARKET_PULSE_CARD_TYPE_SIGNAL = "SIGNAL" as const satisfies MarketPulseCardType;

/** Market rest day card — participation only, no PPA or prediction. */
export const MARKET_PULSE_CARD_TYPE_REST = "REST" as const satisfies MarketPulseCardType;

/** All values stored on `MarketPulseDecision.decision`. */
export const MARKET_PULSE_PLAYER_CHOICES = [
  "BULLISH",
  "CAUTIOUS",
  "ACKNOWLEDGED",
] as const;

export type MarketPulsePlayerChoice = (typeof MARKET_PULSE_PLAYER_CHOICES)[number];

/** PPA signal values only — excludes rest-card acknowledgement. */
export const MARKET_PULSE_PPA_SIGNAL_VALUES = ["BULLISH", "CAUTIOUS"] as const;

export type MarketPulsePpaSignal = (typeof MARKET_PULSE_PPA_SIGNAL_VALUES)[number];

export type MarketPulseCardTypeSource = {
  cardType?: MarketPulseCardType | null;
};

/** Admin dashboard labels for card type filters and badges. */
export const MARKET_PULSE_CARD_TYPE_ADMIN_LABELS: Record<MarketPulseCardType, string> = {
  SIGNAL: "Signal card",
  REST: "Market rest card",
};

/** Player-facing short labels for card kind. */
export const MARKET_PULSE_CARD_TYPE_PLAYER_LABELS: Record<MarketPulseCardType, string> = {
  SIGNAL: "Market signal",
  REST: "Market rest card",
};

/** Admin PPA badge copy when a card does not require PPA. */
export const MARKET_PULSE_REST_CARD_PPA_ADMIN_LABEL =
  "Rest card — no PPA required";

export function resolveMarketPulseCardType(
  cardType: MarketPulseCardType | null | undefined,
): MarketPulseCardType {
  return cardType ?? MARKET_PULSE_CARD_TYPE_SIGNAL;
}

export function isSignalCardType(
  cardType: MarketPulseCardType,
): cardType is typeof MARKET_PULSE_CARD_TYPE_SIGNAL {
  return cardType === MARKET_PULSE_CARD_TYPE_SIGNAL;
}

export function isRestCardType(
  cardType: MarketPulseCardType,
): cardType is typeof MARKET_PULSE_CARD_TYPE_REST {
  return cardType === MARKET_PULSE_CARD_TYPE_REST;
}

export function isMarketPulseSignalCard(
  card: MarketPulseCardTypeSource,
): boolean {
  return isSignalCardType(resolveMarketPulseCardType(card.cardType));
}

export function isMarketPulseRestCard(
  card: MarketPulseCardTypeSource,
): boolean {
  return isRestCardType(resolveMarketPulseCardType(card.cardType));
}

export function cardTypeRequiresPpa(card: MarketPulseCardTypeSource): boolean {
  return isMarketPulseSignalCard(card);
}

export function isMarketPulsePpaSignal(
  value: MarketPulseSignal | null | undefined,
): value is MarketPulsePpaSignal {
  return value === "BULLISH" || value === "CAUTIOUS";
}

export function isMarketPulseSignalDecision(
  value: MarketPulseSignal,
): value is MarketPulseDecision {
  return value === "BULLISH" || value === "CAUTIOUS";
}

export function isRestCardAcknowledgement(
  value: MarketPulseSignal,
): value is "ACKNOWLEDGED" {
  return value === "ACKNOWLEDGED";
}

export type PlayerDecisionValidationResult =
  | { ok: true; decision: MarketPulsePlayerChoice }
  | { ok: false; error: string };

/** Validates a player submission against the card kind. */
export function validatePlayerDecisionForCard(
  card: MarketPulseCardTypeSource,
  decision: string,
): PlayerDecisionValidationResult {
  if (isMarketPulseRestCard(card)) {
    if (decision !== "ACKNOWLEDGED") {
      if (decision === "BULLISH" || decision === "CAUTIOUS") {
        return {
          ok: false,
          error: "BULLISH and CAUTIOUS are not valid for Market rest cards.",
        };
      }
      return {
        ok: false,
        error: "Rest cards require participation acknowledgement.",
      };
    }
    return { ok: true, decision: "ACKNOWLEDGED" };
  }

  if (decision === "ACKNOWLEDGED") {
    return {
      ok: false,
      error: "ACKNOWLEDGED is only valid for Market rest cards.",
    };
  }

  if (!isMarketPulseSignalDecision(decision as MarketPulseSignal)) {
    return { ok: false, error: "Decision must be BULLISH or CAUTIOUS." };
  }

  return { ok: true, decision: decision as MarketPulseDecision };
}
