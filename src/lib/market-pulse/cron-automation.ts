import type { MarketPulseSignal } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import {
  deriveCardPublishedAtFromSchedule,
  getCardSchedulingPublishBlockReason,
} from "@/lib/market-pulse/admin-card-scheduling";
import { getCardUnpublishBlockReason } from "@/lib/market-pulse/admin-bulk-card-actions";
import {
  validateCardPublishable,
  validateCardSource,
} from "@/lib/market-pulse/card-validation";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import {
  guidedRestSummaryFromBody,
  isGuidedCardSaveAllowed,
  validateGuidedCardSave,
  validateGuidedPpaApprove,
} from "@/lib/market-pulse/guided-card-validation";
import type { GuidedCardSaveInput } from "@/lib/market-pulse/guided-card-validation";
import {
  evaluateGuidedLaunchEligibility,
  evaluateGuidedLaunchReadiness,
  isGuidedLaunchAlreadyComplete,
} from "@/lib/market-pulse/guided-launch-readiness";
import {
  planGuidedLaunchCardPublish,
  planGuidedLaunchPublishes,
} from "@/lib/market-pulse/guided-launch-publish";
import {
  addHktCalendarDays,
  addHktDateOnlyDays,
  formatHktDateOnlyFromUtcInstant,
  hktDateOnlyDayKey,
} from "@/lib/market-pulse/hkt-time";
import type { GuidedCycleDayOverride } from "@/lib/market-pulse/guided-cycle";
import { validateGuidedCycleInput } from "@/lib/market-pulse/guided-cycle";
import { QUICK_CREATE_CYCLE_PRIZE_LABEL } from "@/lib/market-pulse/quick-create-cycle-defaults";
import { validateCycleReadyForReveal } from "@/lib/market-pulse/reveal-ppa-validation.server";
import { sendRevealReadyEmailsForCycle } from "@/lib/notifications/reveal-email";
import { sendWinnerEmailForCycle } from "@/lib/notifications/winner-email";
import { calculateAndPersistCycleScores } from "@/lib/market-pulse/server";
import type { CycleScoreCalculationSummary } from "@/lib/market-pulse/server";

/**
 * CRON automation service for Market Pulse.
 *
 * Mirrors the admin guided workflow (create guided cycle -> save card ->
 * approve PPA -> publish -> guided launch) but is intended to be driven by
 * secret-guarded cron endpoints instead of an interactive admin session.
 * All domain validation is reused from the guided-cycle / guided-card /
 * guided-launch modules so behavior stays consistent with the admin UI.
 *
 * Deliberate differences from the admin actions:
 * - No admin session; callers must authenticate at the route layer.
 * - No audit-log writes (audit log requires an admin user id).
 * - `automationUpdateCard` also accepts zh-Hant content fields, which the
 *   guided editor UI does not expose but the schema supports.
 * - `automationCreateGuidedCycle` auto-derives weekend REST days from the
 *   HKT date range unless explicit `dayOverrides` are provided.
 */

export type AutomationFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type AutomationResult<T = undefined> =
  | { ok: true; data: T }
  | AutomationFailure;

