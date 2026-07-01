import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { getAdminCardPpaStatus } from "@/lib/market-pulse/admin-card-ppa-status";
import { getCardSchedulingPublishBlockReason } from "@/lib/market-pulse/admin-card-scheduling";
import {
  validateCardPublishable,
  validateMarketPulseCardDraftSave,
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";

export type BuilderCardValidationSummary = {
  publishReady: boolean;
  issues: string[];
};

export function buildBuilderCardValidationSummary(input: {
  values: MarketPulseCardFormValues;
  existingDayIndexes: number[];
  excludeDayIndex?: number;
  ppaSignalLockedAt: string | null;
  cycle?: { startsAt: Date | string; endsAt: Date | string };
  schedulingCards?: Array<
    Pick<MarketPulseAdminCardRow, "id" | "dayIndex" | "sourceDate" | "status">
  >;
  cardId?: string;
}): BuilderCardValidationSummary {
  const issues: string[] = [];

  const draftValidation = validateMarketPulseCardDraftSave(input.values, {
    existingDayIndexes: input.existingDayIndexes,
    excludeDayIndex: input.excludeDayIndex,
  });

  for (const message of Object.values(draftValidation.errors)) {
    if (message) {
      issues.push(message);
    }
  }

  const publishError = validateCardPublishable({
    headline: input.values.headline,
    companyName: input.values.companyName,
    ticker: input.values.ticker,
    summary: input.values.summary,
    ppaSignal: input.values.ppaSignal || null,
    ppaInsight: input.values.ppaInsight,
    ppaSignalLockedAt: input.ppaSignalLockedAt,
  });

  if (publishError && !issues.includes(publishError)) {
    issues.push(publishError);
  }

  const ppaStatus = getAdminCardPpaStatus({
    ppaSignal: input.values.ppaSignal || null,
    ppaInsight: input.values.ppaInsight,
    ppaSignalLockedAt: input.ppaSignalLockedAt,
  });

  if (ppaStatus.needsPpa) {
    if (ppaStatus.kind === "missing_signal") {
      issues.push("PPA signal is required to publish.");
    } else if (ppaStatus.kind === "missing_insight") {
      issues.push("PPA insight is required to publish.");
    } else if (ppaStatus.kind === "not_locked") {
      issues.push("PPA signal must be locked before publishing.");
    } else {
      issues.push("PPA signal and insight must be complete and locked to publish.");
    }
  }

  if (input.cycle && input.schedulingCards && input.cardId) {
    const schedulingError = getCardSchedulingPublishBlockReason(
      {
        id: input.cardId,
        dayIndex: input.values.dayIndex,
        sourceDate: input.values.sourceDate || null,
        status: input.values.status,
      },
      input.cycle,
      input.schedulingCards.map((card) =>
        card.id === input.cardId
          ? {
              ...card,
              dayIndex: input.values.dayIndex,
              sourceDate: input.values.sourceDate || null,
            }
          : card,
      ),
    );
    if (schedulingError && !issues.includes(schedulingError)) {
      issues.push(schedulingError);
    }
  }

  return {
    publishReady: issues.length === 0,
    issues: [...new Set(issues)],
  };
}

export function buildBuilderCardValidationSummaryFromRow(
  card: MarketPulseAdminCardRow,
  existingDayIndexes: number[],
): BuilderCardValidationSummary {
  return buildBuilderCardValidationSummary({
    values: {
      cycleId: card.cycleId,
      dayIndex: card.dayIndex,
      sortOrder: card.sortOrder,
      companyName: card.companyName,
      companyNameZh: card.companyNameZh ?? "",
      ticker: card.ticker,
      exchange: card.exchange ?? "",
      logoUrl: card.logoUrl ?? "",
      logoInitials: card.logoInitials ?? "",
      priceLabel: card.priceLabel ?? "",
      priceDirection: card.priceDirection ?? "",
      headline: card.headline,
      headlineZhHant: card.headlineZhHant ?? "",
      newsBody: card.newsBody ?? "",
      newsBodyZhHant: card.newsBodyZhHant ?? "",
      sourceName: card.sourceName ?? "",
      sourceUrl: card.sourceUrl ?? "",
      sourceDate: card.sourceDate ?? "",
      cardImageUrl: card.cardImageUrl ?? "",
      cardImageAlt: card.cardImageAlt ?? "",
      cardImageAltZhHant: card.cardImageAltZhHant ?? "",
      summary: card.summary ?? "",
      summaryZhHant: card.summaryZhHant ?? "",
      userPrompt: card.userPrompt ?? "",
      userPromptZhHant: card.userPromptZhHant ?? "",
      ppaSignal: card.ppaSignal ?? "",
      ppaInsight: card.ppaInsight ?? "",
      ppaInsightZhHant: card.ppaInsightZhHant ?? "",
      status: card.status,
      publishedAt: card.publishedAt ?? "",
      revealAt: card.revealAt ?? "",
      changeReason: "",
    },
    existingDayIndexes,
    excludeDayIndex: card.dayIndex,
    ppaSignalLockedAt: card.ppaSignalLockedAt,
  });
}
