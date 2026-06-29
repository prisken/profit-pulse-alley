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
  type MarketPulseCardFormValues,
} from "@/lib/market-pulse/card-validation";
import {
  parseCycleDate,
  validateMarketPulseCycleDates,
} from "@/lib/market-pulse/cycle-validation";
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

async function assertUniqueDayIndex(input: {
  cycleId: string;
  dayIndex: number;
  excludeCardId?: string;
}): Promise<string | null> {
  const existing = await prisma.marketPulseCard.findFirst({
    where: {
      cycleId: input.cycleId,
      dayIndex: input.dayIndex,
      ...(input.excludeCardId ? { NOT: { id: input.excludeCardId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    return "Day index must be unique within the cycle.";
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
    companyName: input.companyName.trim(),
    companyNameZh: trimOrNull(input.companyNameZh),
    ticker: input.ticker.trim(),
    exchange: trimOrNull(input.exchange),
    logoUrl: trimOrNull(input.logoUrl),
    logoInitials: trimOrNull(input.logoInitials),
    priceLabel: trimOrNull(input.priceLabel),
    priceDirection: trimOrNull(input.priceDirection),
    headline: input.headline.trim(),
    newsBody: trimOrNull(input.newsBody),
    sourceName: trimOrNull(input.sourceName),
    sourceUrl: trimOrNull(input.sourceUrl),
    sourceDate: parseCardDate(input.sourceDate),
    cardImageUrl: trimOrNull(input.cardImageUrl),
    cardImageAlt: trimOrNull(input.cardImageAlt),
    summary: trimOrNull(input.summary),
    userPrompt: trimOrNull(input.userPrompt),
    ppaSignal: input.ppaSignal,
    ppaInsight: trimOrNull(input.ppaInsight),
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

  sideEffects.push(revalidateAdminEffect());

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

  const uniqueError = await assertUniqueDayIndex({
    cycleId: input.cycleId,
    dayIndex: input.dayIndex,
  });
  if (uniqueError) {
    return adminFail(uniqueError);
  }

  const statusPpaError = validateCardStatusPpa({
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

  const uniqueError = await assertUniqueDayIndex({
    cycleId: input.cycleId,
    dayIndex: input.dayIndex,
    excludeCardId: input.cardId,
  });
  if (uniqueError) {
    return adminFail(uniqueError);
  }

  const nextSignal = input.ppaSignal ?? null;
  const nextInsight = trimOrNull(input.ppaInsight);
  const statusPpaError = validateCardStatusPpa({
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
          cycleId: input.cycleId,
          dayIndex: input.dayIndex,
          companyName: input.companyName,
          companyNameZh: input.companyNameZh,
          ticker: input.ticker,
          exchange: input.exchange,
          logoUrl: input.logoUrl,
          logoInitials: input.logoInitials,
          priceLabel: input.priceLabel,
          priceDirection: input.priceDirection,
          headline: input.headline,
          newsBody: input.newsBody,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          sourceDate: input.sourceDate,
          cardImageUrl: input.cardImageUrl,
          cardImageAlt: input.cardImageAlt,
          summary: input.summary,
          userPrompt: input.userPrompt,
          ppaSignal: nextSignal,
          ppaInsight: input.ppaInsight,
          status: input.status,
          publishedAt: input.publishedAt,
          revealAt: input.revealAt,
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

  try {
    await prisma.marketPulseCard.update({
      where: { id: cardId },
      data: {
        status: "PUBLISHED",
        publishedAt: card.publishedAt ?? new Date(),
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