function automationFail(
  error: string,
  fieldErrors?: Record<string, string>,
): AutomationFailure {
  return { ok: false, error, fieldErrors };
}

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isWeekendHktDateOnly(dateKey: string): boolean {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

/** Auto-derive REST day overrides for Saturdays/Sundays in the HKT date range. */
function weekendRestOverrides(
  startDate: string,
  endDate: string,
): GuidedCycleDayOverride[] {
  const overrides: GuidedCycleDayOverride[] = [];
  const startKey = hktDateOnlyDayKey(startDate);
  const endKey = hktDateOnlyDayKey(endDate);
  if (!startKey || !endKey || startKey > endKey) {
    return overrides;
  }

  let current = startKey;
  let dayIndex = 1;
  while (current <= endKey) {
    if (isWeekendHktDateOnly(current)) {
      overrides.push({ dayIndex, dayType: "REST" });
    }
    const next = addHktDateOnlyDays(current, 1);
    if (!next || next === current) {
      break;
    }
    current = next;
    dayIndex += 1;
  }
  return overrides;
}

export type AutomationCreateCycleInput = {
  name: string;
  /** HKT calendar date `YYYY-MM-DD` (cycle start). */
  startDate: string;
  /** HKT calendar date `YYYY-MM-DD` (cycle end). */
  endDate: string;
  /** HKT calendar date `YYYY-MM-DD` (reveal, must be after endDate). */
  revealDate: string;
  /** Signal cards per weekday (default 2). */
  defaultSignalCardsPerDay?: number;
  /** Convert Saturdays/Sundays in the range to REST days (default true). */
  restOnWeekends?: boolean;
  /** Explicit per-day overrides; wins over `restOnWeekends`. */
  dayOverrides?: GuidedCycleDayOverride[];
  /** Prize label shown to players. Defaults to the quick-create default. */
  prizeLabel?: string;
};

/**
 * Prize label used for auto-created cycles (rollover). The legacy quick-create
 * default stays untouched for the admin form / first-cycle guidance.
 */
export const AUTO_CREATE_CYCLE_PRIZE_LABEL = "1 on 1 financial analysis";

const CYCLE_NAME_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Format "16Aug-25Aug 2026" style cycle names from HKT date-only strings. */
export function formatCycleNameFromDates(
  startDate: string,
  endDate: string,
): string {
  const fmt = (dateOnly: string) => {
    const [year, month, day] = dateOnly.split("-").map(Number);
    if (!year || !month || !day) {
      return dateOnly;
    }
    return `${day}${CYCLE_NAME_MONTHS[month - 1] ?? month}`;
  };
  return `${fmt(startDate)}-${fmt(endDate)} ${startDate.slice(0, 4)}`;
}

export async function automationCreateGuidedCycle(
  input: AutomationCreateCycleInput,
): Promise<
  AutomationResult<{
    cycleId: string;
    name: string;
    signalCardCount: number;
    restCardCount: number;
  }>
> {
  const defaultSignalCardsPerDay = input.defaultSignalCardsPerDay ?? 2;
  const userOverrides = input.dayOverrides ?? [];
  const overrideByDay = new Map(userOverrides.map((row) => [row.dayIndex, row]));
  const autoOverrides =
    input.restOnWeekends === false
      ? []
      : weekendRestOverrides(input.startDate, input.endDate);
  const autoOverrideDays = new Set(autoOverrides.map((row) => row.dayIndex));

  // userOverrides win over auto weekend REST; non-overlapping user overrides
  // (e.g. a forced Day-1 REST) are kept. (Fixed 2026-08-17: the old filter
  // dropped every user override because each was by construction in
  // overrideByDay.)
  const dayOverrides: GuidedCycleDayOverride[] = [
    ...autoOverrides.map((row) => overrideByDay.get(row.dayIndex) ?? row),
    ...userOverrides.filter((row) => !autoOverrideDays.has(row.dayIndex)),
  ];

  const validation = validateGuidedCycleInput({
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    revealDate: input.revealDate,
    defaultSignalCardsPerDay,
    dayOverrides,
  });

  if (!validation.valid) {
    return automationFail(
      validation.error ?? "Invalid guided cycle input.",
      validation.fieldErrors,
    );
  }

  try {
    const cycle = await prisma.$transaction(async (tx) => {
      const createdCycle = await tx.marketPulseCycle.create({
        data: {
          name: input.name.trim(),
          startsAt: validation.dates!.startsAt,
          endsAt: validation.dates!.endsAt,
          revealAt: validation.dates!.revealAt,
          prizeLabel: input.prizeLabel?.trim() || QUICK_CREATE_CYCLE_PRIZE_LABEL,
          status: "DRAFT",
        },
      });

      if (validation.cards!.length > 0) {
        await tx.marketPulseCard.createMany({
          data: validation.cards!.map((card) => ({
            cycleId: createdCycle.id,
            dayIndex: card.dayIndex,
            sortOrder: card.sortOrder,
            cardType: card.cardType,
            companyName: card.companyName,
            ticker: card.ticker,
            headline: card.headline,
            headlineZhHant: card.headlineZhHant ?? null,
            newsBody: card.newsBody ?? null,
            newsBodyZhHant: card.newsBodyZhHant ?? null,
            userPrompt: card.userPrompt ?? null,
            status: card.status,
            sourceDate: card.sourceDate,
            ppaSignal: card.ppaSignal,
            ppaInsight: card.ppaInsight,
            publishedAt: card.publishedAt,
          })),
        });
      }

      return createdCycle;
    });

    return {
      ok: true,
      data: {
        cycleId: cycle.id,
        name: cycle.name,
        signalCardCount: validation.signalCardCount!,
        restCardCount: validation.restCardCount!,
      },
    };
  } catch (error) {
    console.error("[cron-automation] createGuidedCycle failed:", error);
    return automationFail("Could not create guided cycle.");
  }
}

export type AutomationCardSaveInput = GuidedCardSaveInput & {
  cardId: string;
  headlineZhHant?: string;
  newsBodyZhHant?: string;
  summaryZhHant?: string;
  companyNameZh?: string;
  userPrompt?: string;
  userPromptZhHant?: string;
  sourceName?: string;
  sourceUrl?: string;
  cardImageAltZhHant?: string;
  /** Research pass reasoning + sources, surfaced in the admin approvals queue. */
  researchNotes?: string;
};

export async function automationUpdateCard(
  input: AutomationCardSaveInput,
): Promise<AutomationResult<{ cardId: string }>> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) {
    return automationFail("Card not found.");
  }
  if (!isGuidedCardSaveAllowed(card)) {
    return automationFail("Published cards must be edited in advanced builder.");
  }
  if (input.cardType !== card.cardType) {
    return automationFail("Card type does not match.");
  }

  // Due-diligence guard: SIGNAL cards must carry a citable, direct source.
  if (input.cardType === "SIGNAL") {
    const sourceError = validateCardSource({
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
    });
    if (sourceError) {
      return automationFail(sourceError);
    }
  }

  const validation = validateGuidedCardSave(input);
  if (!validation.valid) {
    return automationFail(
      validation.error ?? "Invalid card data.",
      validation.errors as Record<string, string>,
    );
  }

  const slotConflict = await prisma.marketPulseCard.findFirst({
    where: {
      cycleId: card.cycleId,
      dayIndex: input.dayIndex,
      sortOrder: card.sortOrder,
      NOT: { id: card.id },
    },
  });
  if (slotConflict) {
    return automationFail("Another card on this day already uses this slot.");
  }

  try {
    if (input.cardType === "REST") {
      await prisma.marketPulseCard.update({
        where: { id: card.id },
        data: {
          dayIndex: input.dayIndex,
          headline: input.headline.trim(),
          newsBody: trimOrNull(input.newsBody),
          summary: guidedRestSummaryFromBody(input.newsBody),
          cardImageUrl: trimOrNull(input.cardImageUrl),
          cardImageAlt: trimOrNull(input.cardImageAlt),
          headlineZhHant: trimOrNull(input.headlineZhHant),
          newsBodyZhHant: trimOrNull(input.newsBodyZhHant),
          researchNotes: trimOrNull(input.researchNotes),
          ...(card.reviewStatus === "REJECTED"
            ? { reviewStatus: "PENDING" as const, reviewedAt: null }
            : {}),
        },
      });
    } else {
      await prisma.marketPulseCard.update({
        where: { id: card.id },
        data: {
          dayIndex: input.dayIndex,
          headline: input.headline.trim(),
          newsBody: trimOrNull(input.newsBody),
          companyName: input.companyName.trim(),
          ticker: input.ticker.trim(),
          summary: trimOrNull(input.summary),
          priceLabel: trimOrNull(input.priceLabel),
          cardImageUrl: trimOrNull(input.cardImageUrl),
          cardImageAlt: trimOrNull(input.cardImageAlt),
          cardImageAltZhHant: trimOrNull(input.cardImageAltZhHant),
          headlineZhHant: trimOrNull(input.headlineZhHant),
          newsBodyZhHant: trimOrNull(input.newsBodyZhHant),
          summaryZhHant: trimOrNull(input.summaryZhHant),
          companyNameZh: trimOrNull(input.companyNameZh),
          userPrompt: trimOrNull(input.userPrompt),
          userPromptZhHant: trimOrNull(input.userPromptZhHant),
          sourceName: trimOrNull(input.sourceName),
          sourceUrl: trimOrNull(input.sourceUrl),
          researchNotes: trimOrNull(input.researchNotes),
          ...(card.reviewStatus === "REJECTED"
            ? { reviewStatus: "PENDING" as const, reviewedAt: null }
            : {}),
        },
      });
    }
  } catch (error) {
    console.error("[cron-automation] updateCard failed:", error);
    return automationFail("Could not save card.");
  }

  return { ok: true, data: { cardId: card.id } };
}

