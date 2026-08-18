"use client";

import { useMemo, useState, useTransition } from "react";

import EmergencyFundLayerEditor from "@/components/workshop/EmergencyFundLayerEditor";
import GoalsLayerEditor from "@/components/workshop/GoalsLayerEditor";
import InvestmentLayerEditor from "@/components/workshop/InvestmentLayerEditor";
import ProtectionLayerEditor from "@/components/workshop/ProtectionLayerEditor";
import { WorkshopRetryPanel } from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { confirmPyramidAction } from "@/lib/workshop/pyramid-actions";
import {
  computeLayerFlags,
  type PyramidBenchmarkSnapshot,
} from "@/lib/workshop/pyramid-benchmarks";
import type {
  Bilingual,
  LayerFlag,
  LayerFlags,
  PyramidState,
} from "@/lib/workshop/types";

const FLAG_BAR: Record<LayerFlag, string> = {
  green: "bg-emerald-500 text-white shadow-md shadow-emerald-500/25",
  amber: "bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30",
  red: "bg-rose-500 text-white shadow-md shadow-rose-500/25",
};

const BAND_LABEL_KEYS: Record<keyof LayerFlags, MessageKey> = {
  investment: "workshop.pyramid.band.investment",
  goals: "workshop.pyramid.band.goals",
  emergencyFund: "workshop.pyramid.band.emergencyFund",
  protection: "workshop.pyramid.band.protection",
};

function WorkshopPyramidGraphic({ flags }: { flags: LayerFlags }) {
  const { t } = useTranslations();
  const bands: Array<{
    key: keyof LayerFlags;
    width: string;
  }> = [
    { key: "investment", width: "48%" },
    { key: "goals", width: "62%" },
    { key: "emergencyFund", width: "76%" },
    { key: "protection", width: "92%" },
  ];

  return (
    <div
      className="min-w-0 overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white px-2.5 py-5 shadow-sm sm:px-6"
      aria-hidden="true"
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {t("workshop.pyramid.graphicTitle")}
      </p>
      <div className="mt-4 flex w-full min-w-0 flex-col items-center gap-2">
        {bands.map((band) => {
          const label = t(BAND_LABEL_KEYS[band.key]);
          return (
            <div
              key={band.key}
              className="flex w-full min-w-0 flex-col items-center"
              title={label}
            >
              <div
                className={[
                  "flex h-9 w-full max-w-full items-center justify-center overflow-hidden px-2 text-center text-[10px] font-semibold leading-tight tracking-normal sm:h-10 sm:px-3 sm:text-[11px]",
                  FLAG_BAR[flags[band.key]],
                ].join(" ")}
                style={{
                  width: band.width,
                  clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
                }}
              >
                <span className="block max-w-full truncate normal-case drop-shadow-sm">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type WorkshopPyramidStepProps = Readonly<{
  sessionId: string;
  pyramid: PyramidState;
  onChange: (next: PyramidState) => void;
  benchmarks: PyramidBenchmarkSnapshot;
  rationale: Bilingual | null;
  protectionExplanation: Bilingual;
  emergencyFundExplanation: Bilingual;
  age: number;
  monthlyIncomeHKD: number;
  industry: string;
  onBack: () => void;
  onContinue: () => void;
}>;

export default function WorkshopPyramidStep({
  sessionId,
  pyramid,
  onChange,
  benchmarks,
  rationale,
  protectionExplanation,
  emergencyFundExplanation,
  age,
  monthlyIncomeHKD,
  industry: _industry,
  onBack,
  onContinue,
}: WorkshopPyramidStepProps) {
  const { t } = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, startConfirmTransition] = useTransition();

  const layerFlags = useMemo(
    () => computeLayerFlags(pyramid, benchmarks),
    [pyramid, benchmarks],
  );

  function handleConfirm() {
    setError(null);
    startConfirmTransition(async () => {
      try {
        await confirmPyramidAction({
          sessionId,
          pyramid,
          rationale: rationale ?? undefined,
        });
        onContinue();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("workshop.pyramid.saveErrorFallback"),
        );
      }
    });
  }

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden sm:space-y-6">
      <p className="text-pretty text-sm leading-relaxed text-slate-600">
        {t("workshop.pyramid.intro")}
      </p>

      <WorkshopPyramidGraphic flags={layerFlags} />

      <div className="space-y-3">
        <ProtectionLayerEditor
          value={pyramid.protection}
          onChange={(protection) => onChange({ ...pyramid, protection })}
          age={age}
          monthlyIncomeHKD={monthlyIncomeHKD}
          ciBreakdown={benchmarks.ciBreakdown}
          explanation={protectionExplanation}
          status={layerFlags.protection}
          disabled={isConfirming}
        />
        <EmergencyFundLayerEditor
          value={pyramid.emergencyFund}
          onChange={(emergencyFund) => onChange({ ...pyramid, emergencyFund })}
          efBreakdown={benchmarks.efBreakdown}
          explanation={emergencyFundExplanation}
          status={layerFlags.emergencyFund}
          disabled={isConfirming}
        />

        <GoalsLayerEditor
          value={pyramid.goals}
          onChange={(goals) => onChange({ ...pyramid, goals })}
          userAge={age}
          status={layerFlags.goals}
          disabled={isConfirming}
        />

        <InvestmentLayerEditor
          value={pyramid.investment}
          onChange={(investment) => onChange({ ...pyramid, investment })}
          age={age}
          status={layerFlags.investment}
          disabled={isConfirming}
        />
      </div>

      {error ? (
        <WorkshopRetryPanel
          title={t("workshop.pyramid.saveErrorTitle")}
          message={error}
          onRetry={handleConfirm}
          onBack={onBack}
        />
      ) : (
        <WorkshopStickyFooter
          primaryLabel={
            isConfirming
              ? t("workshop.pyramid.saving")
              : t("workshop.pyramid.confirmButton")
          }
          primaryDisabled={isConfirming}
          onPrimaryClick={handleConfirm}
          secondaryLabel={t("workshop.errors.backButton")}
          secondaryDisabled={isConfirming}
          onSecondaryClick={onBack}
        />
      )}
    </div>
  );
}
