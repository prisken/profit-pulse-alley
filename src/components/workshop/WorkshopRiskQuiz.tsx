"use client";

import { createElement, useState, useTransition } from "react";
import { icons, type LucideIcon } from "lucide-react";

import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { saveRiskQuizAction } from "@/lib/workshop/pyramid-actions";
import {
  RISK_QUIZ_QUESTIONS,
  computeRiskProfile,
  type RiskQuizChoiceId,
} from "@/lib/workshop/risk-quiz";
import type { RiskQuizAnswer, RiskProfile } from "@/lib/workshop/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

type WorkshopRiskQuizProps = Readonly<{
  sessionId: string;
  onBack: () => void;
  onContinue: (result: {
    answers: RiskQuizAnswer[];
    score: number;
    profile: RiskProfile;
  }) => void;
}>;

export default function WorkshopRiskQuiz({
  sessionId,
  onBack,
  onContinue,
}: WorkshopRiskQuizProps) {
  const { t } = useTranslations();
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<
    Partial<Record<string, RiskQuizChoiceId>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const question = RISK_QUIZ_QUESTIONS[stepIndex]!;
  const prompt = t(question.promptKey);
  const selected = choices[question.id];
  const isLast = stepIndex === RISK_QUIZ_QUESTIONS.length - 1;

  function selectChoice(choiceId: RiskQuizChoiceId) {
    setChoices((prev) => ({ ...prev, [question.id]: choiceId }));
    setError(null);
  }

  function handleBack() {
    if (stepIndex === 0) {
      onBack();
      return;
    }
    setStepIndex((i) => i - 1);
  }

  function buildAnswers(): RiskQuizAnswer[] {
    return RISK_QUIZ_QUESTIONS.map((q) => {
      const choice = choices[q.id];
      if (!choice) {
        throw new Error(`Missing answer for ${q.id}`);
      }
      return { questionId: q.id, choice };
    });
  }

  function handleNext() {
    if (!selected) {
      return;
    }
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    setError(null);
    startSaveTransition(async () => {
      try {
        const answers = buildAnswers();
        const { score, profile } = computeRiskProfile(answers);
        await saveRiskQuizAction({
          sessionId,
          answers,
          score,
          profile,
        });
        onContinue({ answers, score, profile });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("workshop.riskQuiz.saveErrorFallback"),
        );
      }
    });
  }

  if (error) {
    return (
      <WorkshopRetryPanel
        title={t("workshop.riskQuiz.saveErrorTitle")}
        message={error}
        onRetry={handleNext}
        onBack={handleBack}
      />
    );
  }

  const progressLabel = t("workshop.riskQuiz.progressLabel").replace(
    "{n}",
    String(stepIndex + 1),
  );

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <div
        className="flex items-center justify-center gap-2"
        aria-label={progressLabel}
      >
        {RISK_QUIZ_QUESTIONS.map((q, index) => {
          const done = Boolean(choices[q.id]);
          const active = index === stepIndex;
          return (
            <span
              key={q.id}
              className={[
                "h-2.5 w-2.5 rounded-full transition-colors",
                active
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                  : done
                    ? "bg-emerald-300"
                    : "bg-slate-200",
              ].join(" ")}
              aria-current={active ? "step" : undefined}
            />
          );
        })}
      </div>

      <div className="text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
          aria-hidden="true"
        >
          {createElement(resolveIcon(question.icon), {
            className: "h-6 w-6",
            strokeWidth: 2,
          })}
        </span>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {progressLabel}
        </p>
        <h3 className="mt-2 text-balance text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          {prompt}
        </h3>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label={prompt}>
        {question.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const choiceLabel = t(choice.labelKey);
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isSaving}
              onClick={() => selectChoice(choice.id)}
              className={[
                "flex min-h-14 w-full touch-manipulation items-start gap-3 rounded-xl border-2 p-4 text-left shadow-sm transition-all",
                focusRing,
                isSelected
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-200 bg-white hover:border-emerald-500",
                isSaving ? "opacity-60" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600",
                ].join(" ")}
                aria-hidden="true"
              >
                {createElement(resolveIcon(choice.icon), {
                  className: "h-5 w-5",
                  strokeWidth: 2,
                })}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t("workshop.riskQuiz.choiceLetter").replace(
                    "{letter}",
                    choice.id.toUpperCase(),
                  )}
                </span>
                <span className="mt-1 block break-words text-sm leading-snug text-slate-800 [overflow-wrap:anywhere] sm:text-[15px]">
                  {choiceLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <WorkshopStickyFooter
        primaryLabel={
          isSaving
            ? t("workshop.riskQuiz.saving")
            : isLast
              ? t("workshop.riskQuiz.continueButton")
              : t("workshop.riskQuiz.nextButton")
        }
        primaryDisabled={!selected || isSaving}
        onPrimaryClick={handleNext}
        secondaryLabel={t("workshop.errors.backButton")}
        secondaryDisabled={isSaving}
        onSecondaryClick={handleBack}
      />
    </div>
  );
}
