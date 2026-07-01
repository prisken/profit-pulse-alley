"use server";

import { revalidatePath } from "next/cache";
import type {
  MarketPulseCycleStatus,
  MarketPulseGameRuntimeStatus,
  MarketPulsePrizeStatus,
  MarketPulseSignal,
} from "@prisma/client";

import {
  adminFail,
  adminOk,
  fieldErrorsFromRecord,
  finishAdminMutation,
  runAdminSideEffects,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prizeNameForRank } from "@/lib/market-pulse/prize-constants";
import {
  DEFAULT_CARD_FORM_VALUES,
  parseCardDate,
  validateCardPublishable,
  validateCardStatusPpa,
  validateMarketPulseCardForm,
  validateMarketPulseCardDraftSave,
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";
import {
  parseCycleDate,
  validateMarketPulseCycleDates,
} from "@/lib/market-pulse/cycle-validation";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";
import {
  buildQuickCreateCycleDefaults,
  type QuickCreateCycleReference,
} from "@/lib/market-pulse/quick-create-cycle-defaults";
import {
  buildQuickDraftCardDefaults,
  buildQuickRestDraftCardDefaults,
} from "@/lib/market-pulse/cycle-card-defaults";
import { buildDuplicateCardCreateData } from "@/lib/market-pulse/duplicate-card-data";
import {
  buildFillMissingSourceDatesPreview,
  canReorderMarketPulseCards,
  deriveCardPublishedAtFromSchedule,
  getAdjacentCardInOrder,
  getCardSchedulingPublishBlockReason,
  temporaryDayIndexForSwap,
  temporarySortOrderForSwap,
} from "@/lib/market-pulse/admin-card-scheduling";
import {
  formatBulkPublishMessage,
  formatBulkUnpublishMessage,
  getCardPublishBlockReason,
  getCardUnpublishBlockReason,
  getReadyToPublishCards,
  planBulkPublish,
  planBulkUnpublish,
  type BulkPublishCardsResult,
  type BulkUnpublishCardsResult,
} from "@/lib/market-pulse/admin-bulk-card-actions";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  calculateAndPersistCycleScores,
  getMarketPulseLeaderboard,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/server";
import { validateCycleReadyForReveal } from "@/lib/market-pulse/reveal-ppa-validation.server";
import { prisma } from "@/lib/prisma";

const ADMIN_PATH = "/admin/market-pulse";

export type { AdminActionResult } from "@/lib/admin/action-result";

export type RevealCycleSummary = {
  cycleId: string;
  decisionsScored: number;
  usersScored: number;
  eventsCreated: number;
  topScore: number | null;
};

function unauthorized(): AdminActionResult {
  return adminFail("Unauthorized");
}

function revalidateAdminPaths() {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/market-pulse");
  revalidatePath("/market-pulse/play");
  revalidatePath("/market-pulse/leaderboard");
  revalidatePath("/market-pulse/reveal");
}

function revalidateAdminEffect() {
  return {
    label: "cache refresh",
    run: () => {
      revalidateAdminPaths();
    },
  };
}

function parseDate(value: string): Date | null {
  return parseCycleDate(value);
}

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

async function assertUniqueCardSlot(input: {
  cycleId: string;
  dayIndex: number;
  sortOrder: number;
  excludeCardId?: string;
}): Promise<string | null> {
  const existing = await prisma.marketPulseCard.findFirst({
    where: {
      cycleId: input.cycleId,
      dayIndex: input.dayIndex,
      sortOrder: input.sortOrder,
      ...(input.excludeCardId ? { NOT: { id: input.excludeCardId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    return "Another card on this cycle day already uses this order.";
  }
  return null;
}

export type CreateMarketPulseCardInput = Omit<
  MarketPulseCardFormValues,
  "changeReason" | "ppaSignal"
> & {
  ppaSignal: MarketPulseSignal | null;
};

function cardPayloadFromInput(
  input: CreateMarketPulseCardInput,
  options?: { existingPublishedAt?: Date | null },
) {
  const parsedPublishedAt = parseCardDate(input.publishedAt);
  const publishedAt =
    parsedPublishedAt ??
    (input.status === "PUBLISHED"
      ? options?.existingPublishedAt ?? new Date()
      : null);

  return {
    cycleId: input.cycleId,
    dayIndex: input.dayIndex,
    sortOrder: input.sortOrder ?? 0,
    cardType: input.cardType,
    companyName: input.companyName.trim(),
    companyNameZh: trimOrNull(input.companyNameZh),
    ticker: input.ticker.trim(),
    exchange: trimOrNull(input.exchange),
    logoUrl: trimOrNull(input.logoUrl),
    logoInitials: trimOrNull(input.logoInitials),
    priceLabel: trimOrNull(input.priceLabel),
    priceDirection: trimOrNull(input.priceDirection),
    headline: input.headline.trim(),
    headlineZhHant: trimOrNull(input.headlineZhHant),
    newsBody: trimOrNull(input.newsBody),
    newsBodyZhHant: trimOrNull(input.newsBodyZhHant),
    sourceName: trimOrNull(input.sourceName),
    sourceUrl: trimOrNull(input.sourceUrl),
    sourceDate: parseCardDate(input.sourceDate),
    cardImageUrl: trimOrNull(input.cardImageUrl),
    cardImageAlt: trimOrNull(input.cardImageAlt),
    cardImageAltZhHant: trimOrNull(input.cardImageAltZhHant),
    summary: trimOrNull(input.summary),
    summaryZhHant: trimOrNull(input.summaryZhHant),
    userPrompt: trimOrNull(input.userPrompt),
    userPromptZhHant: trimOrNull(input.userPromptZhHant),
    ppaSignal: input.ppaSignal,
    ppaInsight: trimOrNull(input.ppaInsight),
    ppaInsightZhHant: trimOrNull(input.ppaInsightZhHant),
    status: input.status,
    publishedAt,
    revealAt: parseCardDate(input.revealAt),
  };
}

async function writeCycleAuditLog(input: {
  adminUserId: string;
  cycleId: string;
  action: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
}) {
  await prisma.marketPulseAuditLog.create({
    data: {
      adminUserId: input.adminUserId,
      entityType: "MarketPulseCycle",
      entityId: input.cycleId,
      action: input.action,
      fieldName: input.fieldName,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      reason: input.reason,
    },
  });
}

async function getGameSettings() {
  return prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

async function setActiveCycleId(
  adminUserId: string,
  cycleId: string,
  previousActiveCycleId: string | null,
): Promise<{ applied: boolean; warning?: string }> {
  const settings = await getGameSettings();
  if (!settings) {
    return {
      applied: false,
      warning:
        "Game settings not found — the cycle was saved but could not be set as active.",
    };
  }

  if (settings.activeCycleId === cycleId) {
    return { applied: true };
  }

  await prisma.marketPulseGameSetting.update({
    where: { id: settings.id },
    data: { activeCycleId: cycleId },
  });

  const warning = await runAdminSideEffects([
    {
      label: "audit log",
      run: () =>
        writeCycleAuditLog({
          adminUserId,
          cycleId,
          action: "SET_ACTIVE",
          fieldName: "activeCycleId",
          oldValue: previousActiveCycleId,
          newValue: cycleId,
        }),
    },
  ]);

  return { applied: true, warning };
}

async function writePpaAuditLog(input: {
  adminUserId: string;
  cardId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
}) {
  await prisma.marketPulseAuditLog.create({
    data: {
      adminUserId: input.adminUserId,
      entityType: "MarketPulseCard",
      entityId: input.cardId,
      action: "UPDATE_LOCKED_PPA",
      fieldName: input.fieldName,
      oldValue: input.oldValue,
      newValue: input.newValue,
      reason: input.reason,
    },
  });
}

export async function updateMarketPulseRuntimeStatusAction(
  runtimeStatus: MarketPulseGameRuntimeStatus,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const settings = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!settings) {
    return adminFail("Game settings not found.");
  }

  await prisma.marketPulseGameSetting.update({
    where: { id: settings.id },
    data: { runtimeStatus },
  });

  return finishAdminMutation("Runtime updated.", [revalidateAdminEffect()]);
}

export async function setActiveMarketPulseCycleAction(
  cycleId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const settings = await getGameSettings();
  if (!settings) {
    return adminFail("Game settings not found.");
  }

  const activeResult = await setActiveCycleId(
    admin.userId,
    cycleId,
    settings.activeCycleId,
  );
  if (!activeResult.applied) {
    return adminFail(
      activeResult.warning ?? "Game settings not found.",
    );
  }

  return finishAdminMutation("Active cycle updated.", [revalidateAdminEffect()], {
    extraWarning: activeResult.warning,
  });
}

export type CreateMarketPulseCycleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  revealAt: string;
  prizeLabel?: string;
  status: MarketPulseCycleStatus;
  setActive?: boolean;
};

export async function createMarketPulseCycleAction(
  input: CreateMarketPulseCycleInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const name = input.name.trim();
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  const revealAt = parseDate(input.revealAt);

  const validationError = validateMarketPulseCycleDates({
    name,
    startsAt,
    endsAt,
    revealAt,
  });
  if (validationError) {
    return adminFail(validationError);
  }

  const settings = await getGameSettings();

  let cycle;
  try {
    cycle = await prisma.marketPulseCycle.create({
      data: {
        name,
        startsAt: startsAt!,
        endsAt: endsAt!,
        revealAt: revealAt!,
        prizeLabel: input.prizeLabel?.trim() || null,
        status: input.status,
      },
    });
  } catch (error) {
    console.error("[admin] createMarketPulseCycleAction failed:", error);
    return adminFail("Could not create cycle. Please try again.");
  }

  let extraWarning: string | undefined;
  if (input.setActive) {
    const activeResult = await setActiveCycleId(
      admin.userId,
      cycle.id,
      settings?.activeCycleId ?? null,
    );
    extraWarning = activeResult.applied
      ? activeResult.warning
      : activeResult.warning ??
        "The cycle was saved but could not be set as active.";
  }

  return finishAdminMutation(
    "Cycle saved.",
    [
      {
        label: "audit log",
        run: () =>
          writeCycleAuditLog({
            adminUserId: admin.userId,
            cycleId: cycle.id,
            action: "CREATE",
            newValue: input.status,
            reason: `Created cycle "${name}"`,
          }),
      },
      revalidateAdminEffect(),
    ],
    { extraWarning },
  );
}

export type QuickCreateMarketPulseCycleResult = {
  cycleId: string;
  redirectPath: string;
};

export async function quickCreateMarketPulseCycleAction(): Promise<
  AdminActionResult<QuickCreateMarketPulseCycleResult>
> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const existingCycles = await prisma.marketPulseCycle.findMany({
    orderBy: { endsAt: "desc" },
    select: { name: true, startsAt: true, endsAt: true, revealAt: true },
  });

  const defaults = buildQuickCreateCycleDefaults(
    existingCycles as QuickCreateCycleReference[],
  );

  const validationError = validateMarketPulseCycleDates({
    name: defaults.name,
    startsAt: defaults.startsAt,
    endsAt: defaults.endsAt,
    revealAt: defaults.revealAt,
  });
  if (validationError) {
    return adminFail(validationError);
  }

  let cycle;
  try {
    cycle = await prisma.marketPulseCycle.create({
      data: {
        name: defaults.name,
        startsAt: defaults.startsAt,
        endsAt: defaults.endsAt,
        revealAt: defaults.revealAt,
        prizeLabel: defaults.prizeLabel,
        status: defaults.status,
      },
    });
  } catch (error) {
    console.error("[admin] quickCreateMarketPulseCycleAction failed:", error);
    return adminFail("Could not create cycle. Please try again.");
  }

  const redirectPath = marketPulseCycleBuilderPath(cycle.id);

  return finishAdminMutation(
    "Draft cycle created.",
    [
      {
        label: "audit log",
        run: () =>
          writeCycleAuditLog({
            adminUserId: admin.userId,
            cycleId: cycle.id,
            action: "CREATE",
            newValue: defaults.status,
            reason: `Quick-created draft cycle "${defaults.name}"`,
          }),
      },
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(redirectPath);
        },
      },
    ],
    {
      data: {
        cycleId: cycle.id,
        redirectPath,
      },
    },
  );
}

export type UpdateMarketPulseCycleInput = {
  cycleId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  revealAt: string;
  prizeLabel?: string;
  status: MarketPulseCycleStatus;
  setActive?: boolean;
};

export async function updateMarketPulseCycleAction(
  input: UpdateMarketPulseCycleInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const existing = await prisma.marketPulseCycle.findUnique({
    where: { id: input.cycleId },
  });
  if (!existing) {
    return adminFail("Cycle not found.");
  }

  const name = input.name.trim();
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  const revealAt = parseDate(input.revealAt);

  const validationError = validateMarketPulseCycleDates({
    name,
    startsAt,
    endsAt,
    revealAt,
  });
  if (validationError) {
    return adminFail(validationError);
  }

  const settings = await getGameSettings();

  try {
    await prisma.marketPulseCycle.update({
      where: { id: input.cycleId },
      data: {
        name,
        startsAt: startsAt!,
        endsAt: endsAt!,
        revealAt: revealAt!,
        prizeLabel: input.prizeLabel?.trim() || null,
        status: input.status,
      },
    });
  } catch (error) {
    console.error("[admin] updateMarketPulseCycleAction failed:", error);
    return adminFail("Could not update cycle. Please try again.");
  }

  const sideEffects = [];

  if (existing.status !== input.status) {
    sideEffects.push({
      label: "audit log",
      run: () =>
        writeCycleAuditLog({
          adminUserId: admin.userId,
          cycleId: input.cycleId,
          action: "STATUS_CHANGE",
          fieldName: "status",
          oldValue: existing.status,
          newValue: input.status,
        }),
    });
  }

  const builderPath = marketPulseCycleBuilderPath(input.cycleId);
  sideEffects.push(revalidateAdminEffect());
  sideEffects.push({
    label: "builder cache refresh",
    run: () => {
      revalidatePath(builderPath);
    },
  });

  let extraWarning: string | undefined;
  if (input.setActive) {
    const activeResult = await setActiveCycleId(
      admin.userId,
      input.cycleId,
      settings?.activeCycleId ?? null,
    );
    extraWarning = activeResult.applied
      ? activeResult.warning
      : activeResult.warning ??
        "The cycle was saved but could not be set as active.";
  }

  return finishAdminMutation("Cycle saved.", sideEffects, { extraWarning });
}

export async function closeMarketPulseCycleAction(
  cycleId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const existing = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, status: true },
  });
  if (!existing) {
    return adminFail("Cycle not found.");
  }

  if (existing.status === "CLOSED") {
    return adminFail("Cycle is already closed.");
  }

  try {
    await prisma.marketPulseCycle.update({
      where: { id: cycleId },
      data: { status: "CLOSED" },
    });
  } catch (error) {
    console.error("[admin] closeMarketPulseCycleAction failed:", error);
    return adminFail("Could not close cycle. Please try again.");
  }

  return finishAdminMutation("Cycle closed.", [
    {
      label: "audit log",
      run: () =>
        writeCycleAuditLog({
          adminUserId: admin.userId,
          cycleId,
          action: "STATUS_CHANGE",
          fieldName: "status",
          oldValue: existing.status,
          newValue: "CLOSED",
        }),
    },
    revalidateAdminEffect(),
  ]);
}

