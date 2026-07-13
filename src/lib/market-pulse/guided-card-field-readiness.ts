import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import {
  collectGuidedRestMissingContentFields,
  collectGuidedSignalMissingContentFields,
  getGuidedCardStatus,
  type GuidedCardStatus,
  type GuidedRestContentFieldId,
  type GuidedSignalContentFieldId,
} from "@/lib/market-pulse/guided-card-status";
import {
  collectGuidedSaveBlockingFields,
  type GuidedSaveBlockingFieldId,
} from "@/lib/market-pulse/guided-card-validation";
import {
  getMissingPpaFields,
  type RevealPpaMissingField,
} from "@/lib/market-pulse/reveal-ppa-validation";

export type { GuidedSaveBlockingFieldId };

export type GuidedContentFieldId =
  | GuidedSignalContentFieldId
  | GuidedRestContentFieldId;

export type GuidedPpaFieldId = "ppaSignal" | "ppaInsight" | "ppaApproval";

export type GuidedReadinessHintKey =
  | "auth.admin.mp.guidedCards.readiness.updatesAfterSave"
  | "auth.admin.mp.guidedCards.readiness.ppaBeforeContent"
  | "auth.admin.mp.guidedCards.readiness.readyToLaunch"
  | "auth.admin.mp.guidedCards.readiness.restNoPpa"
  | "auth.admin.mp.guidedCards.editor.publishedNotice";

export type GuidedCardFieldReadinessInput = Pick<
  MarketPulseAdminCardRow,
  | "cardType"
  | "status"
  | "headline"
  | "newsBody"
  | "companyName"
  | "ticker"
  | "summary"
  | "dayIndex"
  | "cardImageUrl"
  | "cardImageAlt"
  | "ppaSignal"
  | "ppaInsight"
  | "ppaSignalLockedAt"
>;

export type GuidedCardFieldReadiness = {
  status: GuidedCardStatus;
  isPublished: boolean;
  isRest: boolean;
  missingContentFields: GuidedContentFieldId[];
  missingSaveFields: GuidedSaveBlockingFieldId[];
  missingPpaFields: GuidedPpaFieldId[];
  hintKeys: GuidedReadinessHintKey[];
};

function mapMissingPpaFields(
  fields: RevealPpaMissingField[],
): GuidedPpaFieldId[] {
  return fields.map((field) =>
    field === "ppaLocked" ? "ppaApproval" : field,
  );
}

export function getGuidedCardFieldReadiness(
  card: GuidedCardFieldReadinessInput,
): GuidedCardFieldReadiness {
  const isPublished = isCardPublished(card);
  const isRest = isMarketPulseRestCard(card);
  const status = getGuidedCardStatus(card);

  if (isPublished) {
    return {
      status,
      isPublished: true,
      isRest,
      missingContentFields: [],
      missingSaveFields: [],
      missingPpaFields: [],
      hintKeys: ["auth.admin.mp.guidedCards.editor.publishedNotice"],
    };
  }

  const missingContentFields: GuidedContentFieldId[] = isRest
    ? collectGuidedRestMissingContentFields(card)
    : collectGuidedSignalMissingContentFields(card);

  const missingSaveFields = collectGuidedSaveBlockingFields({
    dayIndex: card.dayIndex,
    cardImageUrl: card.cardImageUrl,
    cardImageAlt: card.cardImageAlt,
  });

  const missingPpaFields = isRest
    ? []
    : mapMissingPpaFields(getMissingPpaFields(card));

  const hintKeys: GuidedReadinessHintKey[] = [
    "auth.admin.mp.guidedCards.readiness.updatesAfterSave",
  ];

  if (isRest) {
    hintKeys.push("auth.admin.mp.guidedCards.readiness.restNoPpa");
  } else if (missingContentFields.length > 0) {
    hintKeys.push("auth.admin.mp.guidedCards.readiness.ppaBeforeContent");
  }

  if (status === "ready") {
    hintKeys.push("auth.admin.mp.guidedCards.readiness.readyToLaunch");
  }

  return {
    status,
    isPublished: false,
    isRest,
    missingContentFields,
    missingSaveFields,
    missingPpaFields,
    hintKeys,
  };
}
