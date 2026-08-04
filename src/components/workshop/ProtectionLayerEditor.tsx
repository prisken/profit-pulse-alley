"use client";

import { Calculator, Shield } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import {
  getMedicalCoverageBenchmarkPercent,
  type CriticalIllnessBreakdown,
} from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  LayerFlag,
  ProtectionLayer,
} from "@/lib/workshop/types";

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatMultiple(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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

type ProtectionLayerEditorProps = Readonly<{
  value: ProtectionLayer;
  onChange: (next: ProtectionLayer) => void;
  age: number;
  monthlyIncomeHKD: number;
  ciBreakdown: CriticalIllnessBreakdown;
  explanation: Bilingual;
  status?: LayerFlag;
  disabled?: boolean;
}>;

export default function ProtectionLayerEditor({
  value,
  onChange,
  age,
  monthlyIncomeHKD: _monthlyIncomeHKD,
  ciBreakdown,
  explanation,
  status,
  disabled = false,
}: ProtectionLayerEditorProps) {
  const { t, locale } = useTranslations();
  const medicalBenchmark = getMedicalCoverageBenchmarkPercent(age);

  const recommendedPrefix = t("workshop.pyramid.protection.recommendedPrefix");
  const summaryValue = `${Math.round(value.medicalCoveragePercent)}% · ${formatHkd(value.criticalIllnessAmountHKD)} CI`;
  const explanationText = pickBilingual(explanation, locale);
  const formulaText = t("workshop.pyramid.protection.ciFormula")
    .replace("{multiple}", formatMultiple(ciBreakdown.multiple))
    .replace("{annual}", formatHkd(ciBreakdown.annualIncomeHKD))
    .replace("{recommended}", formatHkd(ciBreakdown.recommendedHKD));

  return (
    <CollapsibleWidget
      icon={
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          <Shield className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      title={t("workshop.pyramid.layers.protection.title")}
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
      <div className="space-y-5">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 sm:px-4">
          <div>
            <WorkshopNumberField
              id="workshop-medical-coverage"
              variant="percent"
              label={t("workshop.pyramid.protection.medicalLabel")}
              min={0}
              max={100}
              disabled={disabled}
              value={Math.min(100, Math.max(0, value.medicalCoveragePercent))}
              enterKeyHint="next"
              onChange={(medicalCoveragePercent) =>
                onChange({
                  ...value,
                  medicalCoveragePercent,
                })
              }
            />
            <WorkshopRangeSlider
              id="workshop-medical-coverage-slider"
              min={0}
              max={100}
              step={5}
              disabled={disabled}
              value={Math.min(100, Math.max(0, value.medicalCoveragePercent))}
              aria-label={t("workshop.pyramid.protection.medicalLabel")}
              aria-valuetext={`${Math.round(value.medicalCoveragePercent)} percent`}
              onChange={(medicalCoveragePercent) =>
                onChange({
                  ...value,
                  medicalCoveragePercent,
                })
              }
              className="mt-2"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {recommendedPrefix} {medicalBenchmark}% ·{" "}
              {t("workshop.pyramid.protection.stepHint")}
            </p>
          </div>

          <div>
            <WorkshopNumberField
              id="workshop-critical-illness"
              variant="currency"
              label={t("workshop.pyramid.protection.criticalIllnessLabel")}
              min={0}
              disabled={disabled}
              value={value.criticalIllnessAmountHKD}
              enterKeyHint="done"
              onChange={(criticalIllnessAmountHKD) =>
                onChange({
                  ...value,
                  criticalIllnessAmountHKD,
                })
              }
              className="mt-0"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              {recommendedPrefix} {formatHkd(ciBreakdown.recommendedHKD)}
            </p>
          </div>
        </div>

        <CollapsibleWidget
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
              <Calculator className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
          }
          title={t("workshop.pyramid.calc.heading")}
          defaultExpanded={false}
          className="border-slate-200/90 shadow-none"
        >
          <div className="space-y-2">
            <p className="font-mono text-sm tabular-nums text-slate-800">
              {formulaText}
            </p>
            <p className="text-pretty text-sm leading-relaxed text-slate-600">
              {explanationText}
            </p>
          </div>
        </CollapsibleWidget>
      </div>
    </CollapsibleWidget>
  );
}