export async function revealMarketPulseCycleAction(
  cycleId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, status: true, revealAt: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const ppaValidation = await validateCycleReadyForReveal(cycleId);
  if (!ppaValidation.ready) {
    return adminFail(ppaValidation.message, undefined, {
      missingCards: ppaValidation.missingCards,
    });
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
    console.error("[admin] revealMarketPulseCycleAction transaction failed:", error);
    return adminFail(
      error instanceof Error
        ? error.message
        : "Reveal failed. Check server logs and try again.",
    );
  }

  let extraWarning: string | undefined;
  let revealSummary: RevealCycleSummary = {
    cycleId,
    decisionsScored: 0,
    usersScored: 0,
    eventsCreated: 0,
    topScore: null,
  };

  try {
    const summary = await calculateAndPersistCycleScores(cycleId);
    revealSummary = {
      cycleId,
      decisionsScored: summary.decisionsScored,
      usersScored: summary.usersScored,
      eventsCreated: summary.eventsCreated,
      topScore: summary.topScore,
    };
  } catch (error) {
    console.error("[admin] revealMarketPulseCycleAction scoring failed:", error);
    extraWarning =
      "Cycle was revealed but score calculation failed. Check server logs and refresh.";
  }

  const scoredMessage =
    revealSummary.decisionsScored > 0
      ? ` Scored ${revealSummary.decisionsScored} decisions for ${revealSummary.usersScored} players (${revealSummary.eventsCreated} score events).`
      : "";

  return finishAdminMutation(
    `Cycle "${cycle.name}" revealed.${scoredMessage}`,
    [
      {
        label: "audit log",
        run: () =>
          writeCycleAuditLog({
            adminUserId: admin.userId,
            cycleId,
            action: "REVEAL",
            fieldName: "status",
            oldValue: cycle.status,
            newValue: "REVEALED",
            reason: `Revealed cycle "${cycle.name}" and calculated scores`,
          }),
      },
      revalidateAdminEffect(),
    ],
    { extraWarning, revealSummary },
  );
}

