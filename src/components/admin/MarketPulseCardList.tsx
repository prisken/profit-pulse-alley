"use client";

import { useMemo, useState } from "react";

import type {
  MarketPulseAdminCardRow,
  MarketPulseAdminCycleRow,
} from "@/lib/market-pulse/admin-data";
import {
  DEFAULT_ADMIN_CARD_FILTERS,
  filterAdminCards,
  type AdminCardFilterState,
} from "@/lib/market-pulse/admin-card-filter";
import { isRevealWithinPpaWarningWindow } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import MarketPulseCardFilters from "@/components/admin/MarketPulseCardFilters";
import {
  CreateCardSection,
  MarketPulseCardPanel,
} from "@/components/admin/MarketPulseCardPanel";
import { useTranslations } from "@/components/providers/LocaleProvider";

type Props = {
  cycles: MarketPulseAdminCycleRow[];
  cards: MarketPulseAdminCardRow[];
  selectedCycleId: string;
  disabled: boolean;
  createCardOpen: boolean;
  onCreateCardOpenChange: (open: boolean) => void;
  onRefresh: () => void;
};

function dayIndexesForCycle(
  cards: MarketPulseAdminCardRow[],
  cycleId: string,
): number[] {
  return cards
    .filter((card) => card.cycleId === cycleId)
    .map((card) => card.dayIndex)
    .sort((a, b) => a - b);
}

export default function MarketPulseCardList({
  cycles,
  cards,
  selectedCycleId,
  disabled,
  createCardOpen,
  onCreateCardOpenChange,
  onRefresh,
}: Readonly<Props>) {
  const { t } = useTranslations();
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;

  const [filters, setFilters] = useState<AdminCardFilterState>(() => ({
    ...DEFAULT_ADMIN_CARD_FILTERS,
    cycleId: selectedCycleId,
  }));

  const scopedCards = useMemo(() => {
    const base =
      filters.cycleId === "ALL"
        ? cards
        : cards.filter((card) => card.cycleId === filters.cycleId);
    return [...base].sort((a, b) => {
      if (a.cycleId !== b.cycleId) {
        return a.cycleId.localeCompare(b.cycleId);
      }
      return a.dayIndex - b.dayIndex;
    });
  }, [cards, filters.cycleId]);

  const filteredCards = useMemo(
    () => filterAdminCards(scopedCards, filters),
    [scopedCards, filters],
  );

  const cycleNameById = useMemo(
    () => new Map(cycles.map((cycle) => [cycle.id, cycle.name])),
    [cycles],
  );

  const revealUrgentByCycleId = useMemo(() => {
    const now = new Date();
    return new Map(
      cycles.map((cycle) => [
        cycle.id,
        cycle.status !== "REVEALED" &&
          isRevealWithinPpaWarningWindow(cycle.revealAt, now),
      ]),
    );
  }, [cycles]);

  if (!selectedCycle) {
    return (
      <p className="text-sm text-zinc-400">{t("auth.admin.mp.noCycles")}</p>
    );
  }

  const createCycleId =
    filters.cycleId === "ALL" ? selectedCycle.id : filters.cycleId;
  const createCycleName =
    cycleNameById.get(createCycleId) ?? selectedCycle.name;
  const createDayIndexes = dayIndexesForCycle(cards, createCycleId);

  return (
    <div className="space-y-4">
      <CreateCardSection
        cycleId={createCycleId}
        cycleName={createCycleName}
        nextDayIndex={(createDayIndexes.at(-1) ?? 0) + 1}
        existingDayIndexes={createDayIndexes}
        disabled={disabled}
        open={createCardOpen}
        onOpenChange={onCreateCardOpenChange}
        onRefresh={onRefresh}
      />

      <MarketPulseCardFilters
        cycles={cycles}
        filters={filters}
        onChange={setFilters}
        disabled={disabled}
        resultCount={filteredCards.length}
        totalCount={scopedCards.length}
      />

      {filteredCards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
          {scopedCards.length === 0
            ? t("auth.admin.mp.noCards")
            : t("auth.admin.mp.cards.noFilterResults")}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={t("auth.admin.mp.cards.listAria")}>
          {filteredCards.map((card) => (
            <li key={card.id}>
              <MarketPulseCardPanel
                card={card}
                cycleName={cycleNameById.get(card.cycleId)}
                existingDayIndexes={dayIndexesForCycle(cards, card.cycleId)}
                disabled={disabled}
                revealUrgent={revealUrgentByCycleId.get(card.cycleId) ?? false}
                onRefresh={onRefresh}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
