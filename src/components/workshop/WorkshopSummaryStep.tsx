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
import { runGoalStressTest } from "@/lib/workshop/macro-simulation";
import { generateActionGoalsAction } from "@/lib/workshop/pyramid-actions";
import type { PyramidBenchmarkSnapshot } from "@/lib/workshop/pyramid-benchmarks";
import type {
  ActionGoal,
  CrisisState,
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
  red: "#f87171",
  amber: "#fbbf24",
  green: "#34d399",
} as const;

function RatingGauge({ score, label }: { score: number; label: string }) {
  const band = scoreBand(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const capped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - capped / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36 sm:h-40 sm:w-40">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <p className="font-mono text-3xl font-semibold tabular-nums text-white sm:text-4xl">
            {Math.round(score)}
            <span className="text-base text-zinc-500">/100</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-zinc-100">
        {label}
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
  crisis: CrisisState;
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
          crisis,
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
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-200">
          {t("workshop.summary.scoring")}
        </p>
      </div>
    );
  }

  const { rating, actionGoals } = summary;
  const ratingLabel = t(RATING_LABEL_KEYS[rating.labelKey]);

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-zinc-950/40 to-transparent px-4 py-6 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {t("workshop.summary.ratingHeading")}
        </p>
        <div className="mt-4">
          <RatingGauge score={rating.score} label={ratingLabel} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {t("workshop.summary.breakdownHeading")}
        </h3>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-4 sm:px-4">
          {BREAKDOWN_ROWS.map((row) => {
            const value = rating.breakdown[row.key];
            const band = scoreBand(value);
            return (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-300">{t(row.labelKey)}</span>
                  <span className="font-mono tabular-nums text-zinc-400">
                    {value}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={[
                      "h-full rounded-full transition-[width] duration-500",
                      band === "green"
                        ? "bg-emerald-400"
                        : band === "amber"
                          ? "bg-amber-400"
                          : "bg-red-400",
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
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
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
                    ? "ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-zinc-950"
                    : "ring-0",
                ].join(" ")}
              >
                <WorkshopStatCard
                  icon={goal.icon}
                  status={
                    goal.rank === 1
                      ? "red"
                      : goal.rank === 2
                        ? "amber"
                        : "green"
                  }
                  label={pickBilingual(goal.title, locale)}
                  value={t("workshop.summary.impactPointsLabel").replace(
                    "{n}",
                    String(goal.impactPoints),
                  )}
                  subtext={t("workshop.summary.focusRank")
                    .replace("{rank}", String(goal.rank))
                    .replace("{category}", t(ACTION_GOAL_CATEGORY_KEYS[goal.category]))}
                  expandableText={goal.reasoning}
                />
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
