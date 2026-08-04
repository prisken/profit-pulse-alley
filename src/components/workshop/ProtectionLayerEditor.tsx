"use client";

import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  getCriticalIllnessBenchmarkHKD,
  getMedicalCoverageBenchmarkPercent,
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

type ProtectionLayerEditorProps = Readonly<{
  value: ProtectionLayer;
  onChange: (next: ProtectionLayer) => void;
  age: number;
  monthlyIncomeHKD: number;
  status?: LayerFlag;
  rationale?: Bilingual | string;
  disabled?: boolean;
}>;

export default function ProtectionLayerEditor({
  value,
  onChange,
  age,
  monthlyIncomeHKD,
  status,
  rationale,
  disabled = false,
}: ProtectionLayerEditorProps) {
  const { t } = useTranslations();
  const medicalBenchmark = getMedicalCoverageBenchmarkPercent(age);
  const ciBenchmark = getCriticalIllnessBenchmarkHKD(
    age,
    Math.max(0, monthlyIncomeHKD) * 12,
  );

  const recommendedPrefix = t("workshop.pyramid.protection.recommendedPrefix");
  const summaryValue = `${Math.round(value.medicalCoveragePercent)}% · ${formatHkd(value.criticalIllnessAmountHKD)} CI`;

  return (
    <div className="min-w-0 space-y-3">
      <WorkshopStatCard
        icon="Shield"
        status={status}
        label={t("workshop.pyramid.protection.cardLabel")}
        value={summaryValue}
        subtext={`${recommendedPrefix} ${medicalBenchmark}% · ${formatHkd(ciBenchmark)}`}
        expandableText={rationale}
      />

      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3.5 sm:px-4">
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
          <p className="mt-1 text-[11px] text-zinc-500">
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
          <p className="mt-1.5 text-[11px] text-zinc-500">
            {recommendedPrefix} {formatHkd(ciBenchmark)}
          </p>
        </div>
      </div>
    </div>
  );
}
