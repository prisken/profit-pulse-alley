"use client";

import { useMemo, useState } from "react";

import WorkshopRetirementFinaleCharts from "@/components/workshop/WorkshopRetirementFinaleCharts";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import type { SiteLocale } from "@/lib/i18n/locales";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import {
  deriveGoalJourneyDecisionRecap,
  type GoalJourneyRailChip,
} from "@/lib/workshop/goal-journey";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  ExpensesState,
  GoalItem,
  GoalJourneyState,
  PyramidState,
} from "@/lib/workshop/types";

const CHIP_PILL: Record<GoalJourneyRailChip, string> = {
  on_track: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delayed: "border-amber-200 bg-amber-50 text-amber-800",
  given_up: "border-slate-200 bg-slate-50 text-slate-600",
};

type WorkshopGoalJourneyFinaleCardProps = Readonly<{
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey: GoalJourneyState;
  railItems: GoalItem[];
  timeline: TimelineResult | null;
}>;

/**
 * Retirement rail interior: dual line charts + scrubber, then a compact
 * decision recap. No Apply / Give up — summary only.
 *
 * Scrub age is keyed to the timeline's retirement age so a plan change remounts
 * with the correct default without syncing via an effect.
 */
export default function WorkshopGoalJourneyFinaleCard({
  pyramid,
  expenses,
  journey,
  railItems,
  timeline,
}: WorkshopGoalJourneyFinaleCardProps) {
  const { t, locale } = useTranslations();
  const defaultScrub =
    timeline?.retirement.retirementAge ??
    timeline?.rows[0]?.age ??
    65;

  const recap = useMemo(
    () =>
      deriveGoalJourneyDecisionRecap({
        railItems,
        journey,
        timeline,
        expenses,
        monthlyFunHKD: pyramid.investment.monthlyFunHKD,
      }),
    [railItems, journey, timeline, expenses, pyramid.investment.monthlyFunHKD],
  );

  if (!timeline || timeline.rows.length === 0) {
    return (
      <p
        className="text-sm text-slate-500"
        data-testid="workshop-journey-finale-card"
      >
        {t("workshop.journey.finaleTimelineMissing")}
      </p>
    );
  }

  return (
    <FinaleChartsAndRecap
      key={defaultScrub}
      timeline={timeline}
      pyramid={pyramid}
      defaultScrub={defaultScrub}
      recap={recap}
      locale={locale}
      t={t}
    />
  );
}

function FinaleChartsAndRecap({
  timeline,
  pyramid,
  defaultScrub,
  recap,
  locale,
  t,
}: {
  timeline: TimelineResult;
  pyramid: PyramidState;
  defaultScrub: number;
  recap: ReturnType<typeof deriveGoalJourneyDecisionRecap>;
  locale: SiteLocale;
  t: (key: MessageKey) => string;
}) {
  const [scrubAge, setScrubAge] = useState(defaultScrub);

  return (
    <div className="min-w-0 space-y-4" data-testid="workshop-journey-finale-card">
      <WorkshopRetirementFinaleCharts
        timeline={timeline}
        pyramid={pyramid}
        scrubAge={scrubAge}
        onScrubAgeChange={setScrubAge}
      />

      <section
        className="min-w-0 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3"
        data-testid="workshop-journey-decision-recap"
      >
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("workshop.journey.finaleRecapHeading")}
        </h4>
        <p className="text-sm font-medium leading-snug text-slate-800">
          {t("workshop.journey.finaleRecapSummary")
            .replace("{onTime}", String(recap.onTimeCount))
            .replace("{delayed}", String(recap.delayedCount))
            .replace("{givenUp}", String(recap.givenUpCount))}
        </p>

        {recap.chips.length > 0 ? (
          <ul className="flex min-w-0 flex-wrap gap-1.5">
            {recap.chips.map((row) => (
              <li key={row.goalId}>
                <span
                  className={[
                    "inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    CHIP_PILL[row.chip],
                  ].join(" ")}
                >
                  <span className="truncate">
                    {pickBilingual(row.label, locale)}
                  </span>
                  <span aria-hidden>
                    {row.chip === "on_track"
                      ? "✓"
                      : row.chip === "delayed"
                        ? "⏱"
                        : "✕"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {recap.monthlyPlan ? (
          <p
            className="text-xs leading-relaxed text-slate-600"
            data-testid="workshop-journey-monthly-plan"
          >
            {t("workshop.journey.finaleMonthlyPlan")
              .replace(
                "{before}",
                formatCompactHkd(recap.monthlyPlan.beforeTotalHKD),
              )
              .replace(
                "{after}",
                formatCompactHkd(recap.monthlyPlan.afterTotalHKD),
              )}
          </p>
        ) : null}
      </section>
    </div>
  );
}
