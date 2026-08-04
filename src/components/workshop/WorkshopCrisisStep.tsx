"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import {
  applyCrisisImpactsToStressTest,
  runGoalStressTest,
} from "@/lib/workshop/macro-simulation";
import { generateCrisisAction } from "@/lib/workshop/pyramid-actions";
import type {
  CrisisImpact,
  CrisisState,
  ExpensesState,
  PyramidState,
  RiskProfile,
  StressTestResult,
  WorkshopTone,
} from "@/lib/workshop/types";

const RISK_PROFILE_LABEL_KEYS: Record<RiskProfile, MessageKey> = {
  conservative: "workshop.riskProfile.labels.conservative",
  balanced: "workshop.riskProfile.labels.balanced",
  aggressive: "workshop.riskProfile.labels.aggressive",
};

const LAYER_LABEL_KEYS: Record<CrisisImpact["layer"], MessageKey> = {
  protection: "workshop.pyramid.layers.protection.title",
  emergencyFund: "workshop.pyramid.layers.emergencyFund.title",
  investment: "workshop.pyramid.layers.investment.title",
  goals: "workshop.pyramid.layers.goals.title",
};

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

type WorkshopCrisisStepProps = Readonly<{
  sessionId: string;
  age: number;
  industry: string;
  monthlyIncome: number;
  householdStatus: string;
  expenses: ExpensesState;
  pyramid: PyramidState;
  tone: WorkshopTone;
  riskProfile: RiskProfile;
  /** Prefer wizard-cached stress test when available. */
  stressTest?: StressTestResult | null;
  onBack: () => void;
  onContinue: () => void;
  onResolved?: (payload: { crisis: CrisisState }) => void;
}>;

export default function WorkshopCrisisStep({
  sessionId,
  age,
  industry,
  monthlyIncome,
  householdStatus,
  expenses,
  pyramid,
  tone,
  riskProfile,
  stressTest: stressTestProp,
  onBack,
  onContinue,
  onResolved,
}: WorkshopCrisisStepProps) {
  const { t, locale } = useTranslations();
  const [crisis, setCrisis] = useState<CrisisState | null>(null);
  const [baseline, setBaseline] = useState<StressTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const profileLabel = t(RISK_PROFILE_LABEL_KEYS[riskProfile]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      setLoading(true);
      setError(null);
      setCrisis(null);
      setBaseline(null);

      try {
        const stress =
          stressTestProp ??
          runGoalStressTest({
            age,
            industry,
            monthlyIncome,
            expenses,
            pyramid,
            horizonYears: 30,
          });
        const generated = await generateCrisisAction(sessionId, {
          age,
          industry,
          householdStatus,
          monthlyIncome,
          riskProfile,
          tone,
        });
        if (cancelled) {
          return;
        }
        setBaseline(stress);
        setCrisis(generated);
        onResolved?.({ crisis: generated });
        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : t("workshop.crisis.errorFallback"),
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retry via token
  }, [
    sessionId,
    age,
    industry,
    monthlyIncome,
    householdStatus,
    expenses,
    pyramid,
    tone,
    riskProfile,
    stressTestProp,
    retryToken,
  ]);

  const underCrisis = useMemo(() => {
    if (!baseline || !crisis) {
      return null;
    }
    return applyCrisisImpactsToStressTest(baseline, crisis);
  }, [baseline, crisis]);

  const delayedGoals = useMemo(() => {
    if (!baseline || !underCrisis) {
      return [];
    }
    return baseline.goalProjections
      .map((before) => {
        const after = underCrisis.goalProjections.find(
          (g) => g.goalId === before.goalId,
        );
        if (!after) {
          return null;
        }
        const shifted =
          before.projectedYear !== after.projectedYear ||
          (before.projectedYear !== null && after.projectedYear === null);
        if (!shifted) {
          return null;
        }
        return {
          id: before.goalId,
          label: before.label,
          before: before.projectedYear,
          after: after.projectedYear,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [baseline, underCrisis]);

  function impactValue(impact: CrisisState["impacts"][number]): string {
    if (impact.detailHKD != null && impact.detailMonths != null) {
      return `${formatHkd(impact.detailHKD)} · ${impact.detailMonths} mo`;
    }
    if (impact.detailHKD != null) {
      return formatHkd(impact.detailHKD);
    }
    if (impact.detailMonths != null) {
      return t("workshop.crisis.durationMonths").replace(
        "{n}",
        String(impact.detailMonths),
      );
    }
    return t("workshop.crisis.impactFallback");
  }

  if (error) {
    return (
      <WorkshopRetryPanel
        title={t("workshop.crisis.errorTitle")}
        message={error}
        onRetry={() => setRetryToken((n) => n + 1)}
        onBack={onBack}
      />
    );
  }

  if (loading || !crisis) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-200">
          {t("workshop.crisis.loading").replace("{profile}", profileLabel)}
        </p>
        <p className="text-xs text-zinc-500">
          {t("workshop.crisis.loadingSubtext")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <article className="overflow-hidden rounded-2xl border border-red-400/35 bg-gradient-to-br from-red-500/20 via-zinc-950/80 to-transparent px-4 py-5 sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300/90">
          {t("workshop.crisis.badge").replace("{profile}", profileLabel)}
        </p>
        <h3 className="mt-2 text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {pickBilingual(crisis.title, locale)}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-200">
          {pickBilingual(crisis.description, locale)}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px] text-zinc-400 sm:gap-2 sm:text-[11px]">
          <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.incomeHit")}</dt>
            <dd className="mt-1 break-words font-mono text-xs text-red-200 sm:text-sm">
              −{crisis.monthlyIncomeImpactPercent}%
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.oneTime")}</dt>
            <dd className="mt-1 break-words font-mono text-xs text-red-200 sm:text-sm">
              {formatHkd(crisis.oneTimeCostHKD)}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.duration")}</dt>
            <dd className="mt-1 break-words font-mono text-xs text-red-200 sm:text-sm">
              {t("workshop.crisis.durationMonths").replace(
                "{n}",
                String(crisis.durationMonths),
              )}
            </dd>
          </div>
        </dl>
      </article>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {t("workshop.crisis.layerImpacts")}
        </h4>
        {crisis.impacts.map((impact, index) => (
          <WorkshopStatCard
            key={`${impact.layer}-${index}`}
            icon={impact.icon}
            status="red"
            label={pickBilingual(impact.headline, locale)}
            value={impactValue(impact)}
            subtext={t("workshop.crisis.hitsLayer").replace(
              "{layer}",
              t(LAYER_LABEL_KEYS[impact.layer]),
            )}
          />
        ))}
      </section>

      {delayedGoals.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-4 sm:px-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("workshop.crisis.goalsUnderCrisisHeading")}
          </h4>
          <ul className="mt-3 space-y-2.5">
            {delayedGoals.map((goal) => (
              <li
                key={goal.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-200">
                  {pickBilingual(goal.label, locale)}
                </span>
                <span className="shrink-0 font-mono text-xs text-zinc-400">
                  {goal.before ?? "—"} →{" "}
                  <span className="text-red-300">
                    {goal.after ?? t("workshop.crisis.arrowNotReached")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <WorkshopStickyFooter
        primaryLabel={t("workshop.crisis.continueButton")}
        onPrimaryClick={onContinue}
        secondaryLabel={t("workshop.errors.backButton")}
        onSecondaryClick={onBack}
      />
    </div>
  );
}
