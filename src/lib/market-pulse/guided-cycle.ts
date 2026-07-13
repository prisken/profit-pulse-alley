import type { MarketPulseCardStatus, MarketPulseCardType } from "@prisma/client";

import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import { MARKET_PULSE_DEFAULT_USER_PROMPT } from "@/lib/market-pulse/card-validation";
import {
  QUICK_DRAFT_CARD_COMPANY_NAME,
  QUICK_DRAFT_CARD_HEADLINE,
  QUICK_DRAFT_CARD_STATUS,
  QUICK_DRAFT_CARD_TICKER,
  QUICK_REST_DRAFT_CARD_HEADLINE,
  QUICK_REST_DRAFT_CARD_HEADLINE_ZH,
  QUICK_REST_DRAFT_CARD_NEWS_BODY,
  QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH,
} from "@/lib/market-pulse/cycle-card-defaults";
import {
  addHktDateOnlyDays,
  compareHktDateOnly,
  guidedCycleEndAtFromDateOnly,
  guidedCycleRevealAtFromDateOnly,
  guidedCycleStartAtFromDateOnly,
  hktDateOnlyDayKey,
} from "@/lib/market-pulse/hkt-time";

export type GuidedCycleDayType = "SIGNAL" | "REST";

export type GuidedCycleDayPlanRow = {
  dayIndex: number;
  hktDate: string;
  dayType: GuidedCycleDayType;
  signalCardCount: number;
};

export type GuidedCycleDayOverride = {
  dayIndex: number;
  dayType: GuidedCycleDayType;
  signalCardCount?: number;
};

export type GuidedCycleFormInput = {
  name: string;
  startDate: string;
  endDate: string;
  revealDate: string;
  defaultSignalCardsPerDay: number;
  dayOverrides?: GuidedCycleDayOverride[];
};

export type GuidedCycleFieldErrors = Partial<
  Record<
    | "name"
    | "startDate"
    | "endDate"
    | "revealDate"
    | "defaultSignalCardsPerDay"
    | "dayPlan",
    string
  >
>;

export type GuidedCycleResolvedDates = {
  startsAt: Date;
  endsAt: Date;
  revealAt: Date;
};

export type GuidedCycleCardCreateData = {
  dayIndex: number;
  sortOrder: number;
  cardType: MarketPulseCardType;
  companyName: string;
  ticker: string;
  headline: string;
  headlineZhHant?: string;
  newsBody?: string;
  newsBodyZhHant?: string;
  userPrompt?: string;
  status: MarketPulseCardStatus;
  sourceDate: Date;
  ppaSignal: null;
  ppaInsight: null;
  publishedAt: null;
};

export type GuidedCycleValidationResult =
  | {
      valid: true;
      dates: GuidedCycleResolvedDates;
      dayPlan: GuidedCycleDayPlanRow[];
      cards: GuidedCycleCardCreateData[];
      signalCardCount: number;
      restCardCount: number;
    }
  | {
      valid: false;
      error: string;
      fieldErrors: GuidedCycleFieldErrors;
    };

function normalizeSignalCardCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 1;
  }
  return Math.max(1, Math.floor(count));
}

export function buildGuidedCycleDayPlan(input: {
  startDate: string;
  endDate: string;
  defaultSignalCardsPerDay: number;
  dayOverrides?: GuidedCycleDayOverride[];
}): GuidedCycleDayPlanRow[] | null {
  const startKey = hktDateOnlyDayKey(input.startDate);
  const endKey = hktDateOnlyDayKey(input.endDate);
  if (!startKey || !endKey) {
    return null;
  }

  const comparison = compareHktDateOnly(input.startDate, input.endDate);
  if (comparison === null || comparison > 0) {
    return null;
  }

  const defaultCount = normalizeSignalCardCount(input.defaultSignalCardsPerDay);
  const overrideByDay = new Map(
    (input.dayOverrides ?? []).map((row) => [row.dayIndex, row]),
  );

  const rows: GuidedCycleDayPlanRow[] = [];
  let currentDate = startKey;
  let dayIndex = 1;

  while (currentDate <= endKey) {
    const override = overrideByDay.get(dayIndex);
    const dayType = override?.dayType ?? "SIGNAL";
    const signalCardCount =
      dayType === "REST"
        ? 1
        : normalizeSignalCardCount(
            override?.signalCardCount ?? defaultCount,
          );

    rows.push({
      dayIndex,
      hktDate: currentDate,
      dayType,
      signalCardCount,
    });

    if (currentDate === endKey) {
      break;
    }

    const nextDate = addHktDateOnlyDays(currentDate, 1);
    if (!nextDate) {
      return null;
    }
    currentDate = nextDate;
    dayIndex += 1;
  }

  return rows;
}

