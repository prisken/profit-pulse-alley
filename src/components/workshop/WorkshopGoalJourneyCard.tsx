"use client";

import { useEffect, useId, useState, useTransition } from "react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopAllocationDonut from "@/components/workshop/WorkshopAllocationDonut";
import {
  WorkshopErrorBoundary,
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { GoalOutlook } from "@/lib/workshop/goal-journey";
import {
  applyGoalJourneyDecisionAction,
  type ApplyGoalJourneyDecisionActionResult,
  computeGoalOutlookAction,
  computeSqueezeRecommendationAction,
  narrateGoalSqueezeAction,
} from "@/lib/workshop/pyramid-actions";
import type {
  GoalItem,
  SqueezeRecommendation,
  WorkshopTone,
} from "@/lib/workshop/types";

function monthlyOutflowTotal(
  slices: SqueezeRecommendation["currentAllocation"],
): number {
  return Math.round(
    slices
      .filter((slice) => slice.key !== "surplus")
      .reduce((sum, slice) => sum + Math.max(0, slice.amountHKD), 0) * 100,
  ) / 100;
}

function yearsLate(outlook: GoalOutlook): number {
  if (outlook.attainedAtAge == null) {
    return Math.max(1, Math.ceil(outlook.monthsLate / 12));
  }
  return Math.max(0, outlook.attainedAtAge - outlook.targetAge);
}

type WorkshopGoalJourneyCardProps = Readonly<{
  sessionId: string;
  goal: GoalItem;
  tone: WorkshopTone;
  active: boolean;
  /** Bumped after each journey decision — forces a fresh outlook recompute. */
  planRevision: number;
  onDecisionComplete: (result: ApplyGoalJourneyDecisionActionResult) => void;
}>;

/**
 * Expanded interior for one goal on the journey rail: outlook, liquidation,
 * squeeze donuts + AI reasoning, Apply / Give up.
 */
export default function WorkshopGoalJourneyCard({
  sessionId,
  goal,
  tone,
  active,
  planRevision,
  onDecisionComplete,
}: WorkshopGoalJourneyCardProps) {
  const { t, locale } = useTranslations();
  const switchId = useId();

  const [outlook, setOutlook] = useState<GoalOutlook | null>(null);
  const [efMonths, setEfMonths] = useState<number | null>(null);
  const [allowLiquidation, setAllowLiquidation] = useState(
    goal.allowLiquidation === true,
  );
  const [recommendation, setRecommendation] =
    useState<SqueezeRecommendation | null>(null);
  const [reasoningError, setReasoningError] = useState<string | null>(null);
  const [reasoningRetry, setReasoningRetry] = useState(0);
  const [acceptedSqueeze, setAcceptedSqueeze] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeciding, startDecideTransition] = useTransition();
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [loadRetry, setLoadRetry] = useState(0);

  // Stable key for squeeze numbers (excludes reasoning) so merging AI text
  // into `recommendation` does not re-fire narration.
  const squeezeNarrateKey = recommendation
    ? [
        goal.id,
        recommendation.requiredExtraMonthlyHKD,
        recommendation.achievableAtAge ?? "null",
        recommendation.currentAllocation.map((s) => `${s.key}:${s.amountHKD}`).join(","),
        recommendation.recommendedAllocation
          .map((s) => `${s.key}:${s.amountHKD}`)
          .join(","),
        tone,
        reasoningRetry,
      ].join("|")
    : null;

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      setAcceptedSqueeze(false);
      try {
        const [outlookResult, squeezeResult] = await Promise.all([
          computeGoalOutlookAction(sessionId, goal.id, allowLiquidation),
          computeSqueezeRecommendationAction(
            sessionId,
            goal.id,
            allowLiquidation,
          ),
        ]);
        if (cancelled) {
          return;
        }
        setOutlook(squeezeResult.outlook ?? outlookResult.outlook);
        setEfMonths(outlookResult.emergencyFundMonths);
        setRecommendation(squeezeResult.recommendation);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setLoadError(
          err instanceof Error
            ? err.message
            : t("workshop.journey.loadError"),
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    allowLiquidation,
    goal.id,
    loadRetry,
    planRevision,
    sessionId,
    t,
  ]);

  useEffect(() => {
    // Lazy: only narrate when this card is open AND a squeeze section is needed
    // (recommendation is null when the goal is already on track — no AI call).
    if (!active || !recommendation || !squeezeNarrateKey) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setReasoningError(null);
      try {
        const note = await narrateGoalSqueezeAction(
          sessionId,
          goal.id,
          recommendation,
          tone,
        );
        if (!cancelled) {
          setRecommendation((prev) =>
            prev ? { ...prev, reasoning: note } : prev,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setReasoningError(
            err instanceof Error
              ? err.message
              : t("workshop.journey.reasoningError"),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // recommendation is intentionally omitted: squeezeNarrateKey encodes the
    // numeric payload; including the object would re-fire after merging reasoning.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [active, squeezeNarrateKey, sessionId, goal.id, tone, t]);

  function handleLiquidationToggle(next: boolean) {
    setAllowLiquidation(next);
    setAcceptedSqueeze(false);
  }

  function submitDecision(status: "applied" | "given_up") {
    setDecisionError(null);
    startDecideTransition(async () => {
      try {
        const result = await applyGoalJourneyDecisionAction(sessionId, {
          goalId: goal.id,
          status,
          allowLiquidation: status === "applied" ? allowLiquidation : false,
          acceptedSqueeze: status === "applied" ? acceptedSqueeze : false,
        });
        onDecisionComplete(result);
      } catch (err) {
        setDecisionError(
          err instanceof Error
            ? err.message
            : t("workshop.journey.decisionError"),
        );
      }
    });
  }

  if (loadError) {
    return (
      <WorkshopRetryPanel
        title={t("workshop.journey.loadErrorTitle")}
        message={loadError}
        onRetry={() => setLoadRetry((n) => n + 1)}
      />
    );
  }

  if (isLoading || !outlook) {
    return (
      <div
        className="space-y-2 py-2 text-sm text-slate-500"
        data-testid="workshop-journey-card-body"
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
        <p className="text-center">{t("workshop.journey.loadingOutlook")}</p>
      </div>
    );
  }

  const lateYears = yearsLate(outlook);
  const onTime =
    outlook.attainedAtAge != null && outlook.attainedAtAge <= outlook.targetAge;
  const displayAge = acceptedSqueeze
    ? (recommendation?.achievableAtAge ??
      outlook.attainedAtAge ??
      outlook.targetAge)
    : (outlook.attainedAtAge ?? null);
  const showLate =
    !acceptedSqueeze &&
    (outlook.attainedAtAge == null || outlook.attainedAtAge > outlook.targetAge);
  const squeezeAcceptedOnTime =
    acceptedSqueeze &&
    (recommendation?.achievableAtAge == null ||
      recommendation.achievableAtAge <= outlook.targetAge);

  const headlineAge =
    acceptedSqueeze && recommendation?.achievableAtAge != null
      ? recommendation.achievableAtAge
      : displayAge;

  return (
    <div className="min-w-0 space-y-4" data-testid="workshop-journey-card-body">
      <div
        className={[
          "rounded-xl border px-3.5 py-3",
          onTime || squeezeAcceptedOnTime
            ? "border-emerald-200 bg-emerald-50/80"
            : "border-rose-200 bg-rose-50/70",
        ].join(" ")}
        data-testid="workshop-journey-outlook-headline"
      >
        <p
          className={[
            "text-sm font-semibold leading-snug",
            onTime || squeezeAcceptedOnTime
              ? "text-emerald-800"
              : "text-rose-800",
          ].join(" ")}
        >
          {headlineAge != null
            ? t("workshop.journey.outlookHeadline")
                .replace(
                  "{target}",
                  formatCompactHkd(goal.targetAmountHKD),
                )
                .replace("{age}", String(headlineAge))
            : t("workshop.journey.outlookNever").replace(
                "{target}",
                formatCompactHkd(goal.targetAmountHKD),
              )}
        </p>
        {showLate && !acceptedSqueeze ? (
          <p className="mt-1 text-xs font-medium text-rose-700">
            {t("workshop.journey.yearsLate").replace(
              "{n}",
              String(lateYears),
            )}
          </p>
        ) : null}
        {acceptedSqueeze && recommendation?.achievableAtAge != null ? (
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {t("workshop.journey.outlookWithSqueeze").replace(
              "{age}",
              String(recommendation.achievableAtAge),
            )}
          </p>
        ) : null}
        {allowLiquidation && efMonths != null ? (
          <p className="mt-1.5 text-xs text-slate-600">
            {t("workshop.journey.liquidationConsequence")
              .replace(
                "{age}",
                String(outlook.attainedAtAge ?? outlook.targetAge),
              )
              .replace("{months}", String(efMonths))}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={allowLiquidation}
          className={[
            "relative mt-0.5 h-7 w-12 shrink-0 touch-manipulation rounded-full p-0 transition-colors",
            allowLiquidation ? "bg-emerald-500" : "bg-slate-300",
          ].join(" ")}
          onClick={() => handleLiquidationToggle(!allowLiquidation)}
        >
          <span
            className={[
              "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
              allowLiquidation
                ? "translate-x-[calc(100%_-_0.25rem)]"
                : "translate-x-0",
            ].join(" ")}
          />
        </button>
        <label
          htmlFor={switchId}
          className="min-w-0 flex-1 cursor-pointer text-sm leading-snug text-slate-700"
        >
          {t("workshop.journey.liquidationToggle")}
        </label>
      </div>

      {recommendation ? (
        <section className="min-w-0 space-y-3">          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("workshop.journey.squeezeHeading")}
          </p>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 overflow-x-hidden rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t("workshop.journey.donutCurrent")}
              </p>
              <WorkshopAllocationDonut
                slices={recommendation.currentAllocation}
                size="compact"
                highlightChanged={false}
                centerLabel={t("workshop.journey.donutOutflow")}
                centerValue={formatCompactHkd(
                  monthlyOutflowTotal(recommendation.currentAllocation),
                )}
              />
            </div>
            <div className="min-w-0 overflow-x-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5">
              <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                {t("workshop.journey.donutRecommended")}
              </p>
              <WorkshopAllocationDonut
                slices={recommendation.recommendedAllocation}
                size="compact"
                highlightChanged
                centerLabel={t("workshop.journey.donutOutflow")}
                centerValue={formatCompactHkd(
                  monthlyOutflowTotal(recommendation.recommendedAllocation),
                )}
              />
            </div>
          </div>

          <WorkshopErrorBoundary
            title={t("workshop.journey.reasoningErrorTitle")}
            description={t("workshop.journey.reasoningError")}
          >
            {reasoningError ? (
              <WorkshopRetryPanel
                title={t("workshop.journey.reasoningErrorTitle")}
                message={reasoningError}
                onRetry={() => setReasoningRetry((n) => n + 1)}
              />
            ) : (
              <CollapsibleWidget
                title={t("workshop.ui.showDetails")}
                defaultExpanded={false}
              >
                <p className="text-sm leading-relaxed text-slate-700">
                  {recommendation.reasoning.en.trim() ||
                  recommendation.reasoning.zhHant.trim()
                    ? pickBilingual(recommendation.reasoning, locale)
                    : t("workshop.journey.reasoningLoading")}
                </p>
              </CollapsibleWidget>
            )}
          </WorkshopErrorBoundary>

          <button
            type="button"
            className={[
              "inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border px-3.5 text-sm font-semibold transition-colors sm:w-auto",
              acceptedSqueeze
                ? "border-emerald-500 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
            ].join(" ")}
            onClick={() => setAcceptedSqueeze((prev) => !prev)}
            aria-pressed={acceptedSqueeze}
          >
            {acceptedSqueeze
              ? t("workshop.journey.undoSqueeze")
              : t("workshop.journey.acceptSqueeze")}
          </button>
        </section>
      ) : (
        <p
          className={[
            "rounded-xl border px-3.5 py-3 text-sm leading-snug",
            allowLiquidation
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-600",
          ].join(" ")}
          data-testid="workshop-journey-no-squeeze-note"
        >
          {allowLiquidation
            ? t("workshop.journey.noSqueezeLiquidation")
            : t("workshop.journey.noSqueezeOnTrack")}
        </p>
      )}

      {decisionError ? (
        <p className="text-sm text-rose-700" role="alert">
          {decisionError}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-900 disabled:opacity-60"
          disabled={isDeciding}
          onClick={() => submitDecision("applied")}
        >
          {t("workshop.journey.applyGoal")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 disabled:opacity-60"
          disabled={isDeciding}
          onClick={() => submitDecision("given_up")}
        >
          {t("workshop.journey.giveUpGoal")}
        </button>
      </div>
    </div>
  );
}
