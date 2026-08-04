"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { icons, type LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import {
  narrateStressTestAction,
  runGoalStressTestAction,
} from "@/lib/workshop/pyramid-actions";
import { getToneUiTheme } from "@/lib/workshop/tone";
import type {
  Bilingual,
  ExpensesState,
  LayerFlag,
  PyramidState,
  StressTestNote,
  StressTestResult,
  WorkshopTone,
} from "@/lib/workshop/types";

const NARRATIVE_FADE_DELAY_MS = 800;
const DEFAULT_HORIZON_YEARS = 30;

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

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  value?: number | string;
};

function StressChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
  label?: string | number;
}) {
  const { t } = useTranslations();
  if (!active || !payload?.length) {
    return null;
  }

  const income = payload.find((p) => p.dataKey === "income")?.value;
  const expenses = payload.find((p) => p.dataKey === "expenses")?.value;
  const surplus = payload.find((p) => p.dataKey === "surplus")?.value;

  const incomeN = typeof income === "number" ? income : null;
  const expensesN = typeof expenses === "number" ? expenses : null;
  const surplusN = typeof surplus === "number" ? surplus : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 text-slate-900 shadow-xl backdrop-blur">
      <p className="font-mono text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-2 space-y-1 text-xs">
        {incomeN !== null ? (
          <p>
            {t("workshop.stressTest.income")}{" "}
            <span className="font-mono font-medium">{formatHkd(incomeN)}</span>
          </p>
        ) : null}
        {expensesN !== null ? (
          <p>
            {t("workshop.stressTest.expenses")}{" "}
            <span className="font-mono font-medium">{formatHkd(expensesN)}</span>
          </p>
        ) : null}
        {surplusN !== null ? (
          <p
            className={
              surplusN >= 0 ? "text-emerald-700" : "text-rose-700"
            }
          >
            {t("workshop.stressTest.surplus")}{" "}
            <span className="font-mono font-semibold">
              {formatHkd(surplusN)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
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
  const toneTheme = getToneUiTheme(tone);
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

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }
    return result.monthlySurplusByYear.map((row) => ({
      calendarYear: nowYear + row.year,
      income: row.income,
      expenses: row.expenses,
      surplus: row.surplus,
    }));
  }, [result, nowYear]);

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

  const scrubPct =
    maxYear === nowYear
      ? 0
      : ((scrubYear - nowYear) / (maxYear - nowYear)) * 100;

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

  const efValue = t("workshop.stressTest.targetVsProjected")
    .replace(
      "{target}",
      t("workshop.stressTest.efTarget")
        .replace("{months}", String(ef.targetMonths))
        .replace(/^(Target:|目標：)\s*/, ""),
    )
    .replace("{projected}", efProjectedText);

  return (
    <div className="min-w-0 touch-pan-y space-y-6 sm:space-y-7">
      <p className="text-sm leading-relaxed text-slate-600">
        {t("workshop.stressTest.intro")}
      </p>

      {chartData.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("workshop.stressTest.surplus")}
          </p>
          <div className="h-52 w-full min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="workshopIncomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="workshopExpensesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="workshopSurplusFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="calendarYear"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("en", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(v)
                  }
                />
                <Tooltip
                  // Recharts v3 ContentType generics are awkward with custom tooltips.
                  content={StressChartTooltip as never}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#workshopIncomeFill)"
                  name={t("workshop.stressTest.income")}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#workshopExpensesFill)"
                  name={t("workshop.stressTest.expenses")}
                />
                <Area
                  type="monotone"
                  dataKey="surplus"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#workshopSurplusFill)"
                  name={t("workshop.stressTest.surplus")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-4 shadow-sm touch-pan-y sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("workshop.stressTest.scrubberLabel")}
            </p>
          </div>
          {surplusAtScrub ? (
            <div className="grid grid-cols-3 gap-2 text-left text-[11px] text-slate-500 sm:block sm:text-right sm:text-xs">
              <p>
                {t("workshop.stressTest.income")}{" "}
                <span className="block font-mono text-slate-800 sm:inline">
                  {formatHkd(surplusAtScrub.income)}
                </span>
              </p>
              <p>
                {t("workshop.stressTest.expenses")}{" "}
                <span className="block font-mono text-slate-800 sm:inline">
                  {formatHkd(surplusAtScrub.expenses)}
                </span>
              </p>
              <p>
                {t("workshop.stressTest.surplus")}{" "}
                <span
                  className={[
                    "block font-mono sm:inline",
                    surplusAtScrub.surplus >= 0
                      ? "text-emerald-600"
                      : "text-rose-600",
                  ].join(" ")}
                >
                  {formatHkd(surplusAtScrub.surplus)}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {t("workshop.stressTest.todayBaseline")}
            </p>
          )}
        </div>

        <div className="relative mt-4 touch-none pt-9">
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
            style={{ left: `clamp(1.5rem, ${scrubPct}%, calc(100% - 1.5rem))` }}
          >
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-semibold text-white shadow-md">
              {scrubYear}
            </span>
          </div>
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
        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
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
            subtitle={efValue}
            badge={
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  FLAG_PILL[ef.status],
                ].join(" ")}
              >
                {t(FLAG_LABEL_KEYS[ef.status])}
              </span>
            }
            defaultExpanded={ef.status !== "green"}
          >
            {efNote ? (
              <div
                className={[
                  "rounded-xl border p-3.5",
                  toneTheme.cardAccentClass,
                ].join(" ")}
              >
                <p className={["text-sm leading-relaxed", toneTheme.headingStyle].join(" ")}>
                  <span className="mr-1.5" aria-hidden="true">
                    {toneTheme.iconEmoji}
                  </span>
                  {pickBilingual(efNote, locale)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {t("workshop.stressTest.efTarget").replace(
                  "{months}",
                  String(ef.targetMonths),
                )}
              </p>
            )}
          </CollapsibleWidget>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
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
              const value = t("workshop.stressTest.targetVsProjected")
                .replace("{target}", String(goal.targetYear))
                .replace("{projected}", projected);

              return (
                <CollapsibleWidget
                  key={goal.goalId}
                  className={reachedByScrub ? undefined : "opacity-90"}
                  icon={
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                      {createElement(resolveIcon(goal.icon), {
                        className: "h-5 w-5",
                        strokeWidth: 2,
                      })}
                    </span>
                  }
                  title={pickBilingual(goal.label, locale)}
                  subtitle={value}
                  badge={
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        FLAG_PILL[goal.status],
                      ].join(" ")}
                    >
                      {t(FLAG_LABEL_KEYS[goal.status])}
                    </span>
                  }
                  defaultExpanded={goal.status !== "green"}
                >
                  <div className="space-y-3">
                    {reachedByScrub ? (
                      <p className="text-sm text-emerald-700">
                        {t("workshop.stressTest.reachedByScrub").replace(
                          /^\s*·\s*/,
                          "",
                        )}
                      </p>
                    ) : null}
                    {note ? (
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
                          {pickBilingual(note, locale)}
                        </p>
                      </div>
                    ) : null}
                    {!note && !reachedByScrub ? (
                      <p className="text-sm text-slate-500">{value}</p>
                    ) : null}
                  </div>
                </CollapsibleWidget>
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
