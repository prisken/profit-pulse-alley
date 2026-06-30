"use client";

import { useMemo } from "react";

import type { MarketPulseAdminCardRow, MarketPulseAdminCycleRow } from "@/lib/market-pulse/admin-data";
import {
  deriveCycleCardCreationDefaults,
  formatCycleCardCategoryLabel,
  type CycleCardReference,
} from "@/lib/market-pulse/cycle-card-defaults";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith } from "@/lib/i18n/messages";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Props = {
  cycle: MarketPulseAdminCycleRow;
  cards: MarketPulseAdminCardRow[];
  promptOverride: string;
  onPromptOverrideChange: (value: string) => void;
  onSelectReferenceCard?: (cardId: string) => void;
};

export default function MarketPulseCycleCardDefaultsPanel({
  cycle,
  cards,
  promptOverride,
  onPromptOverrideChange,
  onSelectReferenceCard,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();

  const references: CycleCardReference[] = useMemo(
    () =>
      cards.map((card) => ({
        id: card.id,
        dayIndex: card.dayIndex,
        sourceDate: card.sourceDate,
        userPrompt: card.userPrompt,
        exchange: card.exchange,
        sourceName: card.sourceName,
        sourceUrl: card.sourceUrl,
        headline: card.headline,
        companyName: card.companyName,
        ticker: card.ticker,
      })),
    [cards],
  );

  const defaults = useMemo(
    () =>
      deriveCycleCardCreationDefaults({
        cycle: {
          startsAt: cycle.startsAt,
          endsAt: cycle.endsAt,
          revealAt: cycle.revealAt,
          prizeLabel: cycle.prizeLabel,
        },
        cards: references,
      }),
    [cycle.startsAt, cycle.endsAt, cycle.revealAt, cycle.prizeLabel, references],
  );

  const categoryLabel = formatCycleCardCategoryLabel(
    defaults.exchange,
    defaults.sourceName,
  );
  const promptValue = promptOverride || defaults.userPrompt;

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {t("auth.admin.mp.builder.defaults.title")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {t("auth.admin.mp.builder.defaults.help")}
          </p>
        </div>
        {defaults.referenceCardId && onSelectReferenceCard ? (
          <button
            type="button"
            className="text-xs font-medium text-emerald-400 underline-offset-4 hover:underline"
            onClick={() => onSelectReferenceCard(defaults.referenceCardId!)}
          >
            {translateWith(locale, "auth.admin.mp.builder.defaults.viewSourceCard", {
              day: defaults.referenceDayIndex ?? defaults.dayIndex,
            })}
          </button>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.defaults.prompt")}
          </dt>
          <dd className="mt-1">
            <input
              type="text"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              value={promptValue}
              onChange={(event) => onPromptOverrideChange(event.target.value)}
              aria-label={t("auth.admin.mp.builder.defaults.prompt")}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.defaults.category")}
          </dt>
          <dd className="mt-1 text-zinc-300">{categoryLabel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.defaults.nextDay")}
          </dt>
          <dd className="mt-1 text-zinc-300">
            {translateWith(locale, "auth.admin.mp.cards.dayLabel", {
              day: defaults.dayIndex,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.defaults.nextDate")}
          </dt>
          <dd className="mt-1 text-zinc-300">
            {formatDateTime(defaults.sourceDate.toISOString())}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.builder.defaults.revealTiming")}
          </dt>
          <dd className="mt-1 text-zinc-300">{formatDateTime(defaults.cycleRevealAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("auth.admin.mp.statPrize")}
          </dt>
          <dd className="mt-1 text-zinc-300">{defaults.prizeLabel ?? "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-zinc-500">
        {translateWith(locale, "auth.admin.mp.builder.defaults.uniquePlaceholder", {
          headline: "Untitled signal",
        })}
      </p>
    </div>
  );
}
