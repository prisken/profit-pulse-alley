import { getCycleDayIndexZeroBased } from "@/lib/market-pulse/playable-card";
import { addHktDays } from "@/lib/market-pulse/quick-create-cycle-defaults";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type CycleCardSchedulingRow = {
  id: string;
  dayIndex: number;
  sourceDate?: string | Date | null;
  status?: string;
};

export type NextDayIndexResult = {
  dayIndex: number;
  exceedsCycleCapacity: boolean;
};

export type NextSourceDateResult = {
  sourceDate: Date;
  skippedUsedDates: boolean;
  outsideCycleRange: boolean;
};

export type FillMissingSourceDatePreviewRow = {
  cardId: string;
  dayIndex: number;
  headline: string;
  currentSourceDate: string | null;
  nextSourceDate: Date;
};

export type FillMissingSourceDatePreview = {
  updates: FillMissingSourceDatePreviewRow[];
  skippedCount: number;
};

/** Matches hub dayTotal calculation for cycle span. */
export function getCycleDayCapacity(
  startsAt: Date | string,
  endsAt: Date | string,
): number {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const spanMs = Math.max(end.getTime() - start.getTime(), MS_PER_DAY);
  return Math.max(1, Math.round(spanMs / MS_PER_DAY));
}

export function sourceDateHktDayKey(date: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function collectUsedSourceDateKeys(
  cards: Pick<CycleCardSchedulingRow, "sourceDate">[],
  excludeCardId?: string,
): Set<string> {
  const keys = new Set<string>();
  for (const card of cards) {
    if (excludeCardId && "id" in card && card.id === excludeCardId) {
      continue;
    }
    if (!card.sourceDate) {
      continue;
    }
    keys.add(sourceDateHktDayKey(card.sourceDate));
  }
  return keys;
}

export function findDuplicateDayIndexes(
  cards: Pick<CycleCardSchedulingRow, "dayIndex">[],
): Set<number> {
  const counts = new Map<number, number>();

  for (const card of cards) {
    counts.set(card.dayIndex, (counts.get(card.dayIndex) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([dayIndex]) => dayIndex),
  );
}

export function findDuplicateSourceDateKeys(
  cards: Pick<CycleCardSchedulingRow, "sourceDate">[],
): Set<string> {
  const counts = new Map<string, number>();

  for (const card of cards) {
    if (!card.sourceDate) {
      continue;
    }
    const key = sourceDateHktDayKey(card.sourceDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
  );
}

export function nextAvailableDayIndex(
  existingDayIndexes: number[],
  cycleDayCapacity?: number,
): NextDayIndexResult {
  const used = new Set(existingDayIndexes);
  const searchWithin =
    cycleDayCapacity ??
    (used.size > 0 ? Math.max(...existingDayIndexes) : 0);

  for (let day = 1; day <= searchWithin; day++) {
    if (!used.has(day)) {
      return { dayIndex: day, exceedsCycleCapacity: false };
    }
  }

  const nextDay = searchWithin + 1;
  return {
    dayIndex: nextDay,
    exceedsCycleCapacity:
      cycleDayCapacity != null && nextDay > cycleDayCapacity,
  };
}

export function nextAvailableSourceDate(input: {
  cycleStartsAt: Date | string;
  preferredDayIndex: number;
  usedSourceDateKeys: Set<string>;
  cycleEndsAt?: Date | string;
}): NextSourceDateResult {
  const cycleStartsAt = new Date(input.cycleStartsAt);
  const capacity = input.cycleEndsAt
    ? getCycleDayCapacity(cycleStartsAt, input.cycleEndsAt)
    : null;
  const startOffset = Math.max(input.preferredDayIndex - 1, 0);
  const maxOffset =
    capacity != null ? capacity - 1 : startOffset + Math.max(30, usedSize(input.usedSourceDateKeys));

  let skippedUsedDates = false;

  for (let offset = startOffset; offset <= maxOffset; offset++) {
    const candidate = addHktDays(cycleStartsAt, offset);
    const key = sourceDateHktDayKey(candidate);
    if (!input.usedSourceDateKeys.has(key)) {
      const dayIndex = offset + 1;
      return {
        sourceDate: candidate,
        skippedUsedDates,
        outsideCycleRange: capacity != null && dayIndex > capacity,
      };
    }
    skippedUsedDates = true;
  }

  const fallbackDay = maxOffset + 1;
  return {
    sourceDate: addHktDays(cycleStartsAt, fallbackDay - 1),
    skippedUsedDates: true,
    outsideCycleRange: true,
  };
}

function usedSize(set: Set<string>): number {
  return set.size;
}

export function formatSchedulingWarning(input: {
  exceedsCycleCapacity: boolean;
  outsideCycleRange: boolean;
  skippedUsedDates: boolean;
  cycleDayCapacity: number;
  dayIndex: number;
}): string | null {
  if (input.exceedsCycleCapacity) {
    return `Day ${input.dayIndex} is beyond this cycle's ${input.cycleDayCapacity}-day span. The draft was still created; adjust day or cycle dates before publishing.`;
  }
  if (input.outsideCycleRange) {
    return "Assigned source date falls outside the cycle date range. Review before publishing.";
  }
  if (input.skippedUsedDates) {
    return "Assigned the next unused source date because earlier dates are already taken.";
  }
  return null;
}

export function getCardSchedulingPublishBlockReason(
  card: CycleCardSchedulingRow,
  cycle: { startsAt: Date | string; endsAt: Date | string },
  allCards: CycleCardSchedulingRow[],
): string | null {
  const duplicateDays = findDuplicateDayIndexes(allCards);
  if (duplicateDays.has(card.dayIndex)) {
    return "Day index must be unique within the cycle.";
  }

  if (card.sourceDate) {
    const duplicateSourceDates = findDuplicateSourceDateKeys(allCards);
    const key = sourceDateHktDayKey(card.sourceDate);
    if (duplicateSourceDates.has(key)) {
      return "Another card in this cycle already uses this news published date.";
    }
  }

  const capacity = getCycleDayCapacity(cycle.startsAt, cycle.endsAt);
  if (card.dayIndex > capacity) {
    return `Day index ${card.dayIndex} exceeds the cycle length (${capacity} day(s)).`;
  }

  const expectedZeroBased = card.dayIndex - 1;
  const maxZeroBased = getCycleDayIndexZeroBased(
    new Date(cycle.startsAt),
    new Date(cycle.endsAt),
  );
  if (expectedZeroBased > maxZeroBased) {
    return `Day index ${card.dayIndex} does not align with the cycle calendar.`;
  }

  return null;
}

export function getCardSchedulingConflictMessages(
  card: CycleCardSchedulingRow,
  cycle: { startsAt: Date | string; endsAt: Date | string },
  allCards: CycleCardSchedulingRow[],
): string[] {
  const reason = getCardSchedulingPublishBlockReason(card, cycle, allCards);
  return reason ? [reason] : [];
}

export function canReorderMarketPulseCards(
  card: Pick<CycleCardSchedulingRow, "status">,
  neighbor: Pick<CycleCardSchedulingRow, "status">,
): string | null {
  if (card.status === "PUBLISHED" || neighbor.status === "PUBLISHED") {
    return "Published cards cannot be reordered. Unpublish first or edit day manually.";
  }
  return null;
}

export function getAdjacentCardInOrder(
  cards: CycleCardSchedulingRow[],
  cardId: string,
  direction: "up" | "down",
): CycleCardSchedulingRow | null {
  const sorted = [...cards].sort((a, b) => a.dayIndex - b.dayIndex);
  const index = sorted.findIndex((card) => card.id === cardId);
  if (index < 0) {
    return null;
  }

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  return sorted[neighborIndex] ?? null;
}

export function buildFillMissingSourceDatesPreview(input: {
  cycleStartsAt: Date | string;
  cards: Array<
    CycleCardSchedulingRow & {
      headline: string;
      status: string;
    }
  >;
}): FillMissingSourceDatePreview {
  const cycleStartsAt = new Date(input.cycleStartsAt);
  const drafts = [...input.cards]
    .filter((card) => card.status !== "PUBLISHED" && !card.sourceDate)
    .sort((a, b) => a.dayIndex - b.dayIndex);

  const usedKeys = collectUsedSourceDateKeys(input.cards);
  const updates: FillMissingSourceDatePreviewRow[] = [];

  for (const card of drafts) {
    const assignment = nextAvailableSourceDate({
      cycleStartsAt,
      preferredDayIndex: card.dayIndex,
      usedSourceDateKeys: usedKeys,
    });
    const key = sourceDateHktDayKey(assignment.sourceDate);
    usedKeys.add(key);
    updates.push({
      cardId: card.id,
      dayIndex: card.dayIndex,
      headline: card.headline,
      currentSourceDate: null,
      nextSourceDate: assignment.sourceDate,
    });
  }

  return {
    updates,
    skippedCount: input.cards.filter(
      (card) => card.status !== "PUBLISHED" && !card.sourceDate,
    ).length - updates.length,
  };
}

export const CARD_DAY_INDEX_SWAP_TEMP_OFFSET = 1_000_000;

export function temporaryDayIndexForSwap(dayIndex: number): number {
  return CARD_DAY_INDEX_SWAP_TEMP_OFFSET + dayIndex;
}
