"use client";

import { useState, type FormEvent } from "react";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  predictPyramidAction,
} from "@/lib/workshop/pyramid-actions";
import WorkshopCaptureStep from "@/components/workshop/WorkshopCaptureStep";
import WorkshopPyramidStep from "@/components/workshop/WorkshopPyramidStep";
import WorkshopExpensesStep from "@/components/workshop/WorkshopExpensesStep";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopStressTestStep from "@/components/workshop/WorkshopStressTestStep";
import WorkshopRiskQuiz from "@/components/workshop/WorkshopRiskQuiz";
import WorkshopSummaryStep from "@/components/workshop/WorkshopSummaryStep";
import WorkshopToneSelector from "@/components/workshop/WorkshopToneSelector";
import {
  WorkshopErrorBoundary,
  WorkshopRetryPanel,
  workshopPrimaryBtnClass,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStickyFooter, {
  workshopStickyContentPadClass,
} from "@/components/workshop/WorkshopStickyFooter";
import type {
  ActionGoal,
  Bilingual,
  ExpensesState,
  PyramidState,
  StressTestResult,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";
import type { PyramidBenchmarkSnapshot } from "@/lib/workshop/pyramid-benchmarks";
import {
  formatIndustryForAi,
  HOUSEHOLD_LABEL_KEYS,
  INDUSTRY_LABEL_KEYS,
  isWorkshopHouseholdKey,
  isWorkshopIndustryKey,
  WORKSHOP_HOUSEHOLD_KEYS,
  WORKSHOP_INDUSTRY_KEYS,
  type WorkshopHouseholdKey,
  type WorkshopIndustryKey,
} from "@/lib/workshop/intake-options";
import {
  TOTAL_STEPS,
  WIZARD_STEP_LABEL_KEYS,
  WIZARD_STEPS,
  type WizardStep,
} from "@/lib/workshop/wizard-steps";


const MIN_PREDICT_MS = 1500;

const fieldClass =
  "mt-1.5 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:text-sm";

const labelClass = "block text-sm font-medium text-slate-700";

const primaryBtnClass = `${workshopPrimaryBtnClass} touch-manipulation disabled:cursor-not-allowed disabled:opacity-60`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function WorkshopWizard() {
  const { t } = useTranslations();
  const [stepIndex, setStepIndex] = useState(0);
  const step = WIZARD_STEPS[stepIndex]!;
  const stepLabel = t(WIZARD_STEP_LABEL_KEYS[step]);
  const stepOfTotal = t("workshop.steps.stepOfTotal")
    .replace("{n}", String(stepIndex + 1))
    .replace("{total}", String(TOTAL_STEPS));
  const progressAria = t("workshop.steps.progressAria")
    .replace("{n}", String(stepIndex + 1))
    .replace("{total}", String(TOTAL_STEPS));

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pyramid, setPyramid] = useState<PyramidState | null>(null);
  const [pyramidRationale, setPyramidRationale] = useState<Bilingual | null>(
    null,
  );
  const [protectionExplanation, setProtectionExplanation] =
    useState<Bilingual | null>(null);
  const [emergencyFundExplanation, setEmergencyFundExplanation] =
    useState<Bilingual | null>(null);
  const [benchmarks, setBenchmarks] =
    useState<PyramidBenchmarkSnapshot | null>(null);
  const [expenses, setExpenses] = useState<ExpensesState | null>(null);

  const [age, setAge] = useState(0);
  const [retirementAge, setRetirementAge] = useState(65);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [industry, setIndustry] = useState<WorkshopIndustryKey | "">("");
  const [industryOther, setIndustryOther] = useState("");
  const [householdStatus, setHouseholdStatus] = useState<
    WorkshopHouseholdKey | ""
  >("");
  const [tone, setTone] = useState<WorkshopTone | null>(null);

  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [intakeAiFailed, setIntakeAiFailed] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  /** English label / free-text for AI + math; session stores the enum key. */
  const industryForDownstream = isWorkshopIndustryKey(industry)
    ? formatIndustryForAi(industry, industryOther)
    : "Other";

  const [stressTest, setStressTest] = useState<StressTestResult | null>(null);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [selectedActionGoal, setSelectedActionGoal] =
    useState<ActionGoal | null>(null);

  function goToStep(name: WizardStep) {
    const index = WIZARD_STEPS.indexOf(name);
    if (index >= 0) {
      setStepIndex(index);
    }
  }

  async function handleIntakeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIntakeError(null);
    setIntakeAiFailed(false);

    const ageNum = age;
    const incomeNum = monthlyIncome;
    if (!Number.isFinite(ageNum) || ageNum < 16 || ageNum > 100) {
      setIntakeError(t("workshop.intake.errorAge"));
      return;
    }
    let retirementAgeNum = retirementAge;
    if (!Number.isFinite(retirementAgeNum)) {
      retirementAgeNum = 65;
    }
    retirementAgeNum = Math.min(80, Math.max(40, Math.round(retirementAgeNum)));
    if (retirementAgeNum <= ageNum) {
      setIntakeError(t("workshop.intake.errorRetirementAge"));
      return;
    }
    if (!Number.isFinite(incomeNum) || incomeNum < 0) {
      setIntakeError(t("workshop.intake.errorIncome"));
      return;
    }
    if (!isWorkshopIndustryKey(industry)) {
      setIntakeError(t("workshop.intake.errorIndustry"));
      return;
    }
    if (industry === "other" && !industryOther.trim()) {
      setIntakeError(t("workshop.intake.errorIndustry"));
      return;
    }
    if (!isWorkshopHouseholdKey(householdStatus)) {
      setIntakeError(t("workshop.intake.errorHousehold"));
      return;
    }
    if (!tone) {
      setIntakeError(t("workshop.intake.errorTone"));
      return;
    }

    setIsPredicting(true);
    const startedAt = Date.now();

    try {
      const result = await predictPyramidAction({
        age: ageNum,
        retirementAge: retirementAgeNum,
        monthlyIncome: incomeNum,
        industry,
        industryOther: industry === "other" ? industryOther.trim() : undefined,
        householdStatus,
        tone,
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_PREDICT_MS) {
        await sleep(MIN_PREDICT_MS - elapsed);
      }

      setSessionId(result.sessionId);
      setPyramid({
        protection: result.protection,
        emergencyFund: result.emergencyFund,
        goals: result.goals,
        investment: result.investment,
      });
      setPyramidRationale(result.rationale);
      setProtectionExplanation(result.protectionExplanation);
      setEmergencyFundExplanation(result.emergencyFundExplanation);
      setBenchmarks(result.benchmarks);
      goToStep("pyramid");
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_PREDICT_MS) {
        await sleep(MIN_PREDICT_MS - elapsed);
      }
      setIntakeAiFailed(true);
      setIntakeError(
        error instanceof Error
          ? error.message
          : t("workshop.intake.errorAnalyze"),
      );
    } finally {
      setIsPredicting(false);
    }
  }

  return (
    <main className="workshop-lab min-h-screen overflow-x-hidden bg-slate-50/80 text-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-[max(0.75rem,env(safe-area-inset-left))] py-6 pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-12 sm:pb-12">
        {/* Shared chrome — always above every step body (no step may overlay this). */}
        <header className="shrink-0">
          {/*
            Narrow screens: title then LanguageSwitcher on a second row so
            progress dots never compete for width with the locale chips.
            sm+: title + switcher share one row (dots stay on their own row below).
          */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1 text-left sm:text-center sm:pl-11">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                {t("workshop.brand")}
              </p>
              <h1 className="mt-2 text-balance text-xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {stepLabel}
              </h1>
            </div>
            <LanguageSwitcher
              variant="projection"
              touchFriendly
              className="shrink-0 self-start sm:mt-0.5"
            />
          </div>

          <div className="mt-4 sm:mt-5">
            <nav
              className="flex min-w-0 flex-wrap items-center justify-start gap-2.5 sm:justify-center sm:gap-3"
              aria-label={progressAria}
            >
              {WIZARD_STEPS.map((name, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;
                const label = t(WIZARD_STEP_LABEL_KEYS[name]);
                return (
                  <span
                    key={name}
                    title={`${index + 1}. ${label}`}
                    className={[
                      // Visual progress only (not tappable) — keep ≥12px so 8
                      // dots stay legible on ~360px Android widths.
                      "h-3 w-3 rounded-full transition-colors",
                      isActive
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                        : isComplete
                          ? "bg-emerald-300"
                          : "bg-slate-200",
                    ].join(" ")}
                    aria-label={`${stepOfTotal}: ${label}`}
                    aria-current={isActive ? "step" : undefined}
                  />
                );
              })}
            </nav>
          </div>

          <p className="mt-2 font-mono text-xs tabular-nums text-slate-500 sm:text-center">
            {stepOfTotal}
            {sessionId ? (
              <span className="ml-2 text-slate-400">
                · {t("workshop.steps.sessionReady")}
              </span>
            ) : null}
          </p>
        </header>

        <section
          className={`mt-6 min-w-0 overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:mt-8 sm:p-8 ${workshopStickyContentPadClass}`}
          aria-labelledby="workshop-step-heading"
        >
          <h2 id="workshop-step-heading" className="sr-only">
            {stepLabel}
          </h2>

          <WorkshopErrorBoundary
            title={t("workshop.errors.wizardSnagTitle")}
            description={t("workshop.errors.wizardSnagDescription")}
            onBack={
              stepIndex > 0
                ? () => setStepIndex((index) => Math.max(0, index - 1))
                : undefined
            }
          >
            {step === "intake" ? (
              <form
                id="workshop-intake-form"
                onSubmit={handleIntakeSubmit}
                className="min-w-0 space-y-5"
                noValidate
              >
                <div>
                  <p className={labelClass} id="workshop-tone-label">
                    {t("workshop.tone.heading")}
                  </p>
                  <div className="mt-2.5" aria-labelledby="workshop-tone-label">
                    <WorkshopToneSelector
                      value={tone}
                      onChange={setTone}
                      disabled={isPredicting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                  <WorkshopNumberField
                    id="workshop-age"
                    variant="age"
                    label={t("workshop.intake.ageLabel")}
                    min={16}
                    max={100}
                    required
                    disabled={isPredicting}
                    value={age}
                    onChange={setAge}
                    enterKeyHint="next"
                    placeholder={t("workshop.intake.agePlaceholder")}
                  />
                  <div>
                    <WorkshopNumberField
                      id="workshop-retirement-age"
                      variant="age"
                      label={t("workshop.intake.retirementAgeLabel")}
                      min={40}
                      max={80}
                      required
                      disabled={isPredicting}
                      value={retirementAge}
                      onChange={setRetirementAge}
                      enterKeyHint="next"
                      placeholder={t("workshop.intake.retirementAgePlaceholder")}
                    />
                    <p className="mt-1.5 text-xs leading-snug text-slate-500">
                      {t("workshop.intake.retirementAgeHint")}
                    </p>
                  </div>
                </div>

                <WorkshopNumberField
                  id="workshop-income"
                  variant="currency"
                  label={t("workshop.intake.incomeLabel")}
                  min={0}
                  required
                  disabled={isPredicting}
                  value={monthlyIncome}
                  onChange={setMonthlyIncome}
                  enterKeyHint="next"
                  placeholder={t("workshop.intake.incomePlaceholder")}
                />

                <div>
                  <p className={labelClass} id="workshop-industry-label">
                    {t("workshop.intake.industryLabel")}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap gap-1.5"
                    role="radiogroup"
                    aria-labelledby="workshop-industry-label"
                  >
                    {WORKSHOP_INDUSTRY_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={industry === key}
                        disabled={isPredicting}
                        onClick={() => {
                          setIndustry(key);
                          if (key !== "other") {
                            setIndustryOther("");
                          }
                        }}
                        className={[
                          "inline-flex min-h-11 touch-manipulation items-center rounded-full border px-3.5 py-2 text-xs transition-colors",
                          industry === key
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {t(INDUSTRY_LABEL_KEYS[key])}
                      </button>
                    ))}
                  </div>
                  {industry === "other" ? (
                    <input
                      id="workshop-industry-other"
                      type="text"
                      required
                      disabled={isPredicting}
                      value={industryOther}
                      onChange={(e) => setIndustryOther(e.target.value)}
                      className={fieldClass}
                      placeholder={t(
                        "workshop.intake.industryOtherPlaceholder",
                      )}
                      autoComplete="organization-title"
                    />
                  ) : null}
                </div>

                <div>
                  <label htmlFor="workshop-household" className={labelClass}>
                    {t("workshop.intake.householdLabel")}
                  </label>
                  <select
                    id="workshop-household"
                    required
                    disabled={isPredicting}
                    value={householdStatus}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHouseholdStatus(
                        isWorkshopHouseholdKey(value) ? value : "",
                      );
                    }}
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      {t("workshop.intake.householdPlaceholder")}
                    </option>
                    {WORKSHOP_HOUSEHOLD_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(HOUSEHOLD_LABEL_KEYS[key])}
                      </option>
                    ))}
                  </select>
                </div>

                {intakeError && intakeAiFailed ? (
                  <WorkshopRetryPanel
                    title={t("workshop.intake.retryTitle")}
                    message={intakeError}
                    onRetry={() => {
                      const form = document.getElementById(
                        "workshop-intake-form",
                      ) as HTMLFormElement | null;
                      form?.requestSubmit();
                    }}
                  />
                ) : null}

                {intakeError && !intakeAiFailed ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
                  >
                    {intakeError}
                  </p>
                ) : null}

                {isPredicting ? (
                  <div
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-emerald-400/50" />
                    <p className="mt-3 text-sm font-medium text-emerald-900">
                      {t("workshop.intake.analyzingMessage")}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/80">
                      {t("workshop.intake.analyzingSubtext")}
                    </p>
                  </div>
                ) : null}
              </form>
            ) : null}

            {step === "intake" && !isPredicting && !intakeAiFailed ? (
              <WorkshopStickyFooter
                primaryLabel={t("workshop.intake.submitButton")}
                primaryType="submit"
                primaryForm="workshop-intake-form"
                primaryDisabled={!tone}
              />
            ) : null}

            {step === "pyramid" &&
            pyramid &&
            sessionId &&
            benchmarks &&
            protectionExplanation &&
            emergencyFundExplanation ? (
              <WorkshopErrorBoundary
                title={t("workshop.pyramid.snagTitle")}
                description={t("workshop.pyramid.snagDescription")}
                onBack={() => goToStep("intake")}
              >
                <WorkshopPyramidStep
                  sessionId={sessionId}
                  pyramid={pyramid}
                  onChange={setPyramid}
                  benchmarks={benchmarks}
                  rationale={pyramidRationale}
                  protectionExplanation={protectionExplanation}
                  emergencyFundExplanation={emergencyFundExplanation}
                  age={Number(age) || 30}
                  monthlyIncomeHKD={Number(monthlyIncome) || 0}
                  industry={industryForDownstream}
                  onBack={() => goToStep("intake")}
                  onContinue={() => goToStep("expenses")}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "pyramid" && (!pyramid || !sessionId || !benchmarks) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.pyramid.needIntake")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("intake")}
                >
                  {t("workshop.pyramid.goToIntake")}
                </button>
              </div>
            ) : null}

            {step === "expenses" && sessionId && pyramid && tone ? (
              <WorkshopErrorBoundary
                title={t("workshop.expenses.snagTitle")}
                description={t("workshop.expenses.snagDescription")}
                onBack={() => goToStep("pyramid")}
              >
                <WorkshopExpensesStep
                  sessionId={sessionId}
                  age={Number(age) || 30}
                  monthlyIncome={Number(monthlyIncome) || 0}
                  industry={industryForDownstream}
                  householdStatus={householdStatus || undefined}
                  pyramid={pyramid}
                  tone={tone}
                  expenses={expenses}
                  onChange={setExpenses}
                  onBack={() => goToStep("pyramid")}
                  onContinue={() => goToStep("stresstest")}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "expenses" && (!sessionId || !pyramid || !tone) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.expenses.needPyramid")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("pyramid")}
                >
                  {t("workshop.expenses.goToPyramid")}
                </button>
              </div>
            ) : null}

            {step === "stresstest" &&
            sessionId &&
            pyramid &&
            expenses &&
            tone ? (
              <WorkshopErrorBoundary
                title={t("workshop.stressTest.snagTitle")}
                description={t("workshop.stressTest.snagDescription")}
                onBack={() => goToStep("expenses")}
              >
                <WorkshopStressTestStep
                  sessionId={sessionId}
                  age={Number(age) || 30}
                  industry={industryForDownstream}
                  monthlyIncome={Number(monthlyIncome) || 0}
                  expenses={expenses}
                  pyramid={pyramid}
                  tone={tone}
                  onBack={() => goToStep("expenses")}
                  onContinue={(result, plan) => {
                    setStressTest(result);
                    // Keep wizard in sync with journey squeezes / give-ups.
                    setPyramid(plan.pyramid);
                    setExpenses(plan.expenses);
                    // Invalidate Summary so Step 6 re-runs stress test + action goals.
                    setSummary(null);
                    setSelectedActionGoal(null);
                    goToStep("riskquiz");
                  }}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "stresstest" &&
            (!sessionId || !pyramid || !expenses || !tone) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.stressTest.needExpenses")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("expenses")}
                >
                  {t("workshop.stressTest.goToExpenses")}
                </button>
              </div>
            ) : null}

            {step === "riskquiz" && sessionId ? (
              <WorkshopErrorBoundary
                title={t("workshop.riskQuiz.snagTitle")}
                description={t("workshop.riskQuiz.snagDescription")}
                onBack={() => {
                  setSummary(null);
                  setSelectedActionGoal(null);
                  goToStep("stresstest");
                }}
              >
                <WorkshopRiskQuiz
                  sessionId={sessionId}
                  onBack={() => {
                    setSummary(null);
                    setSelectedActionGoal(null);
                    goToStep("stresstest");
                  }}
                  onContinue={() => {
                    goToStep("summary");
                  }}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "riskquiz" && !sessionId ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.riskQuiz.needEarlier")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("intake")}
                >
                  {t("workshop.riskQuiz.goToIntake")}
                </button>
              </div>
            ) : null}

            {step === "summary" &&
            sessionId &&
            pyramid &&
            benchmarks &&
            expenses &&
            tone ? (
              <WorkshopErrorBoundary
                title={t("workshop.summary.snagTitle")}
                description={t("workshop.summary.snagDescription")}
                onBack={() => goToStep("riskquiz")}
              >
                <WorkshopSummaryStep
                  sessionId={sessionId}
                  age={Number(age) || 30}
                  industry={industryForDownstream}
                  monthlyIncome={Number(monthlyIncome) || 0}
                  expenses={expenses}
                  pyramid={pyramid}
                  benchmarks={benchmarks}
                  crisis={null}
                  tone={tone}
                  stressTest={stressTest}
                  initialSummary={summary}
                  onBack={() => {
                    // Returning from capture keeps summary; leaving toward quiz
                    // keeps cache only until journey is revisited (cleared above).
                    goToStep("riskquiz");
                  }}
                  onContinue={(goal) => {
                    setSelectedActionGoal(goal);
                    goToStep("capture");
                  }}
                  onSummaryReady={setSummary}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "summary" &&
            (!sessionId || !pyramid || !benchmarks || !expenses || !tone) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.summary.needEarlier")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("riskquiz")}
                >
                  {t("workshop.summary.goToRiskQuiz")}
                </button>
              </div>
            ) : null}

            {step === "capture" && sessionId && selectedActionGoal ? (
              <WorkshopErrorBoundary
                title={t("workshop.capture.snagTitle")}
                description={t("workshop.capture.snagDescription")}
                onBack={() => goToStep("summary")}
              >
                <WorkshopCaptureStep
                  sessionId={sessionId}
                  selectedGoalTitle={selectedActionGoal.title}
                  onBack={() => goToStep("summary")}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "capture" && (!sessionId || !selectedActionGoal) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.capture.needSummary")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("summary")}
                >
                  {t("workshop.capture.goToSummary")}
                </button>
              </div>
            ) : null}
          </WorkshopErrorBoundary>
        </section>
      </div>
    </main>
  );
}
