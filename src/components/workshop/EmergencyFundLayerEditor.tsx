"use client";

import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { getEmergencyFundTargetMonths } from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  EmergencyFundLayer,
  LayerFlag,
} from "@/lib/workshop/types";

/** Placeholder expense ratio until the expenses step exists. */
const PLACEHOLDER_EXPENSE_RATIO = 0.6;

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

type EmergencyFundLayerEditorProps = Readonly<{
  value: EmergencyFundLayer;
  onChange: (next: EmergencyFundLayer) => void;
  industry: string;
  monthlyIncomeHKD: number;
  status?: LayerFlag;
  rationale?: Bilingual | string;
  disabled?: boolean;
}>;

export default function EmergencyFundLayerEditor({
  value,
  onChange,
  industry,
  monthlyIncomeHKD,
  status,
  rationale,
  disabled = false,
}: EmergencyFundLayerEditorProps) {
  const { t } = useTranslations();
  const targetMonths = getEmergencyFundTargetMonths(industry);
  const estimatedMonthlyExpenses =
    Math.max(0, monthlyIncomeHKD) * PLACEHOLDER_EXPENSE_RATIO;
  const recommendedHKD = Math.round(targetMonths * estimatedMonthlyExpenses);

  const recommendedLine = t("workshop.pyramid.emergencyFund.recommendedMonths")
    .replace("{months}", String(targetMonths))
    .replace("{amount}", formatHkd(recommendedHKD));
  const placeholderHint = t("workshop.pyramid.emergencyFund.placeholderHint").replace(
    "{percent}",
    String(Math.round(PLACEHOLDER_EXPENSE_RATIO * 100)),
  );

  return (
    <div className="min-w-0 space-y-3">
      <WorkshopStatCard
        icon="PiggyBank"
        status={status}
        label={t("workshop.pyramid.emergencyFund.cardLabel")}
        value={formatHkd(value.savedAmountHKD)}
        subtext={recommendedLine}
        expandableText={rationale}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-3.5 sm:px-4">
        <WorkshopNumberField
          id="workshop-emergency-saved"
          variant="currency"
          label={t("workshop.pyramid.emergencyFund.savedLabel")}
          min={0}
          disabled={disabled}
          value={value.savedAmountHKD}
          enterKeyHint="done"
          onChange={(savedAmountHKD) => onChange({ savedAmountHKD })}
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
          {recommendedLine}
          <span className="block text-zinc-600">{placeholderHint}</span>
        </p>
      </div>
    </div>
  );
}