export type AutomationPpaApproveInput = {
  cardId: string;
  ppaSignal: MarketPulseSignal | "";
  ppaInsight: string;
  ppaInsightZhHant?: string;
};

export async function automationApprovePpa(
  input: AutomationPpaApproveInput,
): Promise<AutomationResult<{ cardId: string; ppaSignalLockedAt: Date }>> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) {
    return automationFail("Card not found.");
  }
  if (isMarketPulseRestCard(card)) {
    return automationFail("Rest cards do not use PPA.");
  }
  if (!isGuidedCardSaveAllowed(card)) {
    return automationFail("Published cards must be edited in advanced builder.");
  }

  const validation = validateGuidedPpaApprove({
    ppaSignal: input.ppaSignal,
    ppaInsight: input.ppaInsight,
  });
  if (!validation.valid) {
    return automationFail(
      validation.error ?? "PPA approval is incomplete.",
      validation.errors as Record<string, string>,
    );
  }

  try {
    const updated = await prisma.marketPulseCard.update({
      where: { id: card.id },
      data: {
        ppaSignal: input.ppaSignal || null,
        ppaInsight: trimOrNull(input.ppaInsight),
        ppaInsightZhHant: trimOrNull(input.ppaInsightZhHant),
        ppaSignalLockedAt: new Date(),
      },
    });
    return {
      ok: true,
      data: { cardId: updated.id, ppaSignalLockedAt: updated.ppaSignalLockedAt! },
    };
  } catch (error) {
    console.error("[cron-automation] approvePpa failed:", error);
    return automationFail("Could not approve PPA.");
  }
}

/**
 * Publish a single card (mirrors `publishMarketPulseCardAction`).
 * Derives `publishedAt` from the cycle schedule when unset.
 */
export async function automationPublishCard(
  cardId: string,
): Promise<AutomationResult<{ cardId: string; publishedAt: string }>> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
  });
  if (!card) {
    return automationFail("Card not found.");
  }

  const publishError = validateCardPublishable(card);
  if (publishError) {
    return automationFail(publishError);
  }

  const cycleCards = await prisma.marketPulseCard.findMany({
    where: { cycleId: card.cycleId },
    select: { id: true, dayIndex: true, sourceDate: true, status: true },
  });
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: card.cycleId },
    select: { startsAt: true, endsAt: true },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }

  const schedulingError = getCardSchedulingPublishBlockReason(
    card,
    cycle,
    cycleCards,
  );
  if (schedulingError) {
    return automationFail(schedulingError);
  }

  try {
    const publishedAt =
      card.publishedAt ??
      deriveCardPublishedAtFromSchedule(cycle.startsAt, card.dayIndex);
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: { status: "PUBLISHED", publishedAt },
    });
    return {
      ok: true,
      data: { cardId, publishedAt: publishedAt.toISOString() },
    };
  } catch (error) {
    console.error("[cron-automation] publishCard failed:", error);
    return automationFail("Could not publish card.");
  }
}