export async function createMarketPulseCardAction(
  input: CreateMarketPulseCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const formValues: MarketPulseCardFormValues = {
    ...DEFAULT_CARD_FORM_VALUES,
    ...input,
    ppaSignal: input.ppaSignal ?? "",
    changeReason: "",
  };

  const validation = validateMarketPulseCardForm(formValues);
  if (!validation.valid) {
    const firstError =
      validation.errors.cycleId ??
      validation.errors.dayIndex ??
      validation.errors.companyName ??
      validation.errors.ticker ??
      validation.errors.headline ??
      validation.errors.summary ??
      validation.errors.cardImageUrl ??
      validation.errors.cardImageAlt ??
      validation.errors.ppaSignal ??
      validation.errors.ppaInsight ??
      "Invalid card data.";
    return adminFail(firstError, fieldErrorsFromRecord(validation.errors));
  }

  const uniqueError = await assertUniqueCardSlot({
    cycleId: input.cycleId,
    dayIndex: input.dayIndex,
    sortOrder: input.sortOrder ?? 0,
  });
  if (uniqueError) {
    return adminFail(uniqueError);
  }

  const statusPpaError = validateCardStatusPpa({
    cardType: input.cardType,
    status: input.status,
    ppaSignal: input.ppaSignal,
    ppaInsight: trimOrNull(input.ppaInsight),
  });
  if (statusPpaError) {
    return adminFail(statusPpaError);
  }

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: input.cycleId },
    select: { id: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  try {
    await prisma.marketPulseCard.create({
      data: cardPayloadFromInput(input),
    });
  } catch (error) {
    console.error("[admin] createMarketPulseCardAction failed:", error);
    return adminFail("Could not create card. Please try again.");
  }

  return finishAdminMutation("Card saved.", [revalidateAdminEffect()]);
}

export type QuickCreateMarketPulseCardDraftResult = {
  cardId: string;
};

