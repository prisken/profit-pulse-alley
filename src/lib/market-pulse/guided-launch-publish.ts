import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { getCardPublishBlockReason } from "@/lib/market-pulse/admin-bulk-card-actions";
import { deriveCardPublishedAtFromSchedule } from "@/lib/market-pulse/admin-card-scheduling";

export type GuidedLaunchPublishInput = {
  card: MarketPulseAdminCardRow;
  cycle: { startsAt: Date | string; endsAt: Date | string };
  allCards: MarketPulseAdminCardRow[];
};

export type GuidedLaunchPublishPlan = {
  cardId: string;
  previousStatus: string;
  publishedAt: Date;
};

export function getGuidedLaunchPublishBlockReason(
  input: GuidedLaunchPublishInput,
): string | null {
  if (isCardPublished(input.card)) {
    return null;
  }

  return getCardPublishBlockReason(input.card, {
    cycle: input.cycle,
    allCards: input.allCards,
  });
}

export function planGuidedLaunchCardPublish(
  input: GuidedLaunchPublishInput,
): { ok: true; plan: GuidedLaunchPublishPlan } | { ok: false; error: string } {
  const blockReason = getGuidedLaunchPublishBlockReason(input);
  if (blockReason) {
    return { ok: false, error: blockReason };
  }

  const publishedAt =
    input.card.publishedAt != null
      ? new Date(input.card.publishedAt)
      : deriveCardPublishedAtFromSchedule(
          input.cycle.startsAt,
          input.card.dayIndex,
        );

  return {
    ok: true,
    plan: {
      cardId: input.card.id,
      previousStatus: input.card.status,
      publishedAt,
    },
  };
}

export function planGuidedLaunchPublishes(input: {
  cards: MarketPulseAdminCardRow[];
  cycle: { startsAt: Date | string; endsAt: Date | string };
}): { ok: true; plans: GuidedLaunchPublishPlan[] } | { ok: false; error: string } {
  const plans: GuidedLaunchPublishPlan[] = [];

  for (const card of input.cards) {
    if (isCardPublished(card)) {
      continue;
    }

    const result = planGuidedLaunchCardPublish({
      card,
      cycle: input.cycle,
      allCards: input.cards,
    });

    if (!result.ok) {
      return result;
    }

    plans.push(result.plan);
  }

  return { ok: true, plans };
}