export function buildGuidedCycleCardCreates(
  cycleStartsAt: Date,
  dayPlan: GuidedCycleDayPlanRow[],
): GuidedCycleCardCreateData[] {
  const cards: GuidedCycleCardCreateData[] = [];

  for (const row of dayPlan) {
    const sourceDate = getCycleDayReleaseAt(cycleStartsAt, row.dayIndex);

    if (row.dayType === "REST") {
      cards.push({
        dayIndex: row.dayIndex,
        sortOrder: 0,
        cardType: "REST",
        companyName: "",
        ticker: "",
        headline: QUICK_REST_DRAFT_CARD_HEADLINE,
        headlineZhHant: QUICK_REST_DRAFT_CARD_HEADLINE_ZH,
        newsBody: QUICK_REST_DRAFT_CARD_NEWS_BODY,
        newsBodyZhHant: QUICK_REST_DRAFT_CARD_NEWS_BODY_ZH,
        status: QUICK_DRAFT_CARD_STATUS,
        sourceDate,
        ppaSignal: null,
        ppaInsight: null,
        publishedAt: null,
      });
      continue;
    }

    for (let sortOrder = 0; sortOrder < row.signalCardCount; sortOrder += 1) {
      cards.push({
        dayIndex: row.dayIndex,
        sortOrder,
        cardType: "SIGNAL",
        companyName: QUICK_DRAFT_CARD_COMPANY_NAME,
        ticker: QUICK_DRAFT_CARD_TICKER,
        headline: QUICK_DRAFT_CARD_HEADLINE,
        userPrompt: MARKET_PULSE_DEFAULT_USER_PROMPT,
        status: QUICK_DRAFT_CARD_STATUS,
        sourceDate,
        ppaSignal: null,
        ppaInsight: null,
        publishedAt: null,
      });
    }
  }

  return cards;
}

export function validateGuidedCycleInput(
  input: GuidedCycleFormInput,
): GuidedCycleValidationResult {
  const fieldErrors: GuidedCycleFieldErrors = {};
  const name = input.name.trim();

  if (!name) {
    fieldErrors.name = "Cycle name is required.";
  }

  const startsAt = guidedCycleStartAtFromDateOnly(input.startDate);
  if (!input.startDate.trim() || !startsAt) {
    fieldErrors.startDate = "Start date is required.";
  }

  const endsAt = guidedCycleEndAtFromDateOnly(input.endDate);
  if (!input.endDate.trim() || !endsAt) {
    fieldErrors.endDate = "End date is required.";
  }

  const revealAt = guidedCycleRevealAtFromDateOnly(input.revealDate);
  if (!input.revealDate.trim() || !revealAt) {
    fieldErrors.revealDate = "Reveal date is required.";
  }

  const defaultSignalCardsPerDay = normalizeSignalCardCount(
    input.defaultSignalCardsPerDay,
  );
  if (
    !Number.isFinite(input.defaultSignalCardsPerDay) ||
    input.defaultSignalCardsPerDay < 1
  ) {
    fieldErrors.defaultSignalCardsPerDay =
      "Default signal cards per day must be at least 1.";
  }

  const startEndCompare = compareHktDateOnly(input.startDate, input.endDate);
  if (startEndCompare !== null && startEndCompare > 0) {
    fieldErrors.endDate = "End date must be on or after start date.";
  }

  const endRevealCompare = compareHktDateOnly(input.endDate, input.revealDate);
  if (endRevealCompare !== null && endRevealCompare >= 0) {
    fieldErrors.revealDate = "Reveal date must be after end date.";
  }

  const dayPlan = buildGuidedCycleDayPlan({
    startDate: input.startDate,
    endDate: input.endDate,
    defaultSignalCardsPerDay,
    dayOverrides: input.dayOverrides,
  });

  if (!dayPlan || dayPlan.length === 0) {
    fieldErrors.dayPlan = "Day plan could not be generated from the dates.";
  } else {
    for (const row of dayPlan) {
      if (row.dayType === "SIGNAL" && row.signalCardCount < 1) {
        fieldErrors.dayPlan = "Signal days must have at least 1 card.";
        break;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !startsAt || !endsAt || !revealAt || !dayPlan) {
    const firstError =
      fieldErrors.name ??
      fieldErrors.startDate ??
      fieldErrors.endDate ??
      fieldErrors.revealDate ??
      fieldErrors.defaultSignalCardsPerDay ??
      fieldErrors.dayPlan ??
      "Invalid guided cycle input.";

    return {
      valid: false,
      error: firstError,
      fieldErrors,
    };
  }

  const cards = buildGuidedCycleCardCreates(startsAt, dayPlan);
  const signalCardCount = cards.filter((card) => card.cardType === "SIGNAL").length;
  const restCardCount = cards.filter((card) => card.cardType === "REST").length;

  return {
    valid: true,
    dates: { startsAt, endsAt, revealAt },
    dayPlan,
    cards,
    signalCardCount,
    restCardCount,
  };
}
