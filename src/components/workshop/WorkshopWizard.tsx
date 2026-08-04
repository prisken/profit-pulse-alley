"use client";

import { useState, type FormEvent } from "react";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  predictPyramidAction,
} from "@/lib/workshop/pyramid-actions";
import WorkshopCrisisStep from "@/components/workshop/WorkshopCrisisStep";
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
  CrisisState,
  ExpensesState,
  RiskProfile,
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
  "mt-1.5 w-full min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-base text-white outline-none placeholder:text-zinc-500 focus-visible:border-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-400/40 sm:text-sm";

const labelClass = "block text-sm font-medium text-zinc-200";

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
  const [benchmarks, setBenchmarks] =
    useState<PyramidBenchmarkSnapshot | null>(null);
  const [expenses, setExpenses] = useState<ExpensesState | null>(null);

  const [age, setAge] = useState(0);
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

  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [stressTest, setStressTest] = useState<StressTestResult | null>(null);
  const [crisisScenario, setCrisisScenario] = useState<CrisisState | null>(
    null,
  );
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
    <main className="workshop-lab min-h-dvh overflow-x-hidden bg-mp-obsidian text-white">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
                {t("workshop.brand")}
              </p>
              <h1 className="mt-2 text-balance text-xl font-semibold tracking-tight sm:text-3xl">
                {stepLabel}
              </h1>
            </div>
            <LanguageSwitcher
              variant="dark"
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
                        ? "bg-emerald-400"
                        : isComplete
                          ? "bg-emerald-400/45"
                          : "bg-white/20",
                    ].join(" ")}
                    aria-label={`${stepOfTotal}: ${label}`}
                    aria-current={isActive ? "step" : undefined}
                  />
                );
              })}
            </nav>
          </div>

          <p className="mt-2 font-mono text-xs tabular-nums text-zinc-500 sm:text-center">
            {stepOfTotal}
            {sessionId ? (
              <span className="ml-2 text-zinc-600">
                · {t("workshop.steps.sessionReady")}
              </span>
            ) : null}
          </p>
        </header>

        <section
          className={`mt-6 min-w-0 overflow-x-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:mt-8 sm:p-8 ${workshopStickyContentPadClass}`}
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
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
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
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200"
                  >
                    {intakeError}
                  </p>
                ) : null}

                {isPredicting ? (
                  <div
                    className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-4 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-emerald-400/30" />
                    <p className="mt-3 text-sm font-medium text-emerald-100">
                      {t("workshop.intake.analyzingMessage")}
                    </p>
                    <p className="mt-1 text-xs text-emerald-200/70">
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

            {step === "pyramid" && pyramid && sessionId && benchmarks ? (
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
                  onContinue={(result) => {
                    setStressTest(result);
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
                onBack={() => goToStep("stresstest")}
              >
                <WorkshopRiskQuiz
                  sessionId={sessionId}
                  onBack={() => goToStep("stresstest")}
                  onContinue={(result) => {
                    setRiskProfile(result.profile);
                    goToStep("crisis");
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

            {step === "crisis" &&
            sessionId &&
            pyramid &&
            expenses &&
            tone &&
            riskProfile ? (
              <WorkshopErrorBoundary
                title={t("workshop.crisis.snagTitle")}
                description={t("workshop.crisis.snagDescription")}
                onBack={() => goToStep("riskquiz")}
              >
                <WorkshopCrisisStep
                  sessionId={sessionId}
                  age={Number(age) || 30}
                  industry={industryForDownstream}
                  monthlyIncome={Number(monthlyIncome) || 0}
                  householdStatus={householdStatus}
                  expenses={expenses}
                  pyramid={pyramid}
                  tone={tone}
                  riskProfile={riskProfile}
                  stressTest={stressTest}
                  onBack={() => goToStep("riskquiz")}
                  onContinue={() => goToStep("summary")}
                  onResolved={({ crisis }) => {
                    setCrisisScenario(crisis);
                  }}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "crisis" &&
            (!sessionId || !pyramid || !expenses || !tone || !riskProfile) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.crisis.needRiskQuiz")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("riskquiz")}
                >
                  {t("workshop.crisis.goToRiskQuiz")}
                </button>
              </div>
            ) : null}

            {step === "summary" &&
            sessionId &&
            pyramid &&
            benchmarks &&
            expenses &&
            crisisScenario &&
            tone ? (
              <WorkshopErrorBoundary
                title={t("workshop.summary.snagTitle")}
                description={t("workshop.summary.snagDescription")}
                onBack={() => goToStep("crisis")}
              >
                <WorkshopSummaryStep
                  sessionId={sessionId}
                  age={Number(age) || 30}
                  industry={industryForDownstream}
                  monthlyIncome={Number(monthlyIncome) || 0}
                  expenses={expenses}
                  pyramid={pyramid}
                  benchmarks={benchmarks}
                  crisis={crisisScenario}
                  tone={tone}
                  stressTest={stressTest}
                  initialSummary={summary}
                  onBack={() => goToStep("crisis")}
                  onContinue={(goal) => {
                    setSelectedActionGoal(goal);
                    goToStep("capture");
                  }}
                  onSummaryReady={setSummary}
                />
              </WorkshopErrorBoundary>
            ) : null}

            {step === "summary" &&
            (!sessionId ||
              !pyramid ||
              !benchmarks ||
              !expenses ||
              !crisisScenario ||
              !tone) ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("workshop.summary.needCrisis")}
                </p>
                <button
                  type="button"
                  className={primaryBtnClass}
                  onClick={() => goToStep("crisis")}
                >
                  {t("workshop.summary.goToCrisis")}
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
