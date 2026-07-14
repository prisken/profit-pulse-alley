import "server-only";

import { loadMarketPulseNextCycleStatus } from "@/lib/market-pulse/next-cycle";
import { findPlayableCardsForToday } from "@/lib/market-pulse/playable-card";
import {
  getActiveMarketPulseCycle,
  getMarketPulseSettings,
} from "@/lib/market-pulse/server";
import {
  sendMarketPulseReminderEmail,
  type ReminderEmailKind,
} from "@/lib/notifications/reminder-email";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ReminderCronOpportunity =
  | {
      kind: "playable_card";
      cycleId: string;
      cardIds: string[];
    }
  | {
      kind: "next_cycle";
      cycleId: string;
      startsAtIso: string;
    };

export type ReminderCronSummary = {
  opportunity: ReminderEmailKind | "none";
  candidates: number;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
};

export async function resolveMarketPulseReminderOpportunity(
  now: Date = new Date(),
): Promise<ReminderCronOpportunity | null> {
  try {
    const settings = await getMarketPulseSettings();
    if (settings.runtimeStatus === "OPEN") {
      const cycle = await getActiveMarketPulseCycle();
      if (cycle) {
        const playable = findPlayableCardsForToday(cycle, now);
        if (playable.length > 0) {
          return {
            kind: "playable_card",
            cycleId: cycle.id,
            cardIds: playable.map((card) => card.id),
          };
        }
      }
    }
  } catch (error) {
    console.error(
      "[reminder-cron] Failed to resolve playable-card opportunity:",
      error,
    );
  }

  try {
    const next = await loadMarketPulseNextCycleStatus({ now });
    if (next.status === "available") {
      const startsAtMs = new Date(next.startsAtIso).getTime();
      const delta = startsAtMs - now.getTime();
      if (delta > 0 && delta <= MS_PER_DAY) {
        return {
          kind: "next_cycle",
          cycleId: next.cycleId,
          startsAtIso: next.startsAtIso,
        };
      }
    }
  } catch (error) {
    console.error(
      "[reminder-cron] Failed to resolve next-cycle opportunity:",
      error,
    );
  }

  return null;
}

async function loadOptedInReminderCandidates(): Promise<
  Array<{ userId: string; email: string }>
> {
  const rows = await prisma.userNotificationPreference.findMany({
    where: {
      marketPulseRemindersEnabled: true,
      unsubscribedAt: null,
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return rows
    .map((row) => ({
      userId: row.userId,
      email: row.user.email?.trim() ?? "",
    }))
    .filter((row) => Boolean(row.email));
}

/**
 * Cron batch: remind opted-in users about today's playable signal or an
 * upcoming cycle (within 24h). Never throws; returns count summary only.
 */
export async function runMarketPulseReminderCron(
  now: Date = new Date(),
): Promise<ReminderCronSummary> {
  const summary: ReminderCronSummary = {
    opportunity: "none",
    candidates: 0,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const opportunity = await resolveMarketPulseReminderOpportunity(now);
    if (!opportunity) {
      return summary;
    }

    summary.opportunity = opportunity.kind;

    const candidates = await loadOptedInReminderCandidates();
    summary.candidates = candidates.length;

    if (candidates.length === 0) {
      return summary;
    }

    const userIds = candidates.map((c) => c.userId);
    const playedCardByUser = new Map<string, Set<string>>();

    if (opportunity.kind === "playable_card") {
      const decisions = await prisma.marketPulseDecision.findMany({
        where: {
          userId: { in: userIds },
          cardId: { in: opportunity.cardIds },
        },
        select: { userId: true, cardId: true },
      });

      for (const decision of decisions) {
        const set = playedCardByUser.get(decision.userId) ?? new Set<string>();
        set.add(decision.cardId);
        playedCardByUser.set(decision.userId, set);
      }
    }

    for (const candidate of candidates) {
      summary.attempted += 1;

      if (opportunity.kind === "playable_card") {
        const played = playedCardByUser.get(candidate.userId) ?? new Set();
        const unplayedCardId = opportunity.cardIds.find(
          (cardId) => !played.has(cardId),
        );

        if (!unplayedCardId) {
          summary.skipped += 1;
          continue;
        }

        const result = await sendMarketPulseReminderEmail({
          userId: candidate.userId,
          email: candidate.email,
          kind: "playable_card",
          cycleId: opportunity.cycleId,
          cardId: unplayedCardId,
          now,
        });

        if (result.ok) {
          summary.sent += 1;
        } else if (result.reason === "delivery_failed") {
          summary.failed += 1;
        } else {
          summary.skipped += 1;
        }
        continue;
      }

      const result = await sendMarketPulseReminderEmail({
        userId: candidate.userId,
        email: candidate.email,
        kind: "next_cycle",
        cycleId: opportunity.cycleId,
        now,
      });

      if (result.ok) {
        summary.sent += 1;
      } else if (result.reason === "delivery_failed") {
        summary.failed += 1;
      } else {
        summary.skipped += 1;
      }
    }
  } catch (error) {
    console.error("[reminder-cron] runMarketPulseReminderCron failed:", error);
  }

  return summary;
}
