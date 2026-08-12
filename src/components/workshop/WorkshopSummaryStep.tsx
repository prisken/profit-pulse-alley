"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { SiteLocale } from "@/lib/i18n/locales";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import { runGoalStressTest } from "@/lib/workshop/macro-simulation";
import { generateActionGoalsAction } from "@/lib/workshop/pyramid-actions";
import type { PyramidBenchmarkSnapshot } from "@/lib/workshop/pyramid-benchmarks";
import type {
  ActionGoal,
  CrisisState,
  CrisisStressTestSummary,
  ExpensesState,
  PyramidState,
  StressTestResult,
  SummaryRatingLabelKey,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";

const RATING_LABEL_KEYS: Record<SummaryRatingLabelKey, MessageKey> = {
  needsAttention: "workshop.summary.ratingLabels.needsAttention",
  goodRoomToGrow: "workshop.summary.ratingLabels.goodRoomToGrow",
  strongFoundation: "workshop.summary.ratingLabels.strongFoundation",
};

const ACTION_GOAL_CATEGORY_KEYS: Record<ActionGoal["category"], MessageKey> = {
  protection: "workshop.summary.categories.protection",
  savings: "workshop.summary.categories.savings",
  investment: "workshop.summary.categories.investment",
  goal: "workshop.summary.categories.goal",
};

const ACTION_GOAL_LEVER_KEYS: Record<ActionGoal["leverType"], MessageKey> = {
  instant: "workshop.summary.levers.instant",
  structural: "workshop.summary.levers.structural",
  behavioral: "workshop.summary.levers.behavioral",
};

const BREAKDOWN_ROWS: Array<{
  key: keyof SummaryState["rating"]["breakdown"];
  labelKey: MessageKey;
}> = [
  {
    key: "protection",
    labelKey: "workshop.summary.breakdownLabels.protection",
  },
  {
    key: "emergencyFund",
    labelKey: "workshop.summary.breakdownLabels.emergencyFund",
  },
  {
    key: "goalsOnTrack",
    labelKey: "workshop.summary.breakdownLabels.goalsOnTrack",
  },
  {
    key: "crisisResilience",
    labelKey: "workshop.summary.breakdownLabels.crisisResilience",
  },
];

function scoreBand(score: number): "red" | "amber" | "green" {
  if (score <= 40) {
    return "red";
  }
  if (score <= 70) {
    return "amber";
  }
  return "green";
}

const BAND_STROKE = {
  red: "#f43f5e",
  amber: "#fbbf24",
  green: "#10b981",
} as const;

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

function RunwayHero({
  runway,
  t,
}: {
  runway: NonNullable<SummaryState["runway"]>;
  t: (key: MessageKey) => string;
}) {
  const { beforeAge, afterAge } = runway;
  const beforeLabel =
    beforeAge == null
      ? t("workshop.summary.runway.past90")
      : t("workshop.summary.runway.age").replace("{age}", String(beforeAge));
  const afterLabel =
    afterAge == null
      ? t("workshop.summary.runway.past90")
      : t("workshop.summary.runway.age").replace("{age}", String(afterAge));

  const improved = afterAge == null || (beforeAge != null && afterAge > beforeAge);
  const same = beforeAge === afterAge;

  let headline: string;
  if (same) {
    headline = t("workshop.summary.runway.same").replace(
      "{after}",
      afterLabel,
    );
  } else if (improved) {
    headline = t("workshop.summary.runway.improved")
      .replace("{after}", afterLabel)
      .replace("{before}", beforeLabel);
  } else {
    headline = t("workshop.summary.runway.shorter")
      .replace("{after}", afterLabel)
      .replace("{before}", beforeLabel);
  }

  return (
    <div
      className={[
        "mt-5 rounded-xl border px-4 py-3.5 text-left",
        improved
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
      ].join(" ")}
      data-testid="workshop-summary-runway"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {t("workshop.summary.runway.heading")}
      </p>
      <p className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">
        {headline}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {t("workshop.summary.runway.detail")}
      </p>
    </div>
  );
}

function RatingGauge({ score, label }: { score: number; label: string }) {
  const band = scoreBand(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const capped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - capped / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40 sm:h-44 sm:w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={BAND_STROKE[band]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-5xl font-semibold tabular-nums text-slate-900">
            {Math.round(score)}
          </p>
          <p className="font-mono text-sm text-slate-400">/100</p>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-slate-800">
        {label}
      </p>
    </div>
  );
}

const SCENARIO_LABEL_KEYS: Record<
  CrisisStressTestSummary["scenario"],
  MessageKey
> = {
  medical: "workshop.summary.crisisStress.scenario.medical",
  critical_illness: "workshop.summary.crisisStress.scenario.critical_illness",
  job_loss: "workshop.summary.crisisStress.scenario.job_loss",
  market_crash: "workshop.summary.crisisStress.scenario.market_crash",
  accident: "workshop.summary.crisisStress.scenario.accident",
};

const VERDICT_LABEL_KEYS: Record<
  CrisisStressTestSummary["verdict"],
  MessageKey
> = {
  SHIELDED: "workshop.summary.crisisStress.verdict.SHIELDED",
  PARTIAL: "workshop.summary.crisisStress.verdict.PARTIAL",
  PENETRATED: "workshop.summary.crisisStress.verdict.PENETRATED",
};

function CrisisStressTestBadge({
  stress,
  locale,
  t,
}: {
  stress: CrisisStressTestSummary;
  locale: SiteLocale;
  t: (key: MessageKey) => string;
}) {
  const scenario = t(SCENARIO_LABEL_KEYS[stress.scenario]);
  const goalName = stress.affectedGoalLabel
    ? pickBilingual(stress.affectedGoalLabel, locale)
    : null;
  const shielded = formatCompactHkd(stress.shieldedAmount);
  const penetration = formatCompactHkd(stress.penetrationAmount);
  const wiped = formatCompactHkd(
    Math.max(stress.penetrationAmount, stress.oneTimeCostHKD - stress.shieldedAmount),
  );

  let body: string;
  if (stress.verdict === "SHIELDED") {
    body = goalName
      ? t("workshop.summary.crisisStress.shieldedWithGoal")
          .replace("{scenario}", scenario)
          .replace("{amount}", shielded)
          .replace("{goal}", goalName)
      : t("workshop.summary.crisisStress.shieldedNoGoal")
          .replace("{scenario}", scenario)
          .replace("{amount}", shielded);
  } else if (stress.verdict === "PARTIAL") {
    body = goalName
      ? t("workshop.summary.crisisStress.partialWithGoal")
          .replace("{scenario}", scenario)
          .replace("{shielded}", shielded)
          .replace("{penetration}", penetration)
          .replace("{goal}", goalName)
      : t("workshop.summary.crisisStress.partialNoGoal")
          .replace("{scenario}", scenario)
          .replace("{shielded}", shielded)
          .replace("{penetration}", penetration);
  } else if (goalName && stress.delayYears != null && stress.delayYears > 0) {
    body = t("workshop.summary.crisisStress.penetratedWithGoal")
      .replace("{scenario}", scenario)
      .replace("{amount}", wiped)
      .replace("{goal}", goalName)
      .replace("{years}", String(stress.delayYears));
  } else {
    body = t("workshop.summary.crisisStress.penetratedNoGoal")
      .replace("{scenario}", scenario)
      .replace("{amount}", wiped);
  }

  const band =
    stress.verdict === "SHIELDED"
      ? "green"
      : stress.verdict === "PARTIAL"
        ? "amber"
        : "red";

  return (
    <div
      className={[
        "mt-5 rounded-xl border px-4 py-3 text-left",
        band === "green"
          ? "border-emerald-200 bg-emerald-50"
          : band === "amber"
            ? "border-amber-200 bg-amber-50"
            : "border-rose-200 bg-rose-50",
      ].join(" ")}
      data-verdict={stress.verdict}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("workshop.summary.crisisStress.heading")}
        </p>
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
            band === "green"
              ? "bg-emerald-100 text-emerald-800"
              : band === "amber"
                ? "bg-amber-100 text-amber-900"
                : "bg-rose-100 text-rose-800",
          ].join(" ")}
        >
          {t(VERDICT_LABEL_KEYS[stress.verdict])}
        </span>
      </div>
      <p
        className={[
          "mt-2 text-sm leading-relaxed",
          band === "green"
            ? "text-emerald-900"
            : band === "amber"
              ? "text-amber-950"
              : "text-rose-950",
        ].join(" ")}
      >
        {body}
      </p>
    </div>
  );
}

