import { getCycleDayIndexZeroBased } from "@/lib/market-pulse/playable-card";
import {
  getCycleDayReleaseAt,
  MARKET_PULSE_CARD_RELEASE_HKT_HOUR,
} from "@/lib/market-pulse/card-release-schedule";
import {
  addHktDays,
} from "@/lib/market-pulse/quick-create-cycle-defaults";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export {
  deriveCardPublishedAtFromSchedule,
  getCycleDayReleaseAt,
  MARKET_PULSE_CARD_RELEASE_HKT_HOUR,
} from "@/lib/market-pulse/card-release-schedule";

export type CycleCardSchedulingRow = {
  id: string;
  dayIndex: number;
  sortOrder?: number;
  createdAt?: string | Date | null;
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

export function compareMarketPulseBuilderCards<
  T extends Pick<CycleCardSchedulingRow, "dayIndex" | "sortOrder" | "createdAt" | "id">,
>(a: T, b: T): number {
  if (a.dayIndex !== b.dayIndex) {
    return a.dayIndex - b.dayIndex;
  }
  const sortA = a.sortOrder ?? 0;
  const sortB = b.sortOrder ?? 0;
  if (sortA !== sortB) {
    return sortA - sortB;
  }
  const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (createdA !== createdB) {
    return createdA - createdB;
  }
  return (a.id ?? "").localeCompare(b.id ?? "");
}

export function sortMarketPulseBuilderCards<
  T extends Pick<CycleCardSchedulingRow, "dayIndex" | "sortOrder" | "createdAt" | "id">,
>(cards: T[]): T[] {
  return [...cards].sort(compareMarketPulseBuilderCards);
}

export function nextSortOrderForDay(
  cards: Pick<CycleCardSchedulingRow, "dayIndex" | "sortOrder">[],
  dayIndex: number,
): number {
  const orders = cards
    .filter((card) => card.dayIndex === dayIndex)
    .map((card) => card.sortOrder ?? 0);
  if (orders.length === 0) {
    return 0;
  }
  return Math.max(...orders) + 1;
}

export function getCurrentCycleDayIndex(
  cycleStartsAt: Date | string,
  cycleEndsAt: Date | string,
  now: Date = new Date(),
): number {
  const startsAt = new Date(cycleStartsAt);
  const capacity = getCycleDayCapacity(startsAt, cycleEndsAt);
  if (now.getTime() < startsAt.getTime()) {
    return 1;
  }
  const elapsedMs = now.getTime() - startsAt.getTime();
  const day = Math.floor(elapsedMs / MS_PER_DAY) + 1;
  return Math.min(Math.max(1, day), capacity);
}

export type QuickDraftSlot = {
  dayIndex: number;
  sortOrder: number;
  exceedsCycleCapacity: boolean;
};

export function suggestQuickDraftSlot(input: {
  cycleStartsAt: Date | string;
  cycleEndsAt: Date | string;
  cards: Pick<CycleCardSchedulingRow, "dayIndex" | "sortOrder">[];
  now?: Date;
}): QuickDraftSlot {
  const capacity = getCycleDayCapacity(input.cycleStartsAt, input.cycleEndsAt);
  const dayIndex = getCurrentCycleDayIndex(
    input.cycleStartsAt,
    input.cycleEndsAt,
    input.now,
  );
  return {
    dayIndex,
    sortOrder: nextSortOrderForDay(input.cards, dayIndex),
    exceedsCycleCapacity: dayIndex > capacity,
  };
}

/** 1-based card label within a cycle day (Card 1, Card 2, …). */
export function formatBuilderDayCardLabel(
  dayIndex: number,
  sortOrder: number,
): string {
  return `Day ${dayIndex} — Card ${sortOrder + 1}`;
}

export function cardOrdinalWithinDay(
  card: Pick<CycleCardSchedulingRow, "dayIndex" | "sortOrder">,
  cardsOnDay: Pick<CycleCardSchedulingRow, "sortOrder">[],
): number {
  const sorted = [...cardsOnDay].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const index = sorted.findIndex(
    (row) => (row.sortOrder ?? 0) === (card.sortOrder ?? 0),
  );
  return index >= 0 ? index + 1 : (card.sortOrder ?? 0) + 1;
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
  _allCards: CycleCardSchedulingRow[],
): string | null {
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
  const sorted = sortMarketPulseBuilderCards(cards);
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

export const CARD_SORT_ORDER_SWAP_TEMP_OFFSET = 1_000_000;

export function temporarySortOrderForSwap(sortOrder: number): number {
  return CARD_SORT_ORDER_SWAP_TEMP_OFFSET + sortOrder;
}

/** @deprecated Used when swapping cards across different cycle days. */
export const CARD_DAY_INDEX_SWAP_TEMP_OFFSET = 1_000_000;

export function temporaryDayIndexForSwap(dayIndex: number): number {
  return CARD_DAY_INDEX_SWAP_TEMP_OFFSET + dayIndex;
}
