"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  narrateStressTestAction,
  runGoalStressTestAction,
} from "@/lib/workshop/pyramid-actions";
import type {
  Bilingual,
  ExpensesState,
  PyramidState,
  StressTestNote,
  StressTestResult,
  WorkshopTone,
} from "@/lib/workshop/types";
import { pickBilingual } from "@/lib/workshop/bilingual";

const NARRATIVE_FADE_DELAY_MS = 800;
const DEFAULT_HORIZON_YEARS = 30;

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function noteMap(notes: StressTestNote[]): Map<string, Bilingual> {
  return new Map(notes.map((n) => [n.id, n.note]));
}

type WorkshopStressTestStepProps = Readonly<{
  sessionId: string;
  age: number;
  industry: string;
  monthlyIncome: number;
  expenses: ExpensesState;
  pyramid: PyramidState;
  tone: WorkshopTone;
  onBack: () => void;
  onContinue: (result: StressTestResult) => void;
}>;

export default function WorkshopStressTestStep({
  sessionId,
  age,
  industry,
  monthlyIncome,
  expenses,
  pyramid,
  tone,
  onBack,
  onContinue,
}: WorkshopStressTestStepProps) {
  const { t, locale } = useTranslations();
  const nowYear = useMemo(() => new Date().getFullYear(), []);
  const maxYear = nowYear + DEFAULT_HORIZON_YEARS;

  const [result, setResult] = useState<StressTestResult | null>(null);
  const [notes, setNotes] = useState<StressTestNote[]>([]);
  const [notesVisible, setNotesVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [scrubYear, setScrubYear] = useState(nowYear);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      setIsRunning(true);
      setIsNarrating(false);
      setNotesVisible(false);
      setNotes([]);
      setError(null);
      setResult(null);
      setScrubYear(nowYear);

      try {
        const stress = await runGoalStressTestAction({
          age,
          industry,
          monthlyIncome,
          expenses,
          pyramid,
          horizonYears: DEFAULT_HORIZON_YEARS,
        });
        if (cancelled) {
          return;
        }
        setResult(stress);
        setIsRunning(false);
        setIsNarrating(true);

        const narrateStarted = Date.now();
        const narrated = await narrateStressTestAction(sessionId, stress, {
          tone,
          age,
          industry,
          monthlyIncome,
          expenses,
        });
        if (cancelled) {
          return;
        }
        setNotes(narrated.notes);

        const wait = Math.max(
          0,
          NARRATIVE_FADE_DELAY_MS - (Date.now() - narrateStarted),
        );
        fadeTimer = setTimeout(() => {
          if (!cancelled) {
            setNotesVisible(true);
            setIsNarrating(false);
          }
        }, wait);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : t("workshop.stressTest.errorFallback"),
        );
        setIsRunning(false);
        setIsNarrating(false);
      }
    })();

    return () => {
      cancelled = true;
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
    };
  }, [
    sessionId,
    age,
    industry,
    monthlyIncome,
    expenses,
    pyramid,
    tone,
    nowYear,
    retryToken,
    t,
  ]);

  const notesById = useMemo(() => noteMap(notes), [notes]);

  const surplusAtScrub = useMemo(() => {
    if (!result) {
      return null;
    }
    const simYear = scrubYear - nowYear;
    if (simYear <= 0) {
      return null;
    }
    return (
      result.monthlySurplusByYear.find((row) => row.year === simYear) ?? null
    );
  }, [result, scrubYear, nowYear]);

  if (error) {
    return (
      <WorkshopRetryPanel
        title={t("workshop.stressTest.errorTitle")}
        message={error}
        onRetry={() => setRetryToken((n) => n + 1)}
        onBack={onBack}
      />
    );
  }

  if (isRunning || !result) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-200">
          {t("workshop.stressTest.running")}
        </p>
        <p className="text-xs text-zinc-500">
          {t("workshop.stressTest.runningSubtext")}
        </p>
      </div>
    );
  }

  const ef = result.emergencyFundProjection;
  const efNote =
    notesVisible && ef.status !== "green"
      ? notesById.get("emergencyFund")
      : undefined;

  const efProjectedText =
    ef.projectedMonths <= 0
      ? t("workshop.stressTest.efAlreadyFunded")
      : ef.status === "red" &&
          ef.projectedMonths >= DEFAULT_HORIZON_YEARS * 12
        ? t("workshop.stressTest.notReachedLabel")
        : t("workshop.stressTest.efFundedIn").replace(
            "{months}",
            String(ef.projectedMonths),
          );

  return (
    <div className="min-w-0 touch-pan-y space-y-6 sm:space-y-7">
      <p className="text-sm leading-relaxed text-zinc-400">
        {t("workshop.stressTest.intro")}
      </p>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/40 px-3.5 py-4 touch-pan-y sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {t("workshop.stressTest.scrubberLabel")}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">
              {scrubYear}
            </p>
          </div>
          {surplusAtScrub ? (
            <div className="grid grid-cols-3 gap-2 text-left text-[11px] text-zinc-400 sm:block sm:text-right sm:text-xs">
              <p>
                {t("workshop.stressTest.income")}{" "}
                <span className="block font-mono text-zinc-200 sm:inline">
                  {formatHkd(surplusAtScrub.income)}
                </span>
              </p>
              <p>
                {t("workshop.stressTest.expenses")}{" "}
                <span className="block font-mono text-zinc-200 sm:inline">
                  {formatHkd(surplusAtScrub.expenses)}
                </span>
              </p>
              <p>
                {t("workshop.stressTest.surplus")}{" "}
                <span
                  className={[
                    "block font-mono sm:inline",
                    surplusAtScrub.surplus >= 0
                      ? "text-emerald-300"
                      : "text-red-300",
                  ].join(" ")}
                >
                  {formatHkd(surplusAtScrub.surplus)}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              {t("workshop.stressTest.todayBaseline")}
            </p>
          )}
        </div>
        {/*
          Scrubber owns touch-action: none (via .workshop-range) so horizontal
          year drag does not scroll the page. Parent keeps touch-pan-y for
          vertical scrolling outside the control. Tap-to-jump is handled inside
          WorkshopRangeSlider (pointerdown anywhere on the track).
        */}
        <div className="mt-3 touch-none">
          <WorkshopRangeSlider
            min={nowYear}
            max={maxYear}
            step={1}
            value={scrubYear}
            aria-label={t("workshop.stressTest.yearScrubAria")}
            aria-valuetext={t("workshop.stressTest.yearValueAria").replace(
              "{year}",
              String(scrubYear),
            )}
            onChange={setScrubYear}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
          <span>{nowYear}</span>
          <span>
            {t("workshop.stressTest.horizonHint")
              .replace("{years}", String(DEFAULT_HORIZON_YEARS))
              .replace("{maxYear}", String(maxYear))}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isNarrating ? (
          <motion.p
            key="narrating"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-zinc-500"
          >
            {t("workshop.stressTest.narrating")}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          opacity: notesVisible || notes.length === 0 ? 1 : 0.92,
        }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }
        }
        className="space-y-6 sm:space-y-7"
      >
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("workshop.stressTest.sectionEmergency")}
          </h3>
          <WorkshopStatCard
            icon="PiggyBank"
            status={ef.status}
            label={t("workshop.stressTest.emergencyFundCardTitle")}
            value={t("workshop.stressTest.targetVsProjected")
              .replace(
                "{target}",
                t("workshop.stressTest.efTarget")
                  .replace("{months}", String(ef.targetMonths))
                  .replace(/^(Target:|目標：)\s*/, ""),
              )
              .replace("{projected}", efProjectedText)}
            expandableText={efNote}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("workshop.stressTest.sectionGoals")}
          </h3>
          <div className="space-y-3">
            {result.goalProjections.map((goal) => {
              const reachedByScrub =
                goal.projectedYear !== null && goal.projectedYear <= scrubYear;
              const note =
                notesVisible && goal.status !== "green"
                  ? notesById.get(goal.goalId)
                  : undefined;
              const projected =
                goal.projectedYear != null
                  ? String(goal.projectedYear)
                  : t("workshop.stressTest.notReachedLabel");

              return (
                <div
                  key={goal.goalId}
                  className={reachedByScrub ? "opacity-100" : "opacity-80"}
                >
                  <WorkshopStatCard
                    icon={goal.icon}
                    status={goal.status}
                    label={pickBilingual(goal.label, locale)}
                    value={t("workshop.stressTest.targetVsProjected")
                      .replace("{target}", String(goal.targetYear))
                      .replace("{projected}", projected)}
                    subtext={
                      reachedByScrub
                        ? t("workshop.stressTest.reachedByScrub").replace(
                            /^\s*·\s*/,
                            "",
                          )
                        : undefined
                    }
                    expandableText={note}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </motion.div>

      <WorkshopStickyFooter
        primaryLabel={t("workshop.stressTest.continueButton")}
        primaryDisabled={isNarrating || !result}
        onPrimaryClick={() => {
          if (result) {
            onContinue(result);
          }
        }}
        secondaryLabel={t("workshop.errors.backButton")}
        onSecondaryClick={onBack}
      />
    </div>
  );
}