type WorkshopSummaryStepProps = Readonly<{
  sessionId: string;
  age: number;
  industry: string;
  monthlyIncome: number;
  expenses: ExpensesState;
  pyramid: PyramidState;
  benchmarks: PyramidBenchmarkSnapshot;
  crisis: CrisisState | null;
  tone: WorkshopTone;
  /** Prefer wizard-cached stress test when available. */
  stressTest?: StressTestResult | null;
  /** When returning from capture, reuse an already-generated summary. */
  initialSummary?: SummaryState | null;
  onBack: () => void;
  onContinue: (selectedGoal: ActionGoal) => void;
  onSummaryReady?: (summary: SummaryState) => void;
}>;

export default function WorkshopSummaryStep({
  sessionId,
  age,
  industry,
  monthlyIncome,
  expenses,
  pyramid,
  benchmarks,
  crisis,
  tone,
  stressTest: stressTestProp,
  initialSummary = null,
  onBack,
  onContinue,
  onSummaryReady,
}: WorkshopSummaryStepProps) {
  const { t, locale } = useTranslations();
  const [summary, setSummary] = useState<SummaryState | null>(initialSummary);
  const [selectedRank, setSelectedRank] = useState<number | null>(
    initialSummary?.actionGoals[0]?.rank ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialSummary);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (initialSummary && retryToken === 0) {
      setSummary(initialSummary);
      setSelectedRank(initialSummary.actionGoals[0]?.rank ?? null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      setLoading(true);
      setError(null);
      setSummary(null);
      setSelectedRank(null);

      try {
        const stressTest =
          stressTestProp ??
          runGoalStressTest({
            age,
            industry,
            monthlyIncome,
            expenses,
            pyramid,
            horizonYears: 30,
          });
        const result = await generateActionGoalsAction(sessionId, {
          tone,
          pyramid,
          benchmarks: {
            medicalCoveragePercent: benchmarks.medicalCoveragePercent,
            criticalIllnessAmountHKD: benchmarks.criticalIllnessAmountHKD,
            emergencyFundTargetMonths: benchmarks.emergencyFundTargetMonths,
            emergencyFundTargetHKD: benchmarks.emergencyFundTargetHKD,
          },
          stressTest,
          expenses,
          monthlyIncome,
          crisis: crisis ?? null,
          age,
          industry,
        });
        if (cancelled) {
          return;
        }
        setSummary(result);
        setSelectedRank(result.actionGoals[0]?.rank ?? null);
        onSummaryReady?.(result);
        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : t("workshop.summary.errorFallback"),
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
    expenses,
    pyramid,
    benchmarks,
    crisis,
    tone,
    stressTestProp,
    initialSummary,
    retryToken,
  ]);

  const selectedGoal = useMemo(() => {
    if (!summary || selectedRank == null) {
      return null;
    }
    return (
      summary.actionGoals.find((goal) => goal.rank === selectedRank) ?? null
    );
  }, [summary, selectedRank]);

  if (error) {
    return (
      <WorkshopRetryPanel
        title={t("workshop.summary.errorTitle")}
        message={error}
        onRetry={() => setRetryToken((n) => n + 1)}
        onBack={onBack}
      />
    );
  }

  if (loading || !summary) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-800">
          {t("workshop.summary.scoring")}
        </p>
      </div>
    );
  }

  const { rating, actionGoals, crisisStressTest, runway } = summary;
  const ratingLabel = t(RATING_LABEL_KEYS[rating.labelKey]);

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {t("workshop.summary.ratingHeading")}
        </p>
        <div className="mt-4">
          <RatingGauge score={rating.score} label={ratingLabel} />
        </div>
        {runway ? <RunwayHero runway={runway} t={t} /> : null}
        {crisisStressTest ? (
          <CrisisStressTestBadge
            stress={crisisStressTest}
            locale={locale}
            t={t}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("workshop.summary.breakdownHeading")}
        </h3>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-4 shadow-sm sm:px-4">
          {BREAKDOWN_ROWS.map((row) => {
            const value = rating.breakdown[row.key];
            const band = scoreBand(value);
            return (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700">{t(row.labelKey)}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {value}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={[
                      "h-full rounded-full transition-[width] duration-500",
                      band === "green"
                        ? "bg-emerald-500"
                        : band === "amber"
                          ? "bg-amber-400"
                          : "bg-rose-500",
                    ].join(" ")}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("workshop.summary.selectGoalPrompt")}
        </h3>
        <div
          className="space-y-3"
          role="radiogroup"
          aria-label={t("workshop.summary.actionGoalsAria")}
        >
          {actionGoals.map((goal) => {
            const selected = selectedRank === goal.rank;
            return (
              <div
                key={goal.rank}
                role="radio"
                tabIndex={0}
                aria-checked={selected}
                onClick={() => setSelectedRank(goal.rank)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedRank(goal.rank);
                  }
                }}
                className={[
                  "w-full cursor-pointer touch-manipulation rounded-2xl text-left transition-shadow",
                  selected
                    ? "ring-2 ring-emerald-500/60 ring-offset-2 ring-offset-slate-50"
                    : "ring-0",
                ].join(" ")}
              >
                <CollapsibleWidget
                  defaultExpanded={goal.rank === 1 || selected}
                  icon={
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                      {createElement(resolveIcon(goal.icon), {
                        className: "h-5 w-5",
                        strokeWidth: 2,
                      })}
                    </span>
                  }
                  title={
                    <span className="text-sm font-semibold text-slate-900">
                      {pickBilingual(goal.title, locale)}
                    </span>
                  }
                  badge={
                    <div className="flex max-w-[12rem] flex-col items-end gap-1 sm:max-w-none sm:flex-row sm:items-center">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        {t(ACTION_GOAL_LEVER_KEYS[goal.leverType])}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {t("workshop.summary.impactPointsLabel").replace(
                          "{n}",
                          String(goal.impactPoints),
                        )}
                      </span>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("workshop.summary.focusRank")
                        .replace("{rank}", String(goal.rank))
                        .replace(
                          "{category}",
                          t(ACTION_GOAL_CATEGORY_KEYS[goal.category]),
                        )}
                    </p>
                    <p className="text-pretty text-sm leading-relaxed text-slate-600">
                      {pickBilingual(goal.reasoning, locale)}
                    </p>
                  </div>
                </CollapsibleWidget>
              </div>
            );
          })}
        </div>
      </section>

      <WorkshopStickyFooter
        primaryLabel={t("workshop.summary.getBlueprintButton")}
        primaryDisabled={!selectedGoal}
        onPrimaryClick={() => {
          if (selectedGoal) {
            onContinue(selectedGoal);
          }
        }}
        secondaryLabel={t("workshop.errors.backButton")}
        onSecondaryClick={onBack}
      />
    </div>
  );
}