export async function quickCreateMarketPulseCardDraftAction(
  cycleId: string,
  options?: { promptOverride?: string },
): Promise<AdminActionResult<QuickCreateMarketPulseCardDraftResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      revealAt: true,
      prizeLabel: true,
      cards: {
        select: {
          id: true,
          dayIndex: true,
          sortOrder: true,
          sourceDate: true,
          userPrompt: true,
          exchange: true,
          sourceName: true,
          sourceUrl: true,
          headline: true,
          companyName: true,
          ticker: true,
        },
      },
    },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const defaults = buildQuickDraftCardDefaults({
    cycle: {
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      revealAt: cycle.revealAt,
      prizeLabel: cycle.prizeLabel,
    },
    cards: cycle.cards,
  });

  const promptOverride = options?.promptOverride?.trim();
  const userPrompt = promptOverride || defaults.userPrompt;

  let card;
  try {
    card = await prisma.marketPulseCard.create({
      data: {
        cycleId: cycle.id,
        dayIndex: defaults.dayIndex,
        sortOrder: defaults.sortOrder,
        companyName: defaults.companyName,
        ticker: defaults.ticker,
        headline: defaults.headline,
        userPrompt,
        exchange: defaults.exchange,
        sourceName: defaults.sourceName,
        sourceUrl: defaults.sourceUrl,
        status: defaults.status,
        sourceDate: defaults.sourceDate,
        ppaSignal: null,
        ppaInsight: null,
        publishedAt: null,
      },
    });
  } catch (error) {
    console.error("[admin] quickCreateMarketPulseCardDraftAction failed:", error);
    return adminFail("Could not create card. Please try again.");
  }

  const builderPath = marketPulseCycleBuilderPath(cycle.id);

  return finishAdminMutation(
    "Draft card created.",
    [
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(builderPath);
        },
      },
    ],
    {
      data: {
        cardId: card.id,
      },
      extraWarning: defaults.schedulingWarning ?? undefined,
    },
  );
}

export async function quickCreateMarketPulseRestCardDraftAction(
  cycleId: string,
): Promise<AdminActionResult<QuickCreateMarketPulseCardDraftResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      revealAt: true,
      prizeLabel: true,
      cards: {
        select: {
          id: true,
          dayIndex: true,
          sortOrder: true,
          sourceDate: true,
          userPrompt: true,
          exchange: true,
          sourceName: true,
          sourceUrl: true,
          headline: true,
          companyName: true,
          ticker: true,
        },
      },
    },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const defaults = buildQuickRestDraftCardDefaults({
    cycle: {
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
      revealAt: cycle.revealAt,
      prizeLabel: cycle.prizeLabel,
    },
    cards: cycle.cards,
  });

  let card;
  try {
    card = await prisma.marketPulseCard.create({
      data: {
        cycleId: cycle.id,
        cardType: "REST",
        dayIndex: defaults.dayIndex,
        sortOrder: defaults.sortOrder,
        companyName: "",
        ticker: "",
        headline: defaults.headline,
        headlineZhHant: defaults.headlineZhHant,
        newsBody: defaults.newsBody,
        newsBodyZhHant: defaults.newsBodyZhHant,
        status: defaults.status,
        sourceDate: defaults.sourceDate,
        ppaSignal: null,
        ppaInsight: null,
        publishedAt: null,
      },
    });
  } catch (error) {
    console.error("[admin] quickCreateMarketPulseRestCardDraftAction failed:", error);
    return adminFail("Could not create rest card. Please try again.");
  }

  const builderPath = marketPulseCycleBuilderPath(cycle.id);

  return finishAdminMutation(
    "Rest card draft created.",
    [
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(builderPath);
        },
      },
    ],
    {
      data: {
        cardId: card.id,
      },
      extraWarning: defaults.schedulingWarning ?? undefined,
    },
  );
}

export type DuplicateMarketPulseCardInput = {
  sourceCardId: string;
  targetCycleId?: string;
};

export async function duplicateMarketPulseCardAction(
  input: DuplicateMarketPulseCardInput,
): Promise<AdminActionResult<QuickCreateMarketPulseCardDraftResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const source = await prisma.marketPulseCard.findUnique({
    where: { id: input.sourceCardId },
  });
  if (!source) {
    return adminFail("Card not found.");
  }

  const targetCycleId = input.targetCycleId?.trim() || source.cycleId;

  const targetCycle = await prisma.marketPulseCycle.findUnique({
    where: { id: targetCycleId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      cards: { select: { dayIndex: true, sortOrder: true, sourceDate: true } },
    },
  });
  if (!targetCycle) {
    return adminFail("Cycle not found.");
  }

  const duplicateData = buildDuplicateCardCreateData({
    source,
    targetCycleId: targetCycle.id,
    targetCycleStartsAt: targetCycle.startsAt,
    targetCycleEndsAt: targetCycle.endsAt,
    existingCards: targetCycle.cards,
  });

  let card;
  try {
    card = await prisma.marketPulseCard.create({
      data: duplicateData,
    });
  } catch (error) {
    console.error("[admin] duplicateMarketPulseCardAction failed:", error);
    return adminFail("Could not duplicate card. Please try again.");
  }

  const builderPath = marketPulseCycleBuilderPath(targetCycle.id);

  return finishAdminMutation(
    "Card duplicated.",
    [
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(builderPath);
        },
      },
    ],
    {
      data: {
        cardId: card.id,
      },
    },
  );
}

export type UpdateMarketPulseCardInput = CreateMarketPulseCardInput & {
  cardId: string;
  changeReason?: string;
};

