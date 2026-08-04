"use client";

import { PiggyBank } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
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
  const { t, locale } = useTranslations();
  const targetMonths = getEmergencyFundTargetMonths(industry);
  const estimatedMonthlyExpenses =
    Math.max(0, monthlyIncomeHKD) * PLACEHOLDER_EXPENSE_RATIO;
  const recommendedHKD = Math.round(targetMonths * estimatedMonthlyExpenses);

  const recommendedLine = t("workshop.pyramid.emergencyFund.recommendedMonths")
    .replace("{months}", String(targetMonths))
    .replace("{amount}", formatHkd(recommendedHKD));
  const placeholderHint = t(
    "workshop.pyramid.emergencyFund.placeholderHint",
  ).replace("{percent}", String(Math.round(PLACEHOLDER_EXPENSE_RATIO * 100)));
  const rationaleText =
    rationale == null || rationale === ""
      ? ""
      : pickBilingual(rationale, locale);

  return (
    <CollapsibleWidget
      icon={
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          <PiggyBank className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      title={t("workshop.pyramid.layers.emergencyFund.title")}
      subtitle={formatHkd(value.savedAmountHKD)}
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
      <div className="space-y-4">
        {rationaleText ? (
          <p className="text-pretty text-sm leading-relaxed text-slate-600">
            {rationaleText}
          </p>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3.5 sm:px-4">
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
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            {recommendedLine}
            <span className="block text-slate-400">{placeholderHint}</span>
          </p>
        </div>
      </div>
    </CollapsibleWidget>
  );
}
