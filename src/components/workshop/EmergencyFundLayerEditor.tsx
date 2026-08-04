"use client";

import { Calculator, PiggyBank } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import {
  BENCHMARK_EXPENSE_RATIO,
  type EmergencyFundBreakdown,
} from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  EmergencyFundLayer,
  LayerFlag,
} from "@/lib/workshop/types";

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
  efBreakdown: EmergencyFundBreakdown;
  explanation: Bilingual;
  status?: LayerFlag;
  disabled?: boolean;
}>;

export default function EmergencyFundLayerEditor({
  value,
  onChange,
  efBreakdown,
  explanation,
  status,
  disabled = false,
}: EmergencyFundLayerEditorProps) {
  const { t, locale } = useTranslations();
  const monthlyBurn = Math.round(
    efBreakdown.monthlyIncomeHKD * BENCHMARK_EXPENSE_RATIO,
  );

  const recommendedLine = t("workshop.pyramid.emergencyFund.recommendedMonths")
    .replace("{months}", String(efBreakdown.targetMonths))
    .replace("{amount}", formatHkd(efBreakdown.recommendedHKD));
  const explanationText = pickBilingual(explanation, locale);
  const formulaText = t("workshop.pyramid.emergencyFund.efFormula")
    .replace("{months}", String(efBreakdown.targetMonths))
    .replace("{burn}", formatHkd(monthlyBurn))
    .replace("{recommended}", formatHkd(efBreakdown.recommendedHKD));

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
          </p>
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
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t("workshop.pyramid.emergencyFund.efFormulaNote")}
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
