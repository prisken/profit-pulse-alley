/** Shared ordering + day labels for playable, scored, and revealed cards. */

export type MarketPulseCardPlayOrder = {
  dayIndex: number;
  sortOrder?: number | null;
  createdAt?: Date | string | null;
  id?: string;
};

export function formatMarketPulseDayDisplayNumber(dayIndex: number): number {
  return dayIndex >= 1 ? dayIndex : dayIndex + 1;
}

export function compareMarketPulseCardsByPlayOrder(
  a: MarketPulseCardPlayOrder,
  b: MarketPulseCardPlayOrder,
): number {
  if (a.dayIndex !== b.dayIndex) {
    return a.dayIndex - b.dayIndex;
  }
  const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (sortDelta !== 0) {
    return sortDelta;
  }
  const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (createdA !== createdB) {
    return createdA - createdB;
  }
  return (a.id ?? "").localeCompare(b.id ?? "");
}

export function countCardsOnCycleDay(
  cards: Pick<MarketPulseCardPlayOrder, "dayIndex">[],
  dayIndex: number,
): number {
  return cards.filter((card) => card.dayIndex === dayIndex).length;
}

/** English day label; UI should translate via i18n keys when rendering. */
export function formatMarketPulseCardDayLabel(
  dayIndex: number,
  sortOrder: number,
  cardsOnDay: number,
): string {
  const day = formatMarketPulseDayDisplayNumber(dayIndex);
  if (cardsOnDay > 1) {
    return `Day ${day} · Card ${sortOrder + 1}`;
  }
  return `Day ${day}`;
}

export function buildMarketPulseCardDayLabelMap<
  T extends MarketPulseCardPlayOrder & { id?: string },
>(cards: T[]): Map<string, string> {
  const sorted = [...cards].sort(compareMarketPulseCardsByPlayOrder);
  const counts = buildCardsOnDayCountMap(sorted);

  const labels = new Map<string, string>();
  for (const card of sorted) {
    const key = card.id ?? `${card.dayIndex}-${card.sortOrder ?? 0}`;
    labels.set(
      key,
      formatMarketPulseCardDayLabel(
        card.dayIndex,
        card.sortOrder ?? 0,
        counts.get(card.dayIndex) ?? 1,
      ),
    );
  }
  return labels;
}

export function buildCardsOnDayCountMap(
  cards: Pick<MarketPulseCardPlayOrder, "dayIndex">[],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const card of cards) {
    counts.set(card.dayIndex, (counts.get(card.dayIndex) ?? 0) + 1);
  }
  return counts;
}

export function formatMarketPulseCardDayLabelLocalized(
  dayIndex: number,
  sortOrder: number,
  cardsOnDay: number,
  labels: {
    single: (day: number) => string;
    multi: (day: number, cardNumber: number) => string;
  },
): string {
  const day = formatMarketPulseDayDisplayNumber(dayIndex);
  if (cardsOnDay > 1) {
    return labels.multi(day, sortOrder + 1);
  }
  return labels.single(day);
}
