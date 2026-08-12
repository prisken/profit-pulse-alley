"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopGoalJourneyOverview from "@/components/workshop/WorkshopGoalJourneyOverview";
import WorkshopGoalJourneyRail from "@/components/workshop/WorkshopGoalJourneyRail";
import { WorkshopRetryPanel } from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import {
  emptyGoalJourneyState,
} from "@/lib/workshop/goal-journey";
import {
  narrateStressTestAction,
  runLifeTimelineAction,
} from "@/lib/workshop/pyramid-actions";
import { getToneUiTheme } from "@/lib/workshop/tone";
import {
  type TimelineResult,
} from "@/lib/workshop/timeline-engine";
import type {
  Bilingual,
  ExpensesState,
  GoalJourneyState,
  LayerFlag,
  PyramidState,
  StressTestNote,
  StressTestResult,
  WorkshopTone,
} from "@/lib/workshop/types";

const NARRATIVE_FADE_DELAY_MS = 800;

const FLAG_LABEL_KEYS: Record<LayerFlag, MessageKey> = {
  green: "workshop.layerFlags.green",
  amber: "workshop.layerFlags.amber",
  red: "workshop.layerFlags.red",
};

const FLAG_PILL: Record<LayerFlag, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
};

function noteMap(notes: StressTestNote[]): Map<string, Bilingual> {
  return new Map(notes.map((n) => [n.id, n.note]));
}

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
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
  onContinue: (
    result: StressTestResult,
    plan: { pyramid: PyramidState; expenses: ExpensesState },
  ) => void;
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
  const toneTheme = getToneUiTheme(tone);

  const [result, setResult] = useState<TimelineResult | null>(null);
  const [legacyStress, setLegacyStress] = useState<StressTestResult | null>(
    null,
  );
  const [notes, setNotes] = useState<StressTestNote[]>([]);
  const [notesVisible, setNotesVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [livePyramid, setLivePyramid] = useState(pyramid);
  const [liveExpenses, setLiveExpenses] = useState(expenses);
  const [journey, setJourney] = useState<GoalJourneyState>(() =>
    emptyGoalJourneyState(),
  );
  const [goalsResolved, setGoalsResolved] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setLivePyramid(pyramid);
  }, [pyramid]);

  useEffect(() => {
    setLiveExpenses(expenses);
  }, [expenses]);

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
      setLegacyStress(null);

      try {
        const {
          timeline,
          legacyStressTest,
          journey: loadedJourney,
          pyramid: sessionPyramid,
          expenses: sessionExpenses,
        } = await runLifeTimelineAction(sessionId);
        if (cancelled) {
          return;
        }
        setResult(timeline);
        setLegacyStress(legacyStressTest);
        setJourney(loadedJourney);
        setLivePyramid(sessionPyramid);
        setLiveExpenses(sessionExpenses);
        setIsRunning(false);
        setIsNarrating(true);

        const narrateStarted = Date.now();
        const narrated = await narrateStressTestAction(sessionId, timeline, {
          tone,
          age,
          industry,
          monthlyIncome,
          expenses: sessionExpenses,
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
    tone,
    retryToken,
    t,
  ]);

  const notesById = useMemo(() => noteMap(notes), [notes]);

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

  if (isRunning || !result || !legacyStress) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-800">
          {t("workshop.stressTest.running")}
        </p>
        <p className="text-xs text-slate-500">
          {t("workshop.stressTest.runningSubtext")}
        </p>
      </div>
    );
  }

  const ef = result.emergencyFund;
  const efIsOversaved = ef.status === "oversaved";
  const efNeedsNote = ef.status !== "green";
  const efNote =
    notesVisible && efNeedsNote ? notesById.get("emergencyFund") : undefined;

  const efBadgeStatus: LayerFlag = efIsOversaved
    ? "amber"
    : ef.status === "green" || ef.status === "amber" || ef.status === "red"
      ? ef.status
      : "amber";

  const efSubtitle = efIsOversaved
    ? t("workshop.stressTest.efOversavedDetail")
        .replace("{excess}", formatCompactHkd(ef.excessHKD ?? 0))
        .replace("{opportunity}", formatCompactHkd(ef.opportunityCostHKD ?? 0))
    : t("workshop.stressTest.efTarget")
        .replace("{months}", String(ef.targetMonths))
        .replace("{amount}", formatCompactHkd(ef.targetHKD));

  return (
    <div className="min-w-0 touch-pan-y space-y-6 overflow-x-hidden sm:space-y-7">
      <WorkshopGoalJourneyOverview
        monthlyIncomeHKD={monthlyIncome}
        expenses={liveExpenses}
        pyramid={livePyramid}
      />

      <div className="min-w-0 space-y-3">
        {efIsOversaved ? (
          <WorkshopStatCard
            icon="PiggyBank"
            status="amber"
            label={t("workshop.stressTest.headlineOversavedLabel")}
            value={t("workshop.stressTest.headlineOversaved").replace(
              "{excess}",
              formatCompactHkd(ef.excessHKD ?? 0),
            )}
            subtext={t("workshop.stressTest.headlineOversavedDetail").replace(
              "{opportunity}",
              formatCompactHkd(ef.opportunityCostHKD ?? 0),
            )}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {isNarrating ? (
          <motion.p
            key="narrating"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-slate-500"
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("workshop.stressTest.sectionEmergency")}
          </h3>
          <CollapsibleWidget
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                {createElement(resolveIcon("PiggyBank"), {
                  className: "h-5 w-5",
                  strokeWidth: 2,
                })}
              </span>
            }
            title={t("workshop.stressTest.emergencyFundCardTitle")}
            subtitle={efSubtitle}
            badge={
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  FLAG_PILL[efBadgeStatus],
                ].join(" ")}
              >
                {efIsOversaved
                  ? t("workshop.stressTest.efOversavedLabel")
                  : t(FLAG_LABEL_KEYS[efBadgeStatus])}
              </span>
            }
            defaultExpanded={efNeedsNote}
          >
            {efNote ? (
              <div
                className={[
                  "rounded-xl border p-3.5",
                  toneTheme.cardAccentClass,
                ].join(" ")}
              >
                <p
                  className={[
                    "text-sm leading-relaxed",
                    toneTheme.headingStyle,
                  ].join(" ")}
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {toneTheme.iconEmoji}
                  </span>
                  {pickBilingual(efNote, locale)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {efIsOversaved
                  ? efSubtitle
                  : t("workshop.stressTest.efAlreadyFunded")}
              </p>
            )}
          </CollapsibleWidget>
        </section>

        <WorkshopGoalJourneyRail
          sessionId={sessionId}
          tone={tone}
          pyramid={livePyramid}
          expenses={liveExpenses}
          journey={journey}
          timeline={result}
          onGoalsResolvedChange={setGoalsResolved}
          onPlanChange={(update) => {
            setResult(update.timeline);
            setLegacyStress(update.legacyStressTest);
            setLivePyramid(update.pyramid);
            setLiveExpenses(update.expenses);
            setJourney(update.journey);
          }}
        />
      </motion.div>

      <WorkshopStickyFooter
        primaryLabel={t("workshop.stressTest.continueButton")}
        primaryDisabled={isNarrating || !legacyStress || !goalsResolved}
        onPrimaryClick={() => {
          if (legacyStress && goalsResolved) {
            onContinue(legacyStress, {
              pyramid: livePyramid,
              expenses: liveExpenses,
            });
          }
        }}
        secondaryLabel={t("workshop.errors.backButton")}
        onSecondaryClick={onBack}
      />
    </div>
  );
}
