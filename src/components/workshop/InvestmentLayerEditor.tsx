"use client";

import { Rocket } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopRangeSlider, {
  type WorkshopRangeAccent,
} from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { getRiskAllocationBenchmark } from "@/lib/workshop/pyramid-benchmarks";
import {
  redistributeRiskAllocation,
  type RiskAllocationKey,
} from "@/lib/workshop/risk-allocation";
import type {
  Bilingual,
  InvestmentLayer,
  LayerFlag,
} from "@/lib/workshop/types";

/** Primary mobile control — 44px hit target (fits ± field row at 360px). */
const nudgeBtnClass =
  "inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:bg-slate-100";

/** Coarse steps — prefer usable touch over 1% drag precision. */
const RISK_STEP = 5;

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

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

const RISK_SLIDERS: Array<{
  key: RiskAllocationKey;
  labelKey: MessageKey;
  bandHintKey: MessageKey;
  accent: WorkshopRangeAccent;
  bar: string;
}> = [
  {
    key: "low",
    labelKey: "workshop.pyramid.investment.lowLabel",
    bandHintKey: "workshop.pyramid.investment.lowBandHint",
    accent: "sky",
    bar: "bg-sky-400",
  },
  {
    key: "mid",
    labelKey: "workshop.pyramid.investment.midLabel",
    bandHintKey: "workshop.pyramid.investment.midBandHint",
    accent: "amber",
    bar: "bg-amber-400",
  },
  {
    key: "high",
    labelKey: "workshop.pyramid.investment.highLabel",
    bandHintKey: "workshop.pyramid.investment.highBandHint",
    accent: "emerald",
    bar: "bg-emerald-500",
  },
];

type InvestmentLayerEditorProps = Readonly<{
  value: InvestmentLayer;
  onChange: (next: InvestmentLayer) => void;
  age: number;
  /** Gross monthly income — enables surplus helper / amber warning. */
  monthlyIncomeHKD?: number;
  /**
   * Confirmed monthly expenses total. When omitted, surplus helper line is hidden
   * (pyramid step runs before expenses are confirmed).
   */
  monthlyExpensesHKD?: number;
  status?: LayerFlag;
  rationale?: Bilingual | string;
  disabled?: boolean;
}>;

function patchInvestment(
  value: InvestmentLayer,
  patch: Partial<InvestmentLayer>,
): InvestmentLayer {
  return {
    riskAllocation: patch.riskAllocation ?? value.riskAllocation,
    lumpSumHKD: patch.lumpSumHKD ?? value.lumpSumHKD,
    monthlyInvestmentHKD:
      patch.monthlyInvestmentHKD ?? value.monthlyInvestmentHKD,
    monthlyFunHKD: patch.monthlyFunHKD ?? value.monthlyFunHKD,
  };
}