export async function updateMarketPulseCardAction(
  input: UpdateMarketPulseCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  const formValues: MarketPulseCardFormValues = {
    ...DEFAULT_CARD_FORM_VALUES,
    ...input,
    ppaSignal: input.ppaSignal ?? "",
    changeReason: input.changeReason ?? "",
  };

  const validation = validateMarketPulseCardForm(formValues, {
    excludeDayIndex: card.dayIndex,
  });
  if (!validation.valid) {
    const firstError =
      validation.errors.cycleId ??
      validation.errors.dayIndex ??
      validation.errors.companyName ??
      validation.errors.ticker ??
      validation.errors.headline ??
      validation.errors.summary ??
      validation.errors.cardImageUrl ??
      validation.errors.cardImageAlt ??
      validation.errors.ppaSignal ??
      validation.errors.ppaInsight ??
      "Invalid card data.";
    return adminFail(firstError, fieldErrorsFromRecord(validation.errors));
  }

  const uniqueError = await assertUniqueCardSlot({
    cycleId: input.cycleId,
    dayIndex: input.dayIndex,
    sortOrder: input.sortOrder ?? 0,
    excludeCardId: input.cardId,
  });
  if (uniqueError) {
    return adminFail(uniqueError);
  }

  const nextSignal = input.ppaSignal ?? null;
  const nextInsight = trimOrNull(input.ppaInsight);
  const statusPpaError = validateCardStatusPpa({
    cardType: input.cardType,
    status: input.status,
    ppaSignal: nextSignal,
    ppaInsight: nextInsight,
  });
  if (statusPpaError) {
    return adminFail(statusPpaError);
  }

  const locked = Boolean(card.ppaSignalLockedAt);
  const signalChanged = locked && nextSignal !== card.ppaSignal;
  const insightChanged =
    locked && nextInsight !== (card.ppaInsight?.trim() || null);

  if (signalChanged || insightChanged) {
    const reason = input.changeReason?.trim();
    if (!reason) {
      return adminFail(
        "A reason is required when changing locked PPA fields.",
      );
    }
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: input.cardId },
      data: cardPayloadFromInput(
        {
          ...input,
          ppaSignal: nextSignal,
        },
        { existingPublishedAt: card.publishedAt },
      ),
    });
  } catch (error) {
    console.error("[admin] updateMarketPulseCardAction failed:", error);
    return adminFail("Could not save card. Please try again.");
  }

  const sideEffects = [revalidateAdminEffect()];

  if (signalChanged || insightChanged) {
    const reason = input.changeReason!.trim();
    if (signalChanged) {
      sideEffects.unshift({
        label: "PPA audit log",
        run: () =>
          writePpaAuditLog({
            adminUserId: admin.userId,
            cardId: card.id,
            fieldName: "ppaSignal",
            oldValue: card.ppaSignal,
            newValue: nextSignal,
            reason,
          }),
      });
    }
    if (insightChanged) {
      sideEffects.unshift({
        label: "PPA audit log",
        run: () =>
          writePpaAuditLog({
            adminUserId: admin.userId,
            cardId: card.id,
            fieldName: "ppaInsight",
            oldValue: card.ppaInsight,
            newValue: nextInsight,
            reason,
          }),
      });
    }
  }

  return finishAdminMutation("Card saved.", sideEffects);
}

export async function updateMarketPulseCardDraftAction(
  input: UpdateMarketPulseCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  const draftInput: UpdateMarketPulseCardInput = {
    ...input,
    status: "DRAFT",
    publishedAt: "",
  };

  const formValues: MarketPulseCardFormValues = {
    ...DEFAULT_CARD_FORM_VALUES,
    ...draftInput,
    ppaSignal: draftInput.ppaSignal ?? "",
    changeReason: draftInput.changeReason ?? "",
  };

  const validation = validateMarketPulseCardDraftSave(formValues, {
    existingDayIndexes: (
      await prisma.marketPulseCard.findMany({
        where: { cycleId: draftInput.cycleId, id: { not: input.cardId } },
        select: { dayIndex: true },
      })
    ).map((row) => row.dayIndex),
  });
  if (!validation.valid) {
    const firstError =
      validation.errors.cycleId ??
      validation.errors.dayIndex ??
      validation.errors.companyName ??
      validation.errors.ticker ??
      validation.errors.headline ??
      validation.errors.cardImageUrl ??
      validation.errors.cardImageAlt ??
      "Invalid card data.";
    return adminFail(firstError, fieldErrorsFromRecord(validation.errors));
  }

  const uniqueError = await assertUniqueCardSlot({
    cycleId: draftInput.cycleId,
    dayIndex: draftInput.dayIndex,
    sortOrder: draftInput.sortOrder ?? 0,
    excludeCardId: input.cardId,
  });
  if (uniqueError) {
    return adminFail(uniqueError);
  }

  const nextSignal = draftInput.ppaSignal ?? null;
  const nextInsight = trimOrNull(draftInput.ppaInsight);
  const locked = Boolean(card.ppaSignalLockedAt);
  const signalChanged = locked && nextSignal !== card.ppaSignal;
  const insightChanged =
    locked && nextInsight !== (card.ppaInsight?.trim() || null);

  if (signalChanged || insightChanged) {
    const reason = draftInput.changeReason?.trim();
    if (!reason) {
      return adminFail(
        "A reason is required when changing locked PPA fields.",
      );
    }
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: input.cardId },
      data: cardPayloadFromInput(
        {
          ...draftInput,
          ppaSignal: nextSignal,
          status: "DRAFT",
          publishedAt: "",
        },
        { existingPublishedAt: card.publishedAt },
      ),
    });
  } catch (error) {
    console.error("[admin] updateMarketPulseCardDraftAction failed:", error);
    return adminFail("Could not save card. Please try again.");
  }

  const sideEffects = [revalidateAdminEffect()];

  if (signalChanged || insightChanged) {
    const reason = draftInput.changeReason!.trim();
    if (signalChanged) {
      sideEffects.unshift({
        label: "PPA audit log",
        run: () =>
          writePpaAuditLog({
            adminUserId: admin.userId,
            cardId: card.id,
            fieldName: "ppaSignal",
            oldValue: card.ppaSignal,
            newValue: nextSignal,
            reason,
          }),
      });
    }
    if (insightChanged) {
      sideEffects.unshift({
        label: "PPA audit log",
        run: () =>
          writePpaAuditLog({
            adminUserId: admin.userId,
            cardId: card.id,
            fieldName: "ppaInsight",
            oldValue: card.ppaInsight,
            newValue: nextInsight,
            reason,
          }),
      });
    }
  }

  return finishAdminMutation("Draft saved.", sideEffects);
}

export type ReorderMarketPulseCardInput = {
  cardId: string;
  direction: "up" | "down";
};

