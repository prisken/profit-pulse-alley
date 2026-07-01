import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { getBuilderCardValidationStatus } from "@/lib/market-pulse/admin-builder-card-status";
import { buildBuilderCardValidationSummaryFromRow } from "@/lib/market-pulse/admin-builder-card-validation";
import {
  isValidOptionalHttpUrl,
  parseCardDate,
} from "@/lib/market-pulse/card-validation";
import {
  MARKET_PULSE_CYCLE_STATUS_OPTIONS,
  validateMarketPulseCycleDates,
} from "@/lib/market-pulse/cycle-validation";
import {
  getCardSchedulingConflictMessages,
  getCycleDayCapacity,
} from "@/lib/market-pulse/admin-card-scheduling";
import {
  getMissingPpaFields,
  type RevealPpaMissingField,
} from "@/lib/market-pulse/reveal-ppa-validation";

export type CycleReadinessOverallStatus = "ready" | "needs_attention";

export type CycleReadinessCardStatus =
  | "published"
  | "ready"
  | "draft_missing_fields"
  | "conflict";

export type CycleReadinessIssue = {
  scope: "cycle" | "card";
  cardId?: string;
  dayIndex?: number;
  code: string;
  message: string;
};

export type CycleReadinessCardRow = {
  cardId: string;
  dayIndex: number;
  headline: string;
  status: CycleReadinessCardStatus;
  issues: string[];
};

export type CycleReadinessReport = {
  overallStatus: CycleReadinessOverallStatus;
  issueCount: number;
  cycleIssues: CycleReadinessIssue[];
  cardIssues: CycleReadinessIssue[];
  cards: CycleReadinessCardRow[];
};

const PLAYER_FACING_CYCLE_STATUSES = new Set(["OPEN", "CLOSED", "REVEALED"]);

function formatRevealPpaIssue(field: RevealPpaMissingField): string {
  switch (field) {
    case "ppaSignal":
      return "PPA signal is required for reveal and scoring.";
    case "ppaInsight":
      return "PPA insight is required for the reveal page.";
    case "ppaLocked":
      return "PPA signal must be locked before reveal.";
    default:
      return "PPA fields are incomplete for reveal.";
  }
}

export function getCycleReadinessCardStatus(
  card: MarketPulseAdminCardRow,
  hasSchedulingConflict = false,
): CycleReadinessCardStatus {
  if (hasSchedulingConflict) {
    return "conflict";
  }

  if (isCardPublished(card)) {
    return "published";
  }

  if (getBuilderCardValidationStatus(card) === "ready_to_publish") {
    return "ready";
  }

  return "draft_missing_fields";
}

function collectCardMediaIssues(card: MarketPulseAdminCardRow): string[] {
  const issues: string[] = [];

  if (card.logoUrl?.trim() && !isValidOptionalHttpUrl(card.logoUrl)) {
    issues.push("Company logo URL must be a valid http(s) URL.");
  }
  if (card.sourceUrl?.trim() && !isValidOptionalHttpUrl(card.sourceUrl)) {
    issues.push("News source URL must be a valid http(s) URL.");
  }
  if (card.cardImageUrl?.trim() && !isValidOptionalHttpUrl(card.cardImageUrl)) {
    issues.push("Card image URL must be a valid http(s) URL.");
  }
  if (card.cardImageUrl?.trim() && !card.cardImageAlt?.trim()) {
    issues.push("Card image alt text is required when an image URL is set.");
  }
  if (card.sourceDate?.trim() && !parseCardDate(card.sourceDate)) {
    issues.push("Invalid news published date.");
  }
  if (card.revealAt?.trim() && !parseCardDate(card.revealAt)) {
    issues.push("Invalid card reveal date.");
  }
  if (card.publishedAt?.trim() && !parseCardDate(card.publishedAt)) {
    issues.push("Invalid published date.");
  }

  return issues;
}

