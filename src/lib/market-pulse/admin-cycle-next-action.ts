import type { MarketPulseCycleStatus } from "@prisma/client";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  marketPulseCycleBuilderPath,
  marketPulseGuidedCardsPath,
  marketPulseGuidedLaunchPath,
} from "@/lib/market-pulse/admin-builder-paths";
import {
  evaluateGuidedLaunchReadiness,
  GUIDED_LAUNCH_ELIGIBLE_STATUSES,
  isGuidedLaunchAlreadyComplete,
} from "@/lib/market-pulse/guided-launch-readiness";

export type MarketPulseCycleNextActionKind =
  | "fill_guided_cards"
  | "review_and_launch"
  | "launched"
  | "closed"
  | "revealed"
  | "archived"
  | "advanced_builder";

export type MarketPulseCycleNextActionEmphasis = "primary" | "secondary" | "muted";

export type MarketPulseCycleNextAction = {
  kind: MarketPulseCycleNextActionKind;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  href?: string;
  emphasis: MarketPulseCycleNextActionEmphasis;
  secondaryHref?: string;
  secondaryLabelKey?: MessageKey;
  disabledReason?: MessageKey;
};

export type MarketPulseCycleNextActionInput = {
  cycleId: string;
  cycleStatus: MarketPulseCycleStatus;
  cards: MarketPulseAdminCardRow[] | null | undefined;
  activeCycleId: string | null;
  runtimeStatus: string;
};

export type HubCycleActionLinks = {
  primaryHref: string | null;
  primaryLabelKey: MessageKey | null;
  primaryEmphasis: MarketPulseCycleNextActionEmphasis | null;
  secondaryLinks: Array<{ href: string; labelKey: MessageKey }>;
  showFillGuidedCards: boolean;
  showReviewAndLaunch: boolean;
};

export function canUseGuidedFlowForCycle(status: MarketPulseCycleStatus): boolean {
  return GUIDED_LAUNCH_ELIGIBLE_STATUSES.includes(status);
}

export function getMarketPulseCycleNextAction(
  input: MarketPulseCycleNextActionInput,
): MarketPulseCycleNextAction {
  const builderHref = marketPulseCycleBuilderPath(input.cycleId);
  const guidedCardsHref = marketPulseGuidedCardsPath(input.cycleId);
  const guidedLaunchHref = marketPulseGuidedLaunchPath(input.cycleId);

  if (input.cycleStatus === "ARCHIVED") {
    return {
      kind: "archived",
      labelKey: "auth.admin.mp.hub.nextAction.archived.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.archived.description",
      emphasis: "muted",
      disabledReason: "auth.admin.mp.hub.nextAction.archived.description",
    };
  }

  if (input.cycleStatus === "REVEALED") {
    return {
      kind: "revealed",
      labelKey: "auth.admin.mp.hub.nextAction.revealed.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.revealed.description",
      emphasis: "muted",
      secondaryHref: builderHref,
      secondaryLabelKey: "auth.admin.mp.openBuilder",
    };
  }

  if (input.cycleStatus === "CLOSED") {
    return {
      kind: "closed",
      labelKey: "auth.admin.mp.hub.nextAction.closed.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.closed.description",
      emphasis: "muted",
      secondaryHref: builderHref,
      secondaryLabelKey: "auth.admin.mp.openBuilder",
    };
  }

  if (!canUseGuidedFlowForCycle(input.cycleStatus)) {
    return {
      kind: "advanced_builder",
      labelKey: "auth.admin.mp.hub.nextAction.advancedBuilder.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.advancedBuilder.description",
      href: builderHref,
      emphasis: "secondary",
    };
  }

  if (input.cards == null) {
    return {
      kind: "advanced_builder",
      labelKey: "auth.admin.mp.hub.nextAction.advancedBuilder.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.advancedBuilder.unavailableDescription",
      href: builderHref,
      emphasis: "secondary",
    };
  }

  const readiness = evaluateGuidedLaunchReadiness(input.cards);
  const needsFill =
    readiness.summary.totalCards === 0 ||
    readiness.summary.missingContentCount > 0 ||
    readiness.summary.missingPpaCount > 0;

  if (needsFill) {
    return {
      kind: "fill_guided_cards",
      labelKey: "auth.admin.mp.hub.nextAction.fillGuidedCards.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.fillGuidedCards.description",
      href: guidedCardsHref,
      emphasis: "primary",
    };
  }

  const launched = isGuidedLaunchAlreadyComplete({
    cycleStatus: input.cycleStatus,
    activeCycleId: input.activeCycleId,
    runtimeStatus: input.runtimeStatus,
    cycleId: input.cycleId,
    cards: input.cards,
  });

  if (launched) {
    return {
      kind: "launched",
      labelKey: "auth.admin.mp.hub.nextAction.launched.label",
      descriptionKey: "auth.admin.mp.hub.nextAction.launched.description",
      emphasis: "muted",
      secondaryHref: guidedLaunchHref,
      secondaryLabelKey: "auth.admin.mp.hub.nextAction.launched.viewStatus",
    };
  }

  return {
    kind: "review_and_launch",
    labelKey: "auth.admin.mp.hub.nextAction.reviewAndLaunch.label",
    descriptionKey: "auth.admin.mp.hub.nextAction.reviewAndLaunch.description",
    href: guidedLaunchHref,
    emphasis: "primary",
  };
}