/**
 * Unpublish a single card (mirrors `unpublishMarketPulseCardAction`).
 * Blocked when players already submitted decisions on the card.
 */
export async function automationUnpublishCard(
  cardId: string,
): Promise<AutomationResult<{ cardId: string }>> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
    include: { _count: { select: { decisions: true } } },
  });
  if (!card) {
    return automationFail("Card not found.");
  }

  const unpublishError = getCardUnpublishBlockReason({
    status: card.status,
    decisionCount: card._count.decisions,
  });
  if (unpublishError) {
    return automationFail(unpublishError);
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: { status: "DRAFT", publishedAt: null },
    });
    return { ok: true, data: { cardId } };
  } catch (error) {
    console.error("[cron-automation] unpublishCard failed:", error);
    return automationFail("Could not unpublish card.");
  }
}

/**
 * Publish every ready card in a cycle (skips cards that are not publishable
 * yet, with reasons). Idempotent: published cards are skipped.
 */
export async function automationPublishReadyCards(
  cycleId: string,
): Promise<
  AutomationResult<{
    published: number;
    skipped: Array<{ cardId: string; reason: string }>;
  }>
> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }

  const cardRows = await prisma.marketPulseCard.findMany({
    where: { cycleId },
    orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { decisions: true } } },
  });
  const cards = cardRows.map(mapMarketPulseAdminCardRow);

  const published: string[] = [];
  const skipped: Array<{ cardId: string; reason: string }> = [];

  try {
    for (const card of cards) {
      const result = planGuidedLaunchCardPublish({
        card,
        cycle: { startsAt: cycle.startsAt, endsAt: cycle.endsAt },
        allCards: cards,
      });
      if (!result.ok) {
        skipped.push({ cardId: card.id, reason: result.error });
        continue;
      }
      await prisma.marketPulseCard.update({
        where: { id: result.plan.cardId },
        data: { status: "PUBLISHED", publishedAt: result.plan.publishedAt },
      });
      published.push(result.plan.cardId);
    }
  } catch (error) {
    console.error("[cron-automation] publishReadyCards failed:", error);
    return automationFail("Could not publish cards.");
  }

  return { ok: true, data: { published: published.length, skipped } };
}

/**
 * Full guided launch: publishes every ready card, opens the cycle, pins it
 * as active, and opens the runtime. Mirrors
 * `launchGuidedMarketPulseCycleAction` (minus admin session + audit logs).
 */
export async function automationLaunchCycle(
  cycleId: string,
): Promise<
  AutomationResult<{
    cycleId: string;
    publishedCount: number;
    alreadyLaunched: boolean;
  }>
> {
  type LaunchTxResult = {
    alreadyLaunched: boolean;
    publishedPlans: Array<{ cardId: string; previousStatus: string }>;
    previousCycleStatus: string;
    cycleOpened: boolean;
    pinnedActive: boolean;
    previousActiveCycleId: string | null;
  };

  let txResult: LaunchTxResult;

  try {
    txResult = await prisma.$transaction(async (tx) => {
      const cycle = await tx.marketPulseCycle.findUnique({
        where: { id: cycleId },
        select: { id: true, status: true, startsAt: true, endsAt: true },
      });
      if (!cycle) {
        throw new Error("CYCLE_NOT_FOUND");
      }

      const eligibility = evaluateGuidedLaunchEligibility({
        status: cycle.status,
      });
      if (!eligibility.eligible) {
        throw new Error(
          `ELIGIBILITY:${eligibility.reasons[0] ?? "This cycle cannot be launched."}`,
        );
      }

      const cardRows = await tx.marketPulseCard.findMany({
        where: { cycleId },
        orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { decisions: true } } },
      });
      const cards = cardRows.map(mapMarketPulseAdminCardRow);

      const settings = await tx.marketPulseGameSetting.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (!settings) {
        throw new Error("SETTINGS_NOT_FOUND");
      }

      if (
        isGuidedLaunchAlreadyComplete({
          cycleStatus: cycle.status,
          activeCycleId: settings.activeCycleId,
          runtimeStatus: settings.runtimeStatus,
          cycleId: cycle.id,
          cards,
        })
      ) {
        return {
          alreadyLaunched: true,
          publishedPlans: [],
          previousCycleStatus: cycle.status,
          cycleOpened: false,
          pinnedActive: false,
          previousActiveCycleId: settings.activeCycleId,
        };
      }

      const readiness = evaluateGuidedLaunchReadiness(cards);
      if (!readiness.ready) {
        throw new Error(
          `READINESS:${readiness.reasons[0] ?? "Cycle is not ready to launch."}`,
        );
      }

      const publishPlan = planGuidedLaunchPublishes({
        cards,
        cycle: { startsAt: cycle.startsAt, endsAt: cycle.endsAt },
      });
      if (!publishPlan.ok) {
        throw new Error(`PUBLISH:${publishPlan.error}`);
      }

      for (const plan of publishPlan.plans) {
        await tx.marketPulseCard.update({
          where: { id: plan.cardId },
          data: { status: "PUBLISHED", publishedAt: plan.publishedAt },
        });
      }

      const previousCycleStatus = cycle.status;
      let cycleOpened = false;
      if (cycle.status !== "OPEN") {
        await tx.marketPulseCycle.update({
          where: { id: cycle.id },
          data: { status: "OPEN" },
        });
        cycleOpened = true;
      }

      const previousActiveCycleId = settings.activeCycleId;
      const pinnedActive = settings.activeCycleId !== cycle.id;

      await tx.marketPulseGameSetting.update({
        where: { id: settings.id },
        data: {
          activeCycleId: cycle.id,
          runtimeStatus: "OPEN",
        },
      });

      return {
        alreadyLaunched: false,
        publishedPlans: publishPlan.plans.map((plan) => ({
          cardId: plan.cardId,
          previousStatus: plan.previousStatus,
        })),
        previousCycleStatus,
        cycleOpened,
        pinnedActive,
        previousActiveCycleId,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CYCLE_NOT_FOUND") {
        return automationFail("Cycle not found.");
      }
      if (error.message === "SETTINGS_NOT_FOUND") {
        return automationFail("Game settings not found.");
      }
      if (error.message.startsWith("ELIGIBILITY:")) {
        return automationFail(error.message.replace("ELIGIBILITY:", ""));
      }
      if (error.message.startsWith("READINESS:")) {
        return automationFail(error.message.replace("READINESS:", ""));
      }
      if (error.message.startsWith("PUBLISH:")) {
        return automationFail(error.message.replace("PUBLISH:", ""));
      }
    }
    console.error("[cron-automation] launchCycle failed:", error);
    return automationFail("Could not launch cycle.");
  }

  return {
    ok: true,
    data: {
      cycleId,
      publishedCount: txResult.publishedPlans.length,
      alreadyLaunched: txResult.alreadyLaunched,
    },
  };
}