export async function reorderMarketPulseCardAction(
  input: ReorderMarketPulseCardInput,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: input.cardId },
    select: { id: true, cycleId: true, dayIndex: true, sortOrder: true, status: true },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  const cycleCards = await prisma.marketPulseCard.findMany({
    where: { cycleId: card.cycleId },
    select: { id: true, dayIndex: true, sortOrder: true, status: true, createdAt: true },
    orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const neighbor = getAdjacentCardInOrder(cycleCards, card.id, input.direction);
  if (!neighbor) {
    return adminFail("Card is already at the edge of the list.");
  }

  const reorderBlock = canReorderMarketPulseCards(card, neighbor);
  if (reorderBlock) {
    return adminFail(reorderBlock);
  }

  const cardSortOrder = card.sortOrder ?? 0;
  const neighborSortOrder = neighbor.sortOrder ?? 0;

  try {
    if (card.dayIndex === neighbor.dayIndex) {
      await prisma.$transaction([
        prisma.marketPulseCard.update({
          where: { id: card.id },
          data: { sortOrder: temporarySortOrderForSwap(cardSortOrder) },
        }),
        prisma.marketPulseCard.update({
          where: { id: neighbor.id },
          data: { sortOrder: cardSortOrder },
        }),
        prisma.marketPulseCard.update({
          where: { id: card.id },
          data: { sortOrder: neighborSortOrder },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.marketPulseCard.update({
          where: { id: card.id },
          data: { dayIndex: temporaryDayIndexForSwap(card.dayIndex) },
        }),
        prisma.marketPulseCard.update({
          where: { id: neighbor.id },
          data: { dayIndex: card.dayIndex, sortOrder: cardSortOrder },
        }),
        prisma.marketPulseCard.update({
          where: { id: card.id },
          data: { dayIndex: neighbor.dayIndex, sortOrder: neighborSortOrder },
        }),
      ]);
    }
  } catch (error) {
    console.error("[admin] reorderMarketPulseCardAction failed:", error);
    return adminFail("Could not reorder cards. Please try again.");
  }

  return finishAdminMutation("Card order updated.", [revalidateAdminEffect()]);
}

export type FillMissingCardSourceDatesInput = {
  cycleId: string;
  apply?: boolean;
};

export type FillMissingCardSourceDatesResult = {
  preview: ReturnType<typeof buildFillMissingSourceDatesPreview>;
  updatedCount: number;
};

export async function fillMissingCardSourceDatesAction(
  input: FillMissingCardSourceDatesInput,
): Promise<AdminActionResult<FillMissingCardSourceDatesResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: input.cycleId },
    select: {
      id: true,
      startsAt: true,
      cards: {
        select: {
          id: true,
          dayIndex: true,
          headline: true,
          status: true,
          sourceDate: true,
        },
        orderBy: { dayIndex: "asc" },
      },
    },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const preview = buildFillMissingSourceDatesPreview({
    cycleStartsAt: cycle.startsAt,
    cards: cycle.cards,
  });

  if (!input.apply) {
    return adminOk("Preview ready.", {
      data: { preview, updatedCount: 0 },
    });
  }

  if (preview.updates.length === 0) {
    return adminOk("No draft cards are missing source dates.", {
      data: { preview, updatedCount: 0 },
    });
  }

  try {
    await prisma.$transaction(
      preview.updates.map((row) =>
        prisma.marketPulseCard.update({
          where: { id: row.cardId },
          data: { sourceDate: row.nextSourceDate },
        }),
      ),
    );
  } catch (error) {
    console.error("[admin] fillMissingCardSourceDatesAction failed:", error);
    return adminFail("Could not fill missing source dates. Please try again.");
  }

  return finishAdminMutation(
    `Filled source dates for ${preview.updates.length} draft card(s).`,
    [revalidateAdminEffect()],
    {
      data: {
        preview,
        updatedCount: preview.updates.length,
      },
    },
  );
}

export async function publishMarketPulseCardAction(
  cardId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  const publishError = validateCardPublishable(card);
  if (publishError) {
    return adminFail(publishError);
  }

  const cycleCards = await prisma.marketPulseCard.findMany({
    where: { cycleId: card.cycleId },
    select: {
      id: true,
      dayIndex: true,
      sourceDate: true,
      status: true,
    },
  });
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: card.cycleId },
    select: { startsAt: true, endsAt: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const schedulingError = getCardSchedulingPublishBlockReason(
    card,
    cycle,
    cycleCards,
  );
  if (schedulingError) {
    return adminFail(schedulingError);
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: {
        status: "PUBLISHED",
        publishedAt:
          card.publishedAt ??
          deriveCardPublishedAtFromSchedule(cycle.startsAt, card.dayIndex),
      },
    });
  } catch (error) {
    console.error("[admin] publishMarketPulseCardAction failed:", error);
    return adminFail("Could not publish card. Please try again.");
  }

  return finishAdminMutation("Card published.", [
    {
      label: "audit log",
      run: () =>
        prisma.marketPulseAuditLog.create({
          data: {
            adminUserId: admin.userId,
            entityType: "MarketPulseCard",
            entityId: cardId,
            action: "PUBLISH",
            fieldName: "status",
            oldValue: card.status,
            newValue: "PUBLISHED",
          },
        }),
    },
    revalidateAdminEffect(),
  ]);
}

function mapCardRowForBulkActions(card: Parameters<typeof mapMarketPulseAdminCardRow>[0]): MarketPulseAdminCardRow {
  return mapMarketPulseAdminCardRow(card);
}

const bulkCardSelect = {
  id: true,
  cycleId: true,
  dayIndex: true,
  sortOrder: true,
  cardType: true,
  companyName: true,
  companyNameZh: true,
  ticker: true,
  exchange: true,
  logoUrl: true,
  logoInitials: true,
  priceLabel: true,
  priceDirection: true,
  headline: true,
  headlineZhHant: true,
  newsBody: true,
  newsBodyZhHant: true,
  sourceName: true,
  sourceUrl: true,
  sourceDate: true,
  cardImageUrl: true,
  cardImageAlt: true,
  cardImageAltZhHant: true,
  summary: true,
  summaryZhHant: true,
  userPrompt: true,
  userPromptZhHant: true,
  status: true,
  ppaSignal: true,
  ppaInsight: true,
  ppaInsightZhHant: true,
  ppaSignalLockedAt: true,
  publishedAt: true,
  revealAt: true,
  createdAt: true,
  _count: { select: { decisions: true } },
} as const;

async function loadCycleCardsForBulkActions(
  cycleId: string,
  cardIds?: string[],
): Promise<MarketPulseAdminCardRow[] | null> {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true },
  });
  if (!cycle) {
    return null;
  }

  const cards = await prisma.marketPulseCard.findMany({
    where: {
      cycleId,
      ...(cardIds ? { id: { in: cardIds } } : {}),
    },
    select: bulkCardSelect,
    orderBy: { dayIndex: "asc" },
  });

  return cards.map(mapCardRowForBulkActions);
}

export type BulkPublishMarketPulseCardsInput = {
  cycleId: string;
  cardIds: string[];
};

