import type { SiteLocale } from "@/lib/i18n/locales";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import type { CyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import { MARKET_PULSE_PUBLIC_LAUNCH_SUBMIT_ERROR } from "@/lib/market-pulse/launch-config";

const ERROR_KEY_BY_MESSAGE: Record<string, MessageKey> = {
  "No card available.": "mp.error.noCardAvailable",
  "Sign in required.": "mp.error.signInRequired",
  "Decision must be BULLISH or CAUTIOUS.": "mp.error.invalidDecision",
  "Market Pulse is not open for decisions.": "mp.error.gameClosed",
  "Card not found.": "mp.error.cardNotFound",
  "This challenge cycle is not open.": "mp.error.cycleNotOpen",
  "This card is not published.": "mp.error.cardNotPublished",
  "This challenge cycle has not started yet.": "mp.error.cycleNotStarted",
  "This card is not part of the active challenge.": "mp.error.cardNotInChallenge",
  "This card is not available for decisions right now.":
    "mp.error.cardUnavailable",
  "This card is not ready for decisions.": "mp.error.cardNotReady",
  "The decision window for this card has closed.": "mp.error.windowClosed",
  "This card is not yet available.": "mp.error.cardNotYetAvailable",
  "No playable card is available right now.": "mp.error.noPlayableCard",
  "You have already submitted a decision for this card.":
    "mp.error.alreadySubmitted",
  "Something went wrong. Please try again.": "mp.error.generic",
};

const CYCLE_ISSUE_KEYS: Record<CyclePlayabilityIssue, MessageKey> = {
  not_open: "mp.play.issue.notOpen",
  not_started: "mp.play.issue.notStarted",
  reveal_passed: "mp.play.issue.revealPassed",
};

export function translateMarketPulseError(
  locale: SiteLocale,
  error: string,
): string {
  const exact = ERROR_KEY_BY_MESSAGE[error];
  if (exact) {
    return translate(locale, exact);
  }

  if (
    error.includes("not open for play yet") ||
    error.includes(MARKET_PULSE_PUBLIC_LAUNCH_SUBMIT_ERROR)
  ) {
    return translate(locale, "mp.error.preLaunch");
  }

  return error;
}

export function translateCyclePlayabilityIssue(
  locale: SiteLocale,
  issue: CyclePlayabilityIssue,
): string {
  return translate(locale, CYCLE_ISSUE_KEYS[issue]);
}

export function formatRevealMessage(
  locale: SiteLocale,
  revealAtLabel: string | null | undefined,
): string {
  if (revealAtLabel) {
    return translate(locale, "mp.play.reveal.scheduled").replace(
      "{date}",
      revealAtLabel,
    );
  }
  return translate(locale, "mp.play.reveal.default");
}