/**
 * Reveal a cycle: validate PPA readiness, mark cycle + published cards
 * REVEALED, score decisions, and send reveal/winner emails (non-blocking).
 * Mirrors the admin reveal action but is driven by the cron endpoint.
 */
export async function automationRevealCycle(
  cycleId: string,
): Promise<
  AutomationResult<{
    cycleId: string;
    name: string;
    alreadyRevealed: boolean;
    decisionsScored: number;
    usersScored: number;
    eventsCreated: number;
  }>
> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, status: true, revealAt: true },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }
  if (cycle.status === "REVEALED") {
    return {
      ok: true,
      data: {
        cycleId,
        name: cycle.name,
        alreadyRevealed: true,
        decisionsScored: 0,
        usersScored: 0,
        eventsCreated: 0,
      },
    };
  }

  const ppaValidation = await validateCycleReadyForReveal(cycleId);
  if (!ppaValidation.ready) {
    return automationFail(ppaValidation.message);
  }

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.marketPulseCycle.update({
        where: { id: cycleId },
        data: {
          status: "REVEALED",
          revealAt: cycle.revealAt > now ? now : cycle.revealAt,
        },
      });
      await tx.marketPulseCard.updateMany({
        where: { cycleId, status: "PUBLISHED" },
        data: { status: "REVEALED" },
      });
    });
  } catch (error) {
    console.error("[cron-automation] revealCycle transaction failed:", error);
    return automationFail("Reveal failed. Check server logs.");
  }

  let summary: CycleScoreCalculationSummary = {
    cycleId,
    decisionsScored: 0,
    usersScored: 0,
    eventsCreated: 0,
    participationPoints: 0,
    matchBonusPoints: 0,
    streakBonusPoints: 0,
    totalPoints: 0,
    topScore: null,
  };

  try {
    summary = await calculateAndPersistCycleScores(cycleId);
    try {
      await sendRevealReadyEmailsForCycle(cycleId);
    } catch (emailError) {
      console.error("[cron-automation] reveal emails failed:", emailError);
    }
    try {
      await sendWinnerEmailForCycle(cycleId);
    } catch (emailError) {
      console.error("[cron-automation] winner email failed:", emailError);
    }
  } catch (error) {
    console.error("[cron-automation] reveal scoring failed:", error);
  }

  return {
    ok: true,
    data: {
      cycleId,
      name: cycle.name,
      alreadyRevealed: false,
      decisionsScored: summary.decisionsScored,
      usersScored: summary.usersScored,
      eventsCreated: summary.eventsCreated,
    },
  };
}

/**
 * Activate a cycle: open it (status OPEN), pin it as the active cycle and
 * ensure runtime is OPEN. Unlike launchCycle, this does NOT require all cards
 * to be ready — it is the cron equivalent of the admin "open + set active"
 * step used when a fresh cycle takes over after the previous one ends.
 */
export async function automationActivateCycle(
  cycleId: string,
): Promise<
  AutomationResult<{
    cycleId: string;
    name: string;
    alreadyActive: boolean;
  }>
> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, status: true },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }
  if (cycle.status === "REVEALED" || cycle.status === "ARCHIVED") {
    return automationFail(
      `Cannot activate a ${cycle.status} cycle.`,
    );
  }

  const settings = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    return automationFail("Game settings not found.");
  }

  const alreadyActive =
    cycle.status === "OPEN" &&
    settings.activeCycleId === cycleId &&
    settings.runtimeStatus === "OPEN";
  if (alreadyActive) {
    return {
      ok: true,
      data: { cycleId, name: cycle.name, alreadyActive: true },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (cycle.status !== "OPEN") {
        await tx.marketPulseCycle.update({
          where: { id: cycleId },
          data: { status: "OPEN" },
        });
      }
      await tx.marketPulseGameSetting.update({
        where: { id: settings.id },
        data: { activeCycleId: cycleId, runtimeStatus: "OPEN" },
      });
    });
  } catch (error) {
    console.error("[cron-automation] activateCycle failed:", error);
    return automationFail("Could not activate cycle.");
  }

  return {
    ok: true,
    data: { cycleId, name: cycle.name, alreadyActive: false },
  };
}

/**
 * Reject a draft card from the approval queue (cron equivalent of the admin
 * reject action): sets reviewStatus REJECTED + reviewedAt + reviewNote.
 * Guards: card must exist and be DRAFT (published cards cannot be rejected).
 */
export async function automationRejectCard(
  cardId: string,
  reviewNote?: string | null,
): Promise<
  AutomationResult<{
    cardId: string;
    headline: string | null;
    alreadyRejected: boolean;
  }>
> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
    select: { id: true, headline: true, status: true, reviewStatus: true },
  });
  if (!card) {
    return automationFail("Card not found.");
  }
  if (card.status !== "DRAFT") {
    return automationFail("Published cards cannot be rejected.");
  }
  if (card.reviewStatus === "REJECTED") {
    return {
      ok: true,
      data: { cardId, headline: card.headline, alreadyRejected: true },
    };
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: {
        reviewStatus: "REJECTED",
        reviewedAt: new Date(),
        reviewNote: reviewNote?.trim() || null,
      },
    });
  } catch (error) {
    console.error("[cron-automation] rejectCard failed:", error);
    return automationFail("Could not reject card.");
  }

  return {
    ok: true,
    data: { cardId, headline: card.headline, alreadyRejected: false },
  };
}

/**
 * Rollover: reveal any cycle whose revealAt has passed (status OPEN/CLOSED)
 * and activate the next pending cycle whose startsAt has arrived.
 * Returns a summary of what was revealed / activated.
 */
export async function automationRollover(): Promise<
  AutomationResult<{
    revealed: Array<{ cycleId: string; name: string; alreadyRevealed: boolean }>;
    activated: Array<{ cycleId: string; name: string; alreadyActive: boolean }>;
    created: {
      cycleId: string;
      name: string;
      prizeLabel: string;
    } | null;
  }>
> {
  const now = new Date();
  const cycles = await prisma.marketPulseCycle.findMany({
    where: {
      status: { in: ["DRAFT", "OPEN", "CLOSED"] },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, name: true, status: true, startsAt: true, revealAt: true, endsAt: true },
  });

  const revealed: Array<{
    cycleId: string;
    name: string;
    alreadyRevealed: boolean;
  }> = [];
  const activated: Array<{
    cycleId: string;
    name: string;
    alreadyActive: boolean;
  }> = [];

  // 1) Reveal cycles past their revealAt (oldest first).
  for (const cycle of cycles) {
    if (
      (cycle.status === "OPEN" || cycle.status === "CLOSED") &&
      cycle.revealAt <= now
    ) {
      const result = await automationRevealCycle(cycle.id);
      if (result.ok) {
        revealed.push(result.data);
      }
    }
  }

  // 2) Activate the earliest cycle whose start has arrived and is not yet active.
  const settings = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const activeCycleId = settings?.activeCycleId ?? null;
  for (const cycle of cycles) {
    if (
      cycle.startsAt <= now &&
      cycle.status !== "REVEALED" &&
      cycle.id !== activeCycleId
    ) {
      const result = await automationActivateCycle(cycle.id);
      if (result.ok) {
        activated.push(result.data);
        // Publish ready cards on the newly active cycle: REST days go live
        // immediately (Day 1 "Market rest day"), APPROVED signals get their
        // scheduled publishedAt. Signals still PENDING are skipped.
        await automationPublishReadyCards(cycle.id);
        break; // only the earliest eligible next cycle
      }
    }
  }

  // 3) Ensure the "one active + one upcoming" invariant: if no upcoming
  // (DRAFT, future start) cycle exists, auto-create a 10-day cycle that
  // starts the day after the active cycle ends. Day 1 is always REST so the
  // Daily-Pipeline (20:00 HKT, drafts "tomorrow") can seed Day 2+ signals
  // before the first signal day goes live. Idempotent: skipped when an
  // upcoming cycle already exists.
  let created: {
    cycleId: string;
    name: string;
    prizeLabel: string;
  } | null = null;
  const hasUpcoming = cycles.some(
    (c) => c.status === "DRAFT" && c.startsAt > now,
  );
  if (!hasUpcoming) {
    const anchor = activeCycleId
      ? await prisma.marketPulseCycle.findUnique({
          where: { id: activeCycleId },
          select: { endsAt: true },
        })
      : null;
    if (anchor) {
      const startDate = formatHktDateOnlyFromUtcInstant(
        addHktCalendarDays(anchor.endsAt, 1),
      );
      const endDate = addHktDateOnlyDays(startDate, 9);
      if (startDate && endDate) {
        const revealDate = addHktDateOnlyDays(endDate, 1);
        if (revealDate) {
          const result = await automationCreateGuidedCycle({
            name: formatCycleNameFromDates(startDate, endDate),
            startDate,
            endDate,
            revealDate,
            defaultSignalCardsPerDay: 2,
            dayOverrides: [{ dayIndex: 1, dayType: "REST" }],
            prizeLabel: AUTO_CREATE_CYCLE_PRIZE_LABEL,
          });
          if (result.ok) {
            created = {
              cycleId: result.data.cycleId,
              name: result.data.name,
              prizeLabel: AUTO_CREATE_CYCLE_PRIZE_LABEL,
            };
          }
        }
      }
    }
  }

  return { ok: true, data: { revealed, activated, created } };
}

