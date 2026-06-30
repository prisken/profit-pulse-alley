"use client";

import Link from "next/link";
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
import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-mp-navigation";
import { isRevealWithinPpaWarningWindow } from "@/lib/market-pulse/admin-ppa-reveal-warning";
import MarketPulseCardFilters from "@/components/admin/MarketPulseCardFilters";
import {
  CreateCardSection,
  MarketPulseCardPanel,
} from "@/components/admin/MarketPulseCardPanel";
import { useTranslations } from "@/components/providers/LocaleProvider";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const primaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 ${focusRing}`;

type Props = {
  cycles: MarketPulseAdminCycleRow[];
  cards: MarketPulseAdminCardRow[];
  selectedCycleId: string;
  disabled: boolean;
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
  onRefresh,
}: Readonly<Props>) {
  const { t } = useTranslations();
  const [legacyCreateOpen, setLegacyCreateOpen] = useState(false);
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
  const builderHref = marketPulseCycleBuilderPath(selectedCycle.id);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
        <p className="text-sm font-medium text-amber-100">
          {t("auth.admin.mp.nav.legacyCardsBanner")}
        </p>
        <p className="mt-1 text-sm text-amber-100/80">
          {t("auth.admin.mp.nav.legacyCardsBannerBody")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={builderHref} className={primaryButtonClass}>
            {t("auth.admin.mp.openBuilder")}
          </Link>
        </div>
      </div>

      <details className="rounded-lg border border-zinc-800 bg-zinc-950/40">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-300 marker:content-none [&::-webkit-details-marker]:hidden">
          {t("auth.admin.mp.nav.legacyCreateCard")}
        </summary>
        <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
          <CreateCardSection
            cycleId={createCycleId}
            cycleName={createCycleName}
            nextDayIndex={(createDayIndexes.at(-1) ?? 0) + 1}
            existingDayIndexes={createDayIndexes}
            disabled={disabled}
            open={legacyCreateOpen}
            onOpenChange={setLegacyCreateOpen}
            builderHref={builderHref}
            onRefresh={onRefresh}
          />
        </div>
      </details>

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
                builderHref={marketPulseCycleBuilderPath(card.cycleId)}
                onRefresh={onRefresh}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