export default function InvestmentLayerEditor({
  value,
  onChange,
  age,
  monthlyIncomeHKD,
  monthlyExpensesHKD,
  status,
  rationale,
  disabled = false,
}: InvestmentLayerEditorProps) {
  const { t, locale } = useTranslations();
  const benchmark = getRiskAllocationBenchmark(age);
  const risk = value.riskAllocation;

  const expensesConfirmed =
    monthlyExpensesHKD != null && Number.isFinite(monthlyExpensesHKD);
  const availableSurplus =
    monthlyIncomeHKD != null &&
    Number.isFinite(monthlyIncomeHKD) &&
    expensesConfirmed
      ? Math.round(
          Math.max(0, monthlyIncomeHKD) -
            Math.max(0, monthlyExpensesHKD) -
            Math.max(0, value.monthlyFunHKD),
        )
      : null;
  const overSurplus =
    availableSurplus != null && value.monthlyInvestmentHKD > availableSurplus;

  function updateRisk(key: RiskAllocationKey, nextValue: number) {
    onChange(
      patchInvestment(value, {
        riskAllocation: redistributeRiskAllocation(risk, key, nextValue),
      }),
    );
  }

  function nudgeRisk(key: RiskAllocationKey, delta: number) {
    updateRisk(key, risk[key] + delta);
  }

  const summaryValue = t("workshop.pyramid.investment.lumpSumSummary").replace(
    "{amount}",
    formatHkd(value.lumpSumHKD),
  );
  const rationaleText =
    rationale == null || rationale === ""
      ? ""
      : pickBilingual(rationale, locale);

  return (
    <CollapsibleWidget
      icon={
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          <Rocket className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      title={t("workshop.pyramid.layers.investment.title")}
      subtitle={summaryValue}
      badge={
        status ? (
          <span
            className={[
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              FLAG_PILL[status],
            ].join(" ")}
          >
            {t(FLAG_LABEL_KEYS[status])}
          </span>
        ) : null
      }
      defaultExpanded={status !== "green"}
    >
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-slate-600">
          {t("workshop.pyramid.investment.funBudgetLine")
            .replace("{fun}", formatHkd(value.monthlyFunHKD))
            .replace("{low}", String(risk.low))
            .replace("{mid}", String(risk.mid))
            .replace("{high}", String(risk.high))}
        </p>

        {rationaleText ? (
          <p className="text-pretty text-sm leading-relaxed text-slate-600">
            {rationaleText}
          </p>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 sm:px-4">
          <WorkshopNumberField
            id="workshop-monthly-investing"
            variant="currency"
            label={t("workshop.pyramid.investment.monthlyInvesting.label")}
            min={0}
            disabled={disabled}
            value={value.monthlyInvestmentHKD}
            enterKeyHint="next"
            onChange={(monthlyInvestmentHKD) =>
              onChange(patchInvestment(value, { monthlyInvestmentHKD }))
            }
          />
          {availableSurplus != null ? (
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              {t("workshop.pyramid.investment.monthlyInvesting.helper").replace(
                "{amount}",
                formatHkd(availableSurplus),
              )}
            </p>
          ) : null}
          {overSurplus ? (
            <p className="mt-1.5 text-[11px] leading-snug text-amber-800">
              {t("workshop.pyramid.investment.monthlyInvesting.amberWarning")}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 sm:px-4">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {t("workshop.pyramid.investment.riskHeading")}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {t("workshop.pyramid.investment.riskHint")
                .replace("{step}", String(RISK_STEP))
                .replace("{low}", String(benchmark.low))
                .replace("{mid}", String(benchmark.mid))
                .replace("{high}", String(benchmark.high))}
            </p>
          </div>

          <div
            className="flex h-3 overflow-hidden rounded-full bg-slate-200"
            aria-hidden="true"
          >
            {RISK_SLIDERS.map((slider) => (
              <div
                key={slider.key}
                className={slider.bar}
                style={{ width: `${risk[slider.key]}%` }}
              />
            ))}
          </div>

          <div className="space-y-5">
            {RISK_SLIDERS.map((slider) => {
              const label = t(slider.labelKey);
              return (
                <div key={slider.key} className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                      {t("workshop.pyramid.investment.recShort").replace(
                        "{n}",
                        String(benchmark[slider.key]),
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-1.5 max-[399px]:gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      className={nudgeBtnClass}
                      disabled={disabled || risk[slider.key] <= 0}
                      aria-label={t(
                        "workshop.pyramid.investment.decreaseAria",
                      )
                        .replace("{label}", label)
                        .replace("{step}", String(RISK_STEP))}
                      onClick={() => nudgeRisk(slider.key, -RISK_STEP)}
                    >
                      −
                    </button>

                    <div className="hidden min-w-0 flex-1 min-[400px]:block">
                      <WorkshopRangeSlider
                        id={`workshop-risk-${slider.key}-slider`}
                        min={0}
                        max={100}
                        step={RISK_STEP}
                        disabled={disabled}
                        accent={slider.accent}
                        value={risk[slider.key]}
                        aria-label={label}
                        aria-valuetext={`${risk[slider.key]} percent`}
                        onChange={(next) => updateRisk(slider.key, next)}
                      />
                    </div>

                    <div className="min-w-0 flex-1 basis-0 min-[400px]:hidden">
                      <WorkshopNumberField
                        id={`workshop-risk-${slider.key}`}
                        variant="percent"
                        min={0}
                        max={100}
                        disabled={disabled}
                        value={risk[slider.key]}
                        enterKeyHint="next"
                        aria-label={label}
                        onChange={(next) => updateRisk(slider.key, next)}
                      />
                    </div>

                    <button
                      type="button"
                      className={nudgeBtnClass}
                      disabled={disabled || risk[slider.key] >= 100}
                      aria-label={t(
                        "workshop.pyramid.investment.increaseAria",
                      )
                        .replace("{label}", label)
                        .replace("{step}", String(RISK_STEP))}
                      onClick={() => nudgeRisk(slider.key, RISK_STEP)}
                    >
                      +
                    </button>
                  </div>

                  <p className="mt-1 hidden text-right font-mono text-sm tabular-nums text-emerald-700 min-[400px]:block">
                    {risk[slider.key]}%
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    {t(slider.bandHintKey)}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500">
            {t("workshop.pyramid.investment.returnBandsDisclaimer")}
          </p>

          <p className="font-mono text-[11px] tabular-nums text-slate-500">
            {t("workshop.pyramid.investment.total").replace(
              "{n}",
              String(risk.low + risk.mid + risk.high),
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <WorkshopStatCard
              icon="Rocket"
              label={t("workshop.pyramid.investment.investCardLabel")}
              value={formatHkd(value.lumpSumHKD)}
              subtext={t("workshop.pyramid.investment.investSubtext")}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 sm:px-4">
              <WorkshopNumberField
                id="workshop-lump-sum"
                variant="currency"
                label={t("workshop.pyramid.investment.lumpSumLabel")}
                min={0}
                disabled={disabled}
                value={value.lumpSumHKD}
                enterKeyHint="next"
                onChange={(lumpSumHKD) =>
                  onChange(patchInvestment(value, { lumpSumHKD }))
                }
              />
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <WorkshopStatCard
              icon="PartyPopper"
              label={t("workshop.pyramid.investment.funCardLabel")}
              value={formatHkd(value.monthlyFunHKD)}
              subtext={t("workshop.pyramid.investment.funSubtext")}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 sm:px-4">
              <WorkshopNumberField
                id="workshop-monthly-fun"
                variant="currency"
                label={t("workshop.pyramid.investment.monthlyFunLabel")}
                min={0}
                disabled={disabled}
                value={value.monthlyFunHKD}
                enterKeyHint="done"
                onChange={(monthlyFunHKD) =>
                  onChange(patchInvestment(value, { monthlyFunHKD }))
                }
              />
              <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                {t("workshop.pyramid.investment.funCrisisHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleWidget>
  );
}
