"use client";

import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopRangeSlider, {
  type WorkshopRangeAccent,
} from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
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
  "inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-xl font-semibold text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 active:bg-white/[0.1]";

/** Coarse steps — prefer usable touch over 1% drag precision. */
const RISK_STEP = 5;

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

const RISK_SLIDERS: Array<{
  key: RiskAllocationKey;
  labelKey: MessageKey;
  accent: WorkshopRangeAccent;
  bar: string;
}> = [
  {
    key: "low",
    labelKey: "workshop.pyramid.investment.lowLabel",
    accent: "sky",
    bar: "bg-sky-400",
  },
  {
    key: "mid",
    labelKey: "workshop.pyramid.investment.midLabel",
    accent: "amber",
    bar: "bg-amber-400",
  },
  {
    key: "high",
    labelKey: "workshop.pyramid.investment.highLabel",
    accent: "emerald",
    bar: "bg-emerald-400",
  },
];

type InvestmentLayerEditorProps = Readonly<{
  value: InvestmentLayer;
  onChange: (next: InvestmentLayer) => void;
  age: number;
  status?: LayerFlag;
  rationale?: Bilingual | string;
  disabled?: boolean;
}>;

export default function InvestmentLayerEditor({
  value,
  onChange,
  age,
  status,
  rationale,
  disabled = false,
}: InvestmentLayerEditorProps) {
  const { t } = useTranslations();
  const benchmark = getRiskAllocationBenchmark(age);
  const risk = value.riskAllocation;

  function updateRisk(key: RiskAllocationKey, nextValue: number) {
    onChange({
      ...value,
      riskAllocation: redistributeRiskAllocation(risk, key, nextValue),
    });
  }

  function nudgeRisk(key: RiskAllocationKey, delta: number) {
    updateRisk(key, risk[key] + delta);
  }

  return (
    <div className="min-w-0 space-y-3">
      <WorkshopStatCard
        icon="Rocket"
        status={status}
        label={t("workshop.pyramid.investment.cardLabel")}
        value={t("workshop.pyramid.investment.perMonth").replace(
          "{amount}",
          formatHkd(value.monthlyInvestmentHKD),
        )}
        subtext={t("workshop.pyramid.investment.funBudgetLine")
          .replace("{fun}", formatHkd(value.monthlyFunHKD))
          .replace("{low}", String(risk.low))
          .replace("{mid}", String(risk.mid))
          .replace("{high}", String(risk.high))}
        expandableText={rationale}
      />

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3.5 sm:px-4">
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {t("workshop.pyramid.investment.riskHeading")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            {t("workshop.pyramid.investment.riskHint")
              .replace("{step}", String(RISK_STEP))
              .replace("{low}", String(benchmark.low))
              .replace("{mid}", String(benchmark.mid))
              .replace("{high}", String(benchmark.high))}
          </p>
        </div>

        <div
          className="flex h-3 overflow-hidden rounded-full bg-white/10"
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
                  <p className="text-sm font-medium text-zinc-200">{label}</p>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-600">
                    {t("workshop.pyramid.investment.recShort").replace(
                      "{n}",
                      String(benchmark[slider.key]),
                    )}
                  </span>
                </div>

                {/*
                  <400px: ± nudges + percent field are primary (no fine slider).
                  ≥400px: keep slider between nudges for faster coarse drag.
                  All paths call updateRisk → redistributeRiskAllocation.
                */}
                <div className="mt-2 flex min-w-0 items-center gap-1.5 max-[399px]:gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    className={nudgeBtnClass}
                    disabled={disabled || risk[slider.key] <= 0}
                    aria-label={t("workshop.pyramid.investment.decreaseAria")
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
                    aria-label={t("workshop.pyramid.investment.increaseAria")
                      .replace("{label}", label)
                      .replace("{step}", String(RISK_STEP))}
                    onClick={() => nudgeRisk(slider.key, RISK_STEP)}
                  >
                    +
                  </button>
                </div>

                {/* Desktop: show live % next to slider (mobile field already shows it) */}
                <p className="mt-1 hidden text-right font-mono text-sm tabular-nums text-emerald-300 min-[400px]:block">
                  {risk[slider.key]}%
                </p>
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[11px] tabular-nums text-zinc-500">
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
            value={formatHkd(value.monthlyInvestmentHKD)}
            subtext={t("workshop.pyramid.investment.investSubtext")}
          />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3.5 sm:px-4">
            <WorkshopNumberField
              id="workshop-monthly-invest"
              variant="currency"
              label={t("workshop.pyramid.investment.monthlyInvestmentLabel")}
              min={0}
              disabled={disabled}
              value={value.monthlyInvestmentHKD}
              enterKeyHint="next"
              onChange={(monthlyInvestmentHKD) =>
                onChange({
                  ...value,
                  monthlyInvestmentHKD,
                })
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
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3.5 sm:px-4">
            <WorkshopNumberField
              id="workshop-monthly-fun"
              variant="currency"
              label={t("workshop.pyramid.investment.monthlyFunLabel")}
              min={0}
              disabled={disabled}
              value={value.monthlyFunHKD}
              enterKeyHint="done"
              onChange={(monthlyFunHKD) =>
                onChange({
                  ...value,
                  monthlyFunHKD,
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
