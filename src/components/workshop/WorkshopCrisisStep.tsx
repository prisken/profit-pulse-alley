"use client";

import { useEffect, useState } from "react";

import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { generateCrisisAction } from "@/lib/workshop/pyramid-actions";
import { getToneUiTheme } from "@/lib/workshop/tone";
import type {
  CrisisImpact,
  CrisisImpactResult,
  CrisisState,
  CrisisType,
  ExpensesState,
  PyramidState,
  RiskProfile,
  WorkshopTone,
} from "@/lib/workshop/types";

const RISK_PROFILE_LABEL_KEYS: Record<RiskProfile, MessageKey> = {
  conservative: "workshop.riskProfile.labels.conservative",
  balanced: "workshop.riskProfile.labels.balanced",
  aggressive: "workshop.riskProfile.labels.aggressive",
};

const CRISIS_TYPE_KEYS: Record<CrisisType, MessageKey> = {
  medical: "workshop.crisis.types.medical",
  critical_illness: "workshop.crisis.types.critical_illness",
  job_loss: "workshop.crisis.types.job_loss",
  market_crash: "workshop.crisis.types.market_crash",
  accident: "workshop.crisis.types.accident",
  family: "workshop.crisis.types.family",
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
  tone,
  riskProfile,
  onBack,
  onContinue,
  onResolved,
}: WorkshopCrisisStepProps) {
  const { t, locale } = useTranslations();
  const toneTheme = getToneUiTheme(tone);
  const [crisis, setCrisis] = useState<CrisisState | null>(null);
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

      try {
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
    tone,
    riskProfile,
    retryToken,
  ]);

  function impactValue(impact: CrisisImpact): string {
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
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-800">
          {t("workshop.crisis.loading").replace("{profile}", profileLabel)}
        </p>
        <p className="text-xs text-slate-500">
          {t("workshop.crisis.loadingSubtext")}
        </p>
      </div>
    );
  }

  const showFunEmojis = tone === "fun";
  const isDirect = tone === "direct";
  const engine: CrisisImpactResult | undefined = crisis.impactResult;
  const coverage = engine?.coverage ?? null;
  const meaningfulCover =
    coverage != null &&
    coverage.grossCostHKD > 0 &&
    coverage.coveredHKD / coverage.grossCostHKD >= 0.25;

  const incomeHit =
    crisis.incomeHitPct ?? crisis.monthlyIncomeImpactPercent ?? 0;
  const showMarketDrop =
    crisis.crisisType === "market_crash" &&
    (crisis.marketDropPct != null || (engine?.marketDropHKD ?? 0) > 0);

  const delayedGoals = engine?.goalDelays ?? [];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <article
        className={[
          "overflow-hidden rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6",
          toneTheme.cardAccentClass,
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={toneTheme.badgeClass}>
            <span className="mr-1" aria-hidden="true">
              {toneTheme.iconEmoji}
            </span>
            {t("workshop.crisis.badge").replace("{profile}", profileLabel)}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {t(CRISIS_TYPE_KEYS[crisis.crisisType])}
          </span>
          {showFunEmojis ? (
            <span className="text-lg" aria-hidden="true">
              💥 🚨 🎯 ⚡ 🔥
            </span>
          ) : null}
        </div>
        <h3
          className={[
            "mt-3 text-balance text-xl tracking-tight sm:text-2xl",
            toneTheme.headingStyle,
            isDirect ? "uppercase" : "",
          ].join(" ")}
        >
          {showFunEmojis ? (
            <span className="mr-1.5" aria-hidden="true">
              😱
            </span>
          ) : null}
          {pickBilingual(crisis.title, locale)}
          {showFunEmojis ? (
            <span className="ml-1.5" aria-hidden="true">
              🎢
            </span>
          ) : null}
        </h3>
        <p
          className={[
            "mt-3 text-sm leading-relaxed text-slate-700",
            isDirect ? "font-medium" : "",
          ].join(" ")}
        >
          {pickBilingual(crisis.description, locale)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-1.5 text-center text-[10px] text-slate-500 sm:grid-cols-4 sm:gap-2 sm:text-[11px]">
          <div className="min-w-0 rounded-xl border border-rose-200 bg-white/80 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.incomeHit")}</dt>
            <dd
              className={[
                "mt-1 break-words font-mono text-xs text-rose-700 sm:text-sm",
                isDirect ? "font-bold uppercase" : "",
              ].join(" ")}
            >
              −{incomeHit}%
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-rose-200 bg-white/80 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.oneTime")}</dt>
            <dd
              className={[
                "mt-1 break-words font-mono text-xs text-rose-700 sm:text-sm",
                isDirect ? "font-bold uppercase" : "",
              ].join(" ")}
            >
              {formatHkd(crisis.oneTimeCostHKD)}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-rose-200 bg-white/80 px-1.5 py-2 sm:px-2">
            <dt>{t("workshop.crisis.duration")}</dt>
            <dd
              className={[
                "mt-1 break-words font-mono text-xs text-rose-700 sm:text-sm",
                isDirect ? "font-bold uppercase" : "",
              ].join(" ")}
            >
              {t("workshop.crisis.durationMonths").replace(
                "{n}",
                String(crisis.durationMonths),
              )}
            </dd>
          </div>
          {showMarketDrop ? (
            <div className="min-w-0 rounded-xl border border-rose-200 bg-white/80 px-1.5 py-2 sm:px-2">
              <dt>{t("workshop.crisis.marketDrop")}</dt>
              <dd
                className={[
                  "mt-1 break-words font-mono text-xs text-rose-700 sm:text-sm",
                  isDirect ? "font-bold uppercase" : "",
                ].join(" ")}
              >
                −{crisis.marketDropPct ?? 0}%
              </dd>
            </div>
          ) : (
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white/60 px-1.5 py-2 sm:px-2">
              <dt>{t("workshop.crisis.typeLabel")}</dt>
              <dd className="mt-1 text-xs font-medium text-slate-700 sm:text-sm">
                {t(CRISIS_TYPE_KEYS[crisis.crisisType])}
              </dd>
            </div>
          )}
        </dl>
      </article>

      {coverage && coverage.grossCostHKD > 0 ? (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("workshop.crisis.sectionCoverage")}
          </h4>
          <WorkshopStatCard
            icon={meaningfulCover ? "ShieldCheck" : "ShieldOff"}
            status={meaningfulCover ? "green" : "red"}
            className={
              meaningfulCover
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                : "border-rose-200 bg-rose-50/60 text-rose-900"
            }
            label={t("workshop.crisis.coverageOffsetTitle")}
            value={t("workshop.crisis.coverageOffsetValue")
              .replace("{covered}", formatHkd(coverage.coveredHKD))
              .replace("{gross}", formatHkd(coverage.grossCostHKD))}
            expandableText={t("workshop.crisis.coverageOffsetDetail")
              .replace("{uncovered}", formatHkd(coverage.uncoveredHKD))
              .replace(
                "{kind}",
                coverage.coverageKind === "critical_illness"
                  ? t("workshop.crisis.coverageKind.ci")
                  : coverage.coverageKind === "medical_percent"
                    ? t("workshop.crisis.coverageKind.medical").replace(
                        "{pct}",
                        String(coverage.medicalCoveragePercent ?? 0),
                      )
                    : t("workshop.crisis.coverageKind.none"),
              )}
            defaultExpanded
          />
        </section>
      ) : null}

      {engine ? (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("workshop.crisis.sectionCutOrder")}
          </h4>
          {engine.cutOrder.funAbsorbedHKD > 0 ? (
            <WorkshopStatCard
              icon="Sparkles"
              status="amber"
              label={t("workshop.crisis.cut.fun")}
              value={t("workshop.crisis.cut.funValue").replace(
                "{amount}",
                formatHkd(engine.cutOrder.funAbsorbedHKD),
              )}
              defaultExpanded
            />
          ) : null}
          {engine.cutOrder.discretionaryAbsorbedHKD > 0 ? (
            <WorkshopStatCard
              icon="ShoppingBag"
              status="amber"
              label={t("workshop.crisis.cut.discretionary")}
              value={formatHkd(engine.cutOrder.discretionaryAbsorbedHKD)}
              defaultExpanded
            />
          ) : null}
          {engine.cutOrder.liquidAbsorbedHKD > 0 ? (
            <WorkshopStatCard
              icon="PiggyBank"
              status="red"
              className="border-rose-200 bg-rose-50/60 text-rose-900"
              label={t("workshop.crisis.cut.liquid")}
              value={formatHkd(engine.cutOrder.liquidAbsorbedHKD)}
              defaultExpanded
            />
          ) : null}
          {engine.marketDropHKD > 0 ? (
            <WorkshopStatCard
              icon="TrendingDown"
              status="red"
              className="border-rose-200 bg-rose-50/60 text-rose-900"
              label={t("workshop.crisis.cut.market")}
              value={formatHkd(engine.marketDropHKD)}
              defaultExpanded
            />
          ) : null}
          {engine.cutOrder.investedAbsorbedHKD > 0 ? (
            <WorkshopStatCard
              icon="Landmark"
              status="red"
              className="border-rose-200 bg-rose-50/60 text-rose-900"
              label={t("workshop.crisis.cut.invested")}
              value={formatHkd(engine.cutOrder.investedAbsorbedHKD)}
              defaultExpanded
            />
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("workshop.crisis.layerImpacts")}
        </h4>
        {crisis.impacts
          .filter((impact) => impact.stageId !== "coverage")
          .map((impact, index) => (
            <WorkshopStatCard
              key={`${impact.layer}-${impact.stageId ?? index}`}
              icon={impact.icon}
              status="red"
              className="border-rose-200 bg-rose-50/60 text-rose-900"
              label={pickBilingual(impact.headline, locale)}
              value={impactValue(impact)}
              expandableText={t("workshop.crisis.hitsLayer").replace(
                "{layer}",
                t(LAYER_LABEL_KEYS[impact.layer]),
              )}
              defaultExpanded
            />
          ))}
      </section>

      {delayedGoals.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-3.5 py-4 shadow-sm sm:px-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("workshop.crisis.goalsUnderCrisisHeading")}
          </h4>
          <ul className="mt-3 space-y-2.5">
            {delayedGoals.map((goal) => (
              <li
                key={goal.goalId}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-slate-800">
                  {pickBilingual(goal.label, locale)}
                </span>
                <span className="shrink-0 font-mono text-xs text-slate-500">
                  {goal.beforeAge != null
                    ? t("workshop.crisis.goalAge").replace(
                        "{age}",
                        String(goal.beforeAge),
                      )
                    : "—"}{" "}
                  →{" "}
                  <span className="font-semibold text-rose-700">
                    {goal.afterAge != null
                      ? t("workshop.crisis.goalAge").replace(
                          "{age}",
                          String(goal.afterAge),
                        )
                      : t("workshop.crisis.arrowNotReached")}
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
