import "server-only";

import type { MarketPulseCycleStatus } from "@prisma/client";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";
import { sortMarketPulseBuilderCards } from "@/lib/market-pulse/admin-card-scheduling";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { getCycleDayReleaseAt } from "@/lib/market-pulse/card-release-schedule";
import { formatHktDateOnlyFromUtcInstant } from "@/lib/market-pulse/hkt-time";
import { prisma } from "@/lib/prisma";

export type ApprovalsDayGroup = {
  dayIndex: number;
  hktDate: string | null;
  cards: MarketPulseAdminCardRow[];
};

export type ApprovalsCycleGroup = {
  cycleId: string;
  cycleName: string;
  cycleStatus: MarketPulseCycleStatus;
  startDateHkt: string;
  days: ApprovalsDayGroup[];
};

export type MarketPulseApprovalsPageData = {
  adminEmail: string;
  groups: ApprovalsCycleGroup[];
};

/**
 * Loads non-published cards of the most recent non-revealed cycles, grouped by
 * cycle and cycle day, for the admin approvals queue.
 */
export async function getMarketPulseApprovalsPageData(): Promise<MarketPulseApprovalsPageData | null> {
  const admin = await requireAdminSession();
  if (!admin) return null;

  const cycles = await prisma.marketPulseCycle.findMany({
    where: { status: { in: ["DRAFT", "OPEN", "CLOSED"] } },
    orderBy: { startsAt: "desc" },
    take: 4,
    select: { id: true, name: true, status: true, startsAt: true },
  });
  if (cycles.length === 0) {
    return { adminEmail: admin.email, groups: [] };
  }

  const cards = await prisma.marketPulseCard.findMany({
    where: {
      cycleId: { in: cycles.map((c) => c.id) },
      status: { not: "PUBLISHED" },
    },
    include: { _count: { select: { decisions: true } } },
    orderBy: [{ dayIndex: "asc" }, { sortOrder: "asc" }],
  });

  const groups: ApprovalsCycleGroup[] = cycles.map((cycle) => {
    const dayMap = new Map<number, ApprovalsDayGroup>();

    const rows = sortMarketPulseBuilderCards(
      cards
        .filter((card) => card.cycleId === cycle.id)
        .map((card) =>
          mapMarketPulseAdminCardRow({
            ...card,
            _count: { decisions: card._count.decisions },
          }),
        ),
    );

    for (const row of rows) {
      let day = dayMap.get(row.dayIndex);
      if (!day) {
        let hktDate: string | null = null;
        try {
          hktDate = formatHktDateOnlyFromUtcInstant(
            getCycleDayReleaseAt(cycle.startsAt, row.dayIndex),
          );
        } catch {
          hktDate = null;
        }
        day = { dayIndex: row.dayIndex, hktDate, cards: [] };
        dayMap.set(row.dayIndex, day);
      }
      day.cards.push(row);
    }

    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      cycleStatus: cycle.status,
      startDateHkt: formatHktDateOnlyFromUtcInstant(cycle.startsAt),
      days: [...dayMap.values()],
    };
  });

  return { adminEmail: admin.email, groups };
}