export function getHubCycleActionLinks(
  nextAction: MarketPulseCycleNextAction,
  cycleId: string,
  cycleStatus: MarketPulseCycleStatus,
): HubCycleActionLinks {
  const builderHref = marketPulseCycleBuilderPath(cycleId);
  const guidedCardsHref = marketPulseGuidedCardsPath(cycleId);
  const guidedEligible = canUseGuidedFlowForCycle(cycleStatus);

  if (nextAction.kind === "launched") {
    return {
      primaryHref: null,
      primaryLabelKey: null,
      primaryEmphasis: null,
      secondaryLinks: [
        ...(nextAction.secondaryHref && nextAction.secondaryLabelKey
          ? [
              {
                href: nextAction.secondaryHref,
                labelKey: nextAction.secondaryLabelKey,
              },
            ]
          : []),
        { href: builderHref, labelKey: "auth.admin.mp.openBuilder" },
      ],
      showFillGuidedCards: false,
      showReviewAndLaunch: false,
    };
  }

  if (
    nextAction.kind === "closed" ||
    nextAction.kind === "revealed" ||
    nextAction.kind === "archived"
  ) {
    return {
      primaryHref: null,
      primaryLabelKey: null,
      primaryEmphasis: null,
      secondaryLinks: [{ href: builderHref, labelKey: "auth.admin.mp.openBuilder" }],
      showFillGuidedCards: false,
      showReviewAndLaunch: false,
    };
  }

  const primaryIsFill = nextAction.kind === "fill_guided_cards";
  const primaryIsReview = nextAction.kind === "review_and_launch";

  const secondaryLinks: Array<{ href: string; labelKey: MessageKey }> = [
    { href: builderHref, labelKey: "auth.admin.mp.openBuilder" },
  ];

  if (primaryIsReview && guidedEligible) {
    secondaryLinks.unshift({
      href: guidedCardsHref,
      labelKey: "auth.admin.mp.guidedCards.entryButton",
    });
  }

  let primaryHref: string | null = null;
  let primaryLabelKey: MessageKey | null = null;
  let primaryEmphasis: MarketPulseCycleNextActionEmphasis | null = null;

  if (nextAction.emphasis === "primary" && nextAction.href) {
    primaryHref = nextAction.href;
    primaryLabelKey = nextAction.labelKey;
    primaryEmphasis = nextAction.emphasis;
  } else if (nextAction.kind === "advanced_builder" && nextAction.href) {
    primaryHref = nextAction.href;
    primaryLabelKey = nextAction.labelKey;
    primaryEmphasis = "secondary";
    secondaryLinks.splice(
      secondaryLinks.findIndex((link) => link.href === builderHref),
      1,
    );
  }

  return {
    primaryHref,
    primaryLabelKey,
    primaryEmphasis,
    secondaryLinks,
    showFillGuidedCards:
      guidedEligible && !primaryIsFill && nextAction.kind !== "advanced_builder",
    showReviewAndLaunch:
      guidedEligible &&
      !primaryIsReview &&
      !primaryIsFill &&
      nextAction.kind !== "advanced_builder",
  };
}

export function groupCardsByCycleId(
  cards: MarketPulseAdminCardRow[],
): Map<string, MarketPulseAdminCardRow[]> {
  const grouped = new Map<string, MarketPulseAdminCardRow[]>();

  for (const card of cards) {
    const existing = grouped.get(card.cycleId) ?? [];
    existing.push(card);
    grouped.set(card.cycleId, existing);
  }

  return grouped;
}

export function buildMarketPulseHubNextActions(input: {
  cycles: Array<{ id: string; status: MarketPulseCycleStatus }>;
  cardsByCycleId: Map<string, MarketPulseAdminCardRow[]>;
  activeCycleId: string | null;
  runtimeStatus: string;
}): Map<string, MarketPulseCycleNextAction> {
  const result = new Map<string, MarketPulseCycleNextAction>();

  for (const cycle of input.cycles) {
    const cycleCards = input.cardsByCycleId.get(cycle.id) ?? [];
    result.set(
      cycle.id,
      getMarketPulseCycleNextAction({
        cycleId: cycle.id,
        cycleStatus: cycle.status,
        cards: cycleCards,
        activeCycleId: input.activeCycleId,
        runtimeStatus: input.runtimeStatus,
      }),
    );
  }

  return result;
}

export function findContinueWorkflowTarget(input: {
  cycles: Array<{ id: string; status: MarketPulseCycleStatus; startsAt: string }>;
  cardsByCycleId: Map<string, MarketPulseAdminCardRow[]>;
  activeCycleId: string | null;
  runtimeStatus: string;
}): { href: string; labelKey: MessageKey } | null {
  const sorted = [...input.cycles]
    .filter((cycle) => canUseGuidedFlowForCycle(cycle.status))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  for (const cycle of sorted) {
    const nextAction = getMarketPulseCycleNextAction({
      cycleId: cycle.id,
      cycleStatus: cycle.status,
      cards: input.cardsByCycleId.get(cycle.id) ?? [],
      activeCycleId: input.activeCycleId,
      runtimeStatus: input.runtimeStatus,
    });

    if (nextAction.emphasis === "primary" && nextAction.href) {
      return { href: nextAction.href, labelKey: nextAction.labelKey };
    }
  }

  return null;
}