function collectCardContentIssues(
  card: MarketPulseAdminCardRow,
  allDayIndexes: number[],
): string[] {
  const issues = collectCardMediaIssues(card);

  if (!Number.isInteger(card.dayIndex) || card.dayIndex < 1) {
    issues.push("Day index must be a positive integer.");
  }

  if (!Number.isInteger(card.sortOrder) || card.sortOrder < 0) {
    issues.push("Order within day must be zero or greater.");
  }

  if (!card.userPrompt?.trim()) {
    issues.push("Player prompt is required.");
  }

  if (isCardPublished(card)) {
    for (const field of getMissingPpaFields(card)) {
      const message = formatRevealPpaIssue(field);
      if (!issues.includes(message)) {
        issues.push(message);
      }
    }
    return issues;
  }

  const summary = buildBuilderCardValidationSummaryFromRow(card, allDayIndexes);
  for (const message of summary.issues) {
    if (!issues.includes(message)) {
      issues.push(message);
    }
  }

  return issues;
}

export function evaluateCycleReadiness(
  cycle: MarketPulseAdminCycleRow,
  cards: MarketPulseAdminCardRow[],
): CycleReadinessReport {
  const cycleIssues: CycleReadinessIssue[] = [];
  const cardIssues: CycleReadinessIssue[] = [];
  const allDayIndexes = cards.map((card) => card.dayIndex);
  const cycleSpan = { startsAt: cycle.startsAt, endsAt: cycle.endsAt };

  const cycleDateError = validateMarketPulseCycleDates({
    name: cycle.name,
    startsAt: new Date(cycle.startsAt),
    endsAt: new Date(cycle.endsAt),
    revealAt: new Date(cycle.revealAt),
  });
  if (cycleDateError) {
    cycleIssues.push({
      scope: "cycle",
      code: "cycle_dates",
      message: cycleDateError,
    });
  }

  if (!MARKET_PULSE_CYCLE_STATUS_OPTIONS.includes(cycle.status)) {
    cycleIssues.push({
      scope: "cycle",
      code: "cycle_status",
      message: `Invalid cycle status: ${cycle.status}.`,
    });
  }

  if (
    PLAYER_FACING_CYCLE_STATUSES.has(cycle.status) &&
    !cycle.prizeLabel?.trim()
  ) {
    cycleIssues.push({
      scope: "cycle",
      code: "cycle_prize",
      message: "Prize label is required for player-facing cycles.",
    });
  }

  if (cards.length === 0) {
    cycleIssues.push({
      scope: "cycle",
      code: "cycle_no_cards",
      message: "At least one card is required.",
    });
  }

  const capacity = getCycleDayCapacity(cycle.startsAt, cycle.endsAt);
  const cardsBeyondCapacity = cards.filter((card) => card.dayIndex > capacity);
  if (cardsBeyondCapacity.length > 0) {
    cycleIssues.push({
      scope: "cycle",
      code: "cycle_day_capacity",
      message: `${cardsBeyondCapacity.length} card(s) have a day index beyond the ${capacity}-day cycle span.`,
    });
  }

  const cardRows: CycleReadinessCardRow[] = [];

  for (const card of cards) {
    const issues = collectCardContentIssues(card, allDayIndexes);
    const schedulingIssues = getCardSchedulingConflictMessages(
      card,
      cycleSpan,
      cards,
    );

    for (const message of schedulingIssues) {
      if (!issues.includes(message)) {
        issues.push(message);
      }
    }

    for (const message of issues) {
      cardIssues.push({
        scope: "card",
        cardId: card.id,
        dayIndex: card.dayIndex,
        code: "card_validation",
        message,
      });
    }

    cardRows.push({
      cardId: card.id,
      dayIndex: card.dayIndex,
      headline: card.headline,
      status: getCycleReadinessCardStatus(
        card,
        schedulingIssues.length > 0,
      ),
      issues,
    });
  }

  cardRows.sort((a, b) => a.dayIndex - b.dayIndex);

  const issueCount = cycleIssues.length + cardIssues.length;

  return {
    overallStatus: issueCount === 0 ? "ready" : "needs_attention",
    issueCount,
    cycleIssues,
    cardIssues,
    cards: cardRows,
  };
}
