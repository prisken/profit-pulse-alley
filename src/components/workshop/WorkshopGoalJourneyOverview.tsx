"use client";

import WorkshopAllocationDonut from "@/components/workshop/WorkshopAllocationDonut";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import { deriveJourneyOverview } from "@/lib/workshop/journey-overview";
import type { ExpensesState, PyramidState } from "@/lib/workshop/types";

type WorkshopGoalJourneyOverviewProps = Readonly<{
  monthlyIncomeHKD: number;
  expenses: ExpensesState;
  pyramid: PyramidState;
}>;

/**
 * Top-of-step overview: cash-flow + assets donuts from confirmed session state.
 * Line charts / scrubber live in WorkshopRetirementFinaleCharts (Prompt 7).
 */
export default function WorkshopGoalJourneyOverview({
  monthlyIncomeHKD,
  expenses,
  pyramid,
}: WorkshopGoalJourneyOverviewProps) {
  const { t } = useTranslations();
  const overview = deriveJourneyOverview({
    monthlyIncomeHKD,
    expenses,
    pyramid,
  });

  const cashTotal = overview.cashFlowSlices.reduce(
    (sum, slice) => sum + Math.max(0, slice.amountHKD),
    0,
  );
  const assetsTotal = overview.assetsSlices.reduce(
    (sum, slice) => sum + Math.max(0, slice.amountHKD),
    0,
  );

  return (
    <section className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <WorkshopAllocationDonut
            slices={overview.cashFlowSlices}
            size="large"
            centerLabel={t("workshop.stressTest.overviewCashFlow")}
            centerValue={formatCompactHkd(cashTotal)}
          />
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <WorkshopAllocationDonut
            slices={overview.assetsSlices}
            size="large"
            centerLabel={t("workshop.stressTest.overviewAssets")}
            centerValue={formatCompactHkd(assetsTotal)}
          />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        {t("workshop.stressTest.journeyIntro").replace(
          "{surplus}",
          formatCompactHkd(overview.monthlySurplusHKD),
        )}
      </p>
    </section>
  );
}