export async function bulkPublishMarketPulseCardsAction(
  input: BulkPublishMarketPulseCardsInput,
): Promise<AdminActionResult<BulkPublishCardsResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const uniqueIds = [...new Set(input.cardIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return adminFail("Select at least one card.");
  }

  const cards = await loadCycleCardsForBulkActions(input.cycleId, uniqueIds);
  if (!cards) {
    return adminFail("Cycle not found.");
  }

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: input.cycleId },
    select: { startsAt: true, endsAt: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const allCards = await loadCycleCardsForBulkActions(input.cycleId);
  const plan = planBulkPublish(allCards ?? cards, uniqueIds, cycle);
  const publishedCardIds: string[] = [];

  try {
    for (const target of plan.publishable) {
      const card = cards.find((row) => row.id === target.cardId);
      if (!card) {
        continue;
      }

      const publishError = getCardPublishBlockReason(card, {
        cycle,
        allCards: allCards ?? cards,
      });
      if (publishError) {
        continue;
      }

      await prisma.marketPulseCard.update({
        where: { id: target.cardId },
        data: {
          status: "PUBLISHED",
          publishedAt: card.publishedAt ? new Date(card.publishedAt) : new Date(),
        },
      });

      await prisma.marketPulseAuditLog.create({
        data: {
          adminUserId: admin.userId,
          entityType: "MarketPulseCard",
          entityId: target.cardId,
          action: "PUBLISH",
          fieldName: "status",
          oldValue: card.status,
          newValue: "PUBLISHED",
        },
      });

      publishedCardIds.push(target.cardId);
    }
  } catch (error) {
    console.error("[admin] bulkPublishMarketPulseCardsAction failed:", error);
    return adminFail("Could not publish selected cards. Please try again.");
  }

  const result: BulkPublishCardsResult = {
    publishedCount: publishedCardIds.length,
    skippedCount: plan.skipped.length,
    publishedCardIds,
    skipped: plan.skipped,
  };

  const builderPath = marketPulseCycleBuilderPath(input.cycleId);

  return finishAdminMutation(
    formatBulkPublishMessage(result),
    [
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(builderPath);
        },
      },
    ],
    {
      data: result,
      extraWarning:
        result.skippedCount > 0
          ? `${result.skippedCount} card(s) were skipped because they did not pass validation.`
          : undefined,
    },
  );
}

export async function bulkPublishAllReadyMarketPulseCardsAction(
  cycleId: string,
): Promise<AdminActionResult<BulkPublishCardsResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cards = await loadCycleCardsForBulkActions(cycleId);
  if (!cards) {
    return adminFail("Cycle not found.");
  }

  const readyIds = getReadyToPublishCards(cards).map((card) => card.id);
  return bulkPublishMarketPulseCardsAction({
    cycleId,
    cardIds: readyIds,
  });
}

export type BulkUnpublishMarketPulseCardsInput = {
  cycleId: string;
  cardIds: string[];
};

export async function bulkUnpublishMarketPulseCardsAction(
  input: BulkUnpublishMarketPulseCardsInput,
): Promise<AdminActionResult<BulkUnpublishCardsResult>> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const uniqueIds = [...new Set(input.cardIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return adminFail("Select at least one card.");
  }

  const cards = await loadCycleCardsForBulkActions(input.cycleId, uniqueIds);
  if (!cards) {
    return adminFail("Cycle not found.");
  }

  const plan = planBulkUnpublish(cards, uniqueIds);
  const unpublishedCardIds: string[] = [];

  try {
    for (const target of plan.unpublishable) {
      const card = cards.find((row) => row.id === target.cardId);
      if (!card) {
        continue;
      }

      const unpublishError = getCardUnpublishBlockReason(card);
      if (unpublishError) {
        continue;
      }

      await prisma.marketPulseCard.update({
        where: { id: target.cardId },
        data: {
          status: "DRAFT",
          publishedAt: null,
        },
      });

      await prisma.marketPulseAuditLog.create({
        data: {
          adminUserId: admin.userId,
          entityType: "MarketPulseCard",
          entityId: target.cardId,
          action: "UNPUBLISH",
          fieldName: "status",
          oldValue: card.status,
          newValue: "DRAFT",
        },
      });

      unpublishedCardIds.push(target.cardId);
    }
  } catch (error) {
    console.error("[admin] bulkUnpublishMarketPulseCardsAction failed:", error);
    return adminFail("Could not unpublish selected cards. Please try again.");
  }

  const result: BulkUnpublishCardsResult = {
    unpublishedCount: unpublishedCardIds.length,
    skippedCount: plan.skipped.length,
    unpublishedCardIds,
    skipped: plan.skipped,
  };

  const builderPath = marketPulseCycleBuilderPath(input.cycleId);

  return finishAdminMutation(
    formatBulkUnpublishMessage(result),
    [
      revalidateAdminEffect(),
      {
        label: "builder cache refresh",
        run: () => {
          revalidatePath(builderPath);
        },
      },
    ],
    {
      data: result,
      extraWarning:
        result.skippedCount > 0
          ? `${result.skippedCount} card(s) were skipped because they could not be unpublished.`
          : undefined,
    },
  );
}

export async function unpublishMarketPulseCardAction(
  cardId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
    select: {
      ...bulkCardSelect,
      cycleId: true,
    },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  const row = mapCardRowForBulkActions(card);
  const unpublishError = getCardUnpublishBlockReason(row);
  if (unpublishError) {
    return adminFail(unpublishError);
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: {
        status: "DRAFT",
        publishedAt: null,
      },
    });
  } catch (error) {
    console.error("[admin] unpublishMarketPulseCardAction failed:", error);
    return adminFail("Could not unpublish card. Please try again.");
  }

  return finishAdminMutation("Card unpublished.", [
    {
      label: "audit log",
      run: () =>
        prisma.marketPulseAuditLog.create({
          data: {
            adminUserId: admin.userId,
            entityType: "MarketPulseCard",
            entityId: cardId,
            action: "UNPUBLISH",
            fieldName: "status",
            oldValue: row.status,
            newValue: "DRAFT",
          },
        }),
    },
    revalidateAdminEffect(),
  ]);
}