export async function automationDeleteCycle(
  cycleId: string,
): Promise<AutomationResult<{ cycleId: string; name: string }>> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, status: true },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }
  if (cycle.status !== "DRAFT") {
    return automationFail("Only DRAFT cycles can be deleted.");
  }
  try {
    await prisma.$transaction([
      prisma.marketPulseCard.deleteMany({ where: { cycleId } }),
      prisma.marketPulseCycle.delete({ where: { id: cycleId } }),
    ]);
    return { ok: true, data: { cycleId, name: cycle.name } };
  } catch (error) {
    console.error("[cron-automation] deleteCycle failed:", error);
    return automationFail("Cycle delete failed.");
  }
}

export async function automationGetCardDetail(
  cardId: string,
): Promise<
  AutomationResult<{
    id: string;
    cycleId: string;
    dayIndex: number;
    sortOrder: number;
    cardType: string;
    status: string;
    headline: string | null;
    headlineZhHant: string | null;
    newsBody: string | null;
    newsBodyZhHant: string | null;
    summary: string | null;
    summaryZhHant: string | null;
    companyName: string | null;
    companyNameZh: string | null;
    ticker: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    sourceDate: string | null;
    userPrompt: string | null;
    userPromptZhHant: string | null;
    priceLabel: string | null;
    cardImageUrl: string | null;
    cardImageAlt: string | null;
    cardImageAltZhHant: string | null;
    ppaSignal: string | null;
    ppaInsight: string | null;
    ppaInsightZhHant: string | null;
    ppaLocked: boolean;
    publishedAt: string | null;
    reviewStatus: string;
    reviewNote: string | null;
    researchNotes: string | null;
  }>
> {
  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
  });
  if (!card) {
    return automationFail("Card not found.");
  }

  return {
    ok: true,
    data: {
      id: card.id,
      cycleId: card.cycleId,
      dayIndex: card.dayIndex,
      sortOrder: card.sortOrder,
      cardType: card.cardType,
      status: card.status,
      headline: card.headline,
      headlineZhHant: card.headlineZhHant,
      newsBody: card.newsBody,
      newsBodyZhHant: card.newsBodyZhHant,
      summary: card.summary,
      summaryZhHant: card.summaryZhHant,
      companyName: card.companyName,
      companyNameZh: card.companyNameZh,
      ticker: card.ticker,
      sourceName: card.sourceName,
      sourceUrl: card.sourceUrl,
      sourceDate: card.sourceDate ? card.sourceDate.toISOString() : null,
      userPrompt: card.userPrompt,
      userPromptZhHant: card.userPromptZhHant,
      priceLabel: card.priceLabel,
      cardImageUrl: card.cardImageUrl,
      cardImageAlt: card.cardImageAlt,
      cardImageAltZhHant: card.cardImageAltZhHant,
      ppaSignal: card.ppaSignal,
      ppaInsight: card.ppaInsight,
      ppaInsightZhHant: card.ppaInsightZhHant,
      ppaLocked: Boolean(card.ppaSignalLockedAt),
      publishedAt: card.publishedAt ? card.publishedAt.toISOString() : null,
      reviewStatus: card.reviewStatus,
      reviewNote: card.reviewNote,
      researchNotes: card.researchNotes,
    },
  };
}

export async function automationGetCycleStatus(
  cycleId: string,
): Promise<
  AutomationResult<{
    cycle: {
      id: string;
      name: string;
      startsAt: string;
      endsAt: string;
      revealAt: string;
      status: string;
      prizeLabel: string | null;
    };
    cards: Array<{
      id: string;
      dayIndex: number;
      sortOrder: number;
      cardType: string;
      status: string;
      headline: string | null;
      companyName: string | null;
      ticker: string | null;
      sourceDate: string | null;
      ppaSignal: string | null;
      ppaLocked: boolean;
      reviewStatus: string;
      reviewNote: string | null;
    }>;
  }>
> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
  });
  if (!cycle) {
    return automationFail("Cycle not found.");
  }

  const cards = await prisma.marketPulseCard.findMany({
    where: { cycleId },
    orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      dayIndex: true,
      sortOrder: true,
      cardType: true,
      status: true,
      headline: true,
      companyName: true,
      ticker: true,
      sourceDate: true,
      ppaSignal: true,
      ppaSignalLockedAt: true,
      reviewStatus: true,
      reviewNote: true,
    },
  });

  return {
    ok: true,
    data: {
      cycle: {
        id: cycle.id,
        name: cycle.name,
        startsAt: cycle.startsAt.toISOString(),
        endsAt: cycle.endsAt.toISOString(),
        revealAt: cycle.revealAt.toISOString(),
        status: cycle.status,
        prizeLabel: cycle.prizeLabel,
      },
      cards: cards.map((card) => ({
        id: card.id,
        dayIndex: card.dayIndex,
        sortOrder: card.sortOrder,
        cardType: card.cardType,
        status: card.status,
        headline: card.headline,
        companyName: card.companyName,
        ticker: card.ticker,
        sourceDate: card.sourceDate ? card.sourceDate.toISOString() : null,
        ppaSignal: card.ppaSignal,
        ppaLocked: Boolean(card.ppaSignalLockedAt),
        reviewStatus: card.reviewStatus,
        reviewNote: card.reviewNote,
      })),
    },
  };
}

export async function automationGetStatus(): Promise<
  AutomationResult<{
    runtime: string | null;
    activeCycle: {
      id: string;
      name: string;
      startsAt: string;
      endsAt: string;
      revealAt: string;
      status: string;
    } | null;
    cards: Array<{
      id: string;
      dayIndex: number;
      sortOrder: number;
      cardType: string;
      status: string;
      headline: string | null;
      companyName: string | null;
      ticker: string | null;
      sourceDate: string | null;
      ppaSignal: string | null;
      ppaLocked: boolean;
      reviewStatus: string;
      reviewNote: string | null;
    }>;
    /** Health warnings for automation watchers (empty when healthy). */
    warnings: string[];
  }>
> {
  const settings = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const runtime = settings?.runtimeStatus ?? null;

  let activeCycle:
    | {
        id: string;
        name: string;
        startsAt: Date;
        endsAt: Date;
        revealAt: Date;
        status: string;
      }
    | null = null;
  let cards: Array<{
    id: string;
    dayIndex: number;
    sortOrder: number;
    cardType: string;
    status: string;
    headline: string | null;
    companyName: string | null;
    ticker: string | null;
    sourceDate: Date | null;
    ppaSignal: string | null;
    ppaSignalLockedAt: Date | null;
    reviewStatus: string;
    reviewNote: string | null;
  }> = [];

  if (settings?.activeCycleId) {
    const row = await prisma.marketPulseCycle.findUnique({
      where: { id: settings.activeCycleId },
      select: {
        id: true,
        name: true,
        startsAt: true,
        endsAt: true,
        revealAt: true,
        status: true,
      },
    });
    if (row) {
      activeCycle = row;
    }

    cards = await prisma.marketPulseCard.findMany({
      where: { cycleId: settings.activeCycleId },
      orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        dayIndex: true,
        sortOrder: true,
        cardType: true,
        status: true,
        headline: true,
        companyName: true,
        ticker: true,
        sourceDate: true,
        ppaSignal: true,
        ppaSignalLockedAt: true,
        reviewStatus: true,
        reviewNote: true,
      },
    });
  }

  // Health warnings for automation watchers (rollover readiness).
  const warnings: string[] = [];
  if (activeCycle) {
    if (activeCycle.status === "REVEALED") {
      warnings.push("active cycle is REVEALED — rollover may have been missed");
    } else if (activeCycle.revealAt.getTime() <= Date.now()) {
      warnings.push("active cycle revealAt is in the past — rollover may have been missed");
    }
  } else {
    warnings.push("no active cycle — site is not playable");
  }
  const upcomingCycle = await prisma.marketPulseCycle.findFirst({
    where: { status: "DRAFT", startsAt: { gt: new Date() } },
    select: { id: true },
  });
  if (!upcomingCycle) {
    warnings.push("no upcoming cycle scheduled — create one before the active cycle ends");
  }

  return {
    ok: true,
    data: {
      runtime,
      activeCycle: activeCycle
        ? {
            id: activeCycle.id,
            name: activeCycle.name,
            startsAt: activeCycle.startsAt.toISOString(),
            endsAt: activeCycle.endsAt.toISOString(),
            revealAt: activeCycle.revealAt.toISOString(),
            status: activeCycle.status,
          }
        : null,
      cards: cards.map((card) => ({
        id: card.id,
        dayIndex: card.dayIndex,
        sortOrder: card.sortOrder,
        cardType: card.cardType,
        status: card.status,
        headline: card.headline,
        companyName: card.companyName,
        ticker: card.ticker,
        sourceDate: card.sourceDate ? card.sourceDate.toISOString() : null,
        ppaSignal: card.ppaSignal,
        ppaLocked: Boolean(card.ppaSignalLockedAt),
        reviewStatus: card.reviewStatus,
        reviewNote: card.reviewNote,
      })),
      warnings,
    },
  };
}