export async function lockMarketPulseCardPpaAction(
  cardId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const card = await prisma.marketPulseCard.findUnique({
    where: { id: cardId },
  });
  if (!card) {
    return adminFail("Card not found.");
  }

  if (!card.ppaSignal || !card.ppaInsight?.trim()) {
    return adminFail("PPA signal and insight must be set before locking.");
  }

  if (card.ppaSignalLockedAt) {
    return adminFail("PPA signal is already locked.");
  }

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: { ppaSignalLockedAt: new Date() },
    });
  } catch (error) {
    console.error("[admin] lockMarketPulseCardPpaAction failed:", error);
    return adminFail("Could not lock PPA signal. Please try again.");
  }

  return finishAdminMutation("PPA signal locked.", [
    {
      label: "audit log",
      run: () =>
        prisma.marketPulseAuditLog.create({
          data: {
            adminUserId: admin.userId,
            entityType: "MarketPulseCard",
            entityId: cardId,
            action: "LOCK_PPA",
            reason: "PPA signal locked by admin",
          },
        }),
    },
    revalidateAdminEffect(),
  ]);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportMarketPulseLeaderboardAction(
  cycleId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true },
  });
  if (!cycle) {
    return adminFail("Cycle not found.");
  }

  const rows = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId,
    limit: 500,
  });

  const header = "rank,playerName,score,cardsPlayed";
  const lines = rows.map((row) =>
    [
      row.rank,
      csvEscape(row.playerName),
      row.score,
      row.cardsPlayed ?? "",
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");
  const slug = cycle.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return adminOk(`Exported ${rows.length} rows.`, {
    csv,
    filename: `market-pulse-leaderboard-${slug || cycle.id}.csv`,
  });
}

const PRIZE_CLAIM_STATUSES: MarketPulsePrizeStatus[] = [
  "PENDING_REVIEW",
  "VERIFIED",
  "CONTACTED",
  "CLAIMED",
  "DISQUALIFIED",
  "EXPIRED",
];

function isValidPrizeStatus(status: string): status is MarketPulsePrizeStatus {
  return PRIZE_CLAIM_STATUSES.includes(status as MarketPulsePrizeStatus);
}

async function assertRevealedCycle(cycleId: string) {
  const cycle = await prisma.marketPulseCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, status: true, revealAt: true, name: true },
  });
  if (!cycle) {
    return { ok: false as const, error: "Cycle not found." };
  }
  if (!isMarketPulseCycleRevealed(cycle)) {
    return { ok: false as const, error: "Prize review requires a revealed cycle." };
  }
  return { ok: true as const, cycle };
}

export async function createMarketPulsePrizeClaimAction(input: {
  cycleId: string;
  userId: string;
  rank: number;
}): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  if (!Number.isInteger(input.rank) || input.rank < 1 || input.rank > 10) {
    return adminFail("Rank must be between 1 and 10.");
  }

  const cycleResult = await assertRevealedCycle(input.cycleId);
  if (!cycleResult.ok) {
    return adminFail(cycleResult.error);
  }

  const existing = await prisma.marketPulsePrizeClaim.findFirst({
    where: {
      cycleId: input.cycleId,
      leaderboardType: "CURRENT_CYCLE",
      rank: input.rank,
    },
    select: { id: true },
  });
  if (existing) {
    return adminFail(`A prize claim already exists for rank ${input.rank}.`);
  }

  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId: input.cycleId,
    limit: 10,
  });
  const entry = leaderboard.find(
    (row) => row.rank === input.rank && row.userId === input.userId,
  );
  if (!entry) {
    return adminFail("User does not match the leaderboard entry for this rank.");
  }

  try {
    await prisma.marketPulsePrizeClaim.create({
      data: {
        userId: input.userId,
        cycleId: input.cycleId,
        leaderboardType: "CURRENT_CYCLE",
        rank: input.rank,
        prizeName: prizeNameForRank(input.rank),
        status: "PENDING_REVIEW",
      },
    });
  } catch (error) {
    console.error("[admin] createMarketPulsePrizeClaimAction failed:", error);
    return adminFail("Could not create prize claim. Please try again.");
  }

  return finishAdminMutation(
    `Prize claim created for rank ${input.rank}.`,
    [revalidateAdminEffect()],
  );
}

export async function createAllMarketPulsePrizeClaimsAction(
  cycleId: string,
): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  const cycleResult = await assertRevealedCycle(cycleId);
  if (!cycleResult.ok) {
    return adminFail(cycleResult.error);
  }

  const leaderboard = await getMarketPulseLeaderboard({
    mode: "CURRENT_CYCLE",
    cycleId,
    limit: 10,
  });

  if (leaderboard.length === 0) {
    return adminFail("No leaderboard entries to award.");
  }

  const existing = await prisma.marketPulsePrizeClaim.findMany({
    where: {
      cycleId,
      leaderboardType: "CURRENT_CYCLE",
      rank: { lte: 10 },
    },
    select: { rank: true },
  });
  const existingRanks = new Set(existing.map((claim) => claim.rank));

  const toCreate = leaderboard.filter((row) => !existingRanks.has(row.rank));
  if (toCreate.length === 0) {
    return adminFail("Prize claims already exist for the top 10.");
  }

  try {
    await prisma.marketPulsePrizeClaim.createMany({
      data: toCreate.map((row) => ({
        userId: row.userId,
        cycleId,
        leaderboardType: "CURRENT_CYCLE" as const,
        rank: row.rank,
        prizeName: prizeNameForRank(row.rank),
        status: "PENDING_REVIEW" as const,
      })),
    });
  } catch (error) {
    console.error("[admin] createAllMarketPulsePrizeClaimsAction failed:", error);
    return adminFail("Could not create prize claims. Please try again.");
  }

  return finishAdminMutation(
    `Created ${toCreate.length} prize claim${toCreate.length === 1 ? "" : "s"}.`,
    [revalidateAdminEffect()],
  );
}

export async function updateMarketPulsePrizeClaimStatusAction(input: {
  claimId: string;
  status: MarketPulsePrizeStatus;
}): Promise<AdminActionResult> {
  const admin = await requireAdminSession();
  if (!admin) return unauthorized();

  if (!isValidPrizeStatus(input.status)) {
    return adminFail("Invalid prize claim status.");
  }

  const claim = await prisma.marketPulsePrizeClaim.findUnique({
    where: { id: input.claimId },
    select: { id: true, status: true, verifiedAt: true, claimedAt: true },
  });
  if (!claim) {
    return adminFail("Prize claim not found.");
  }

  const now = new Date();
  try {
    await prisma.marketPulsePrizeClaim.update({
      where: { id: input.claimId },
      data: {
        status: input.status,
        verifiedAt:
          input.status === "VERIFIED" || input.status === "CLAIMED"
            ? (claim.verifiedAt ?? now)
            : claim.verifiedAt,
        claimedAt:
          input.status === "CLAIMED" ? (claim.claimedAt ?? now) : claim.claimedAt,
      },
    });
  } catch (error) {
    console.error("[admin] updateMarketPulsePrizeClaimStatusAction failed:", error);
    return adminFail("Could not update prize claim. Please try again.");
  }

  return finishAdminMutation(`Prize claim marked ${input.status}.`, [
    revalidateAdminEffect(),
  ]);
}
