"use client";

import { useMemo, useState, useTransition } from "react";

import EmergencyFundLayerEditor from "@/components/workshop/EmergencyFundLayerEditor";
import GoalsLayerEditor from "@/components/workshop/GoalsLayerEditor";
import InvestmentLayerEditor from "@/components/workshop/InvestmentLayerEditor";
import ProtectionLayerEditor from "@/components/workshop/ProtectionLayerEditor";
import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
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

const FLAG_RING: Record<LayerFlag, string> = {
  green: "border-emerald-400/55 bg-emerald-400/15 text-emerald-200",
  amber: "border-amber-400/55 bg-amber-400/15 text-amber-200",
  red: "border-red-400/55 bg-red-400/15 text-red-200",
};

const FLAG_BAR: Record<LayerFlag, string> = {
  green: "bg-emerald-400/85",
  amber: "bg-amber-400/85",
  red: "bg-red-400/85",
};

const FLAG_LABEL_KEYS: Record<LayerFlag, MessageKey> = {
  green: "workshop.layerFlags.green",
  amber: "workshop.layerFlags.amber",
  red: "workshop.layerFlags.red",
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
      className="min-w-0 overflow-x-hidden rounded-2xl border border-white/10 bg-zinc-950/40 px-2.5 py-5 sm:px-6"
      aria-hidden="true"
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {t("workshop.pyramid.graphicTitle")}
      </p>
      <div className="mt-4 flex w-full min-w-0 flex-col items-center gap-1.5">
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
                  // CJK: avoid uppercase/wide tracking (widens glyphs / clips in trapezoid).
                  // English: slightly tighter letter-spacing on narrow bands.
                  "flex h-9 w-full max-w-full items-center justify-center overflow-hidden px-2 text-center text-[10px] font-semibold leading-tight tracking-normal text-zinc-950/80 sm:h-10 sm:px-3 sm:text-[11px]",
                  FLAG_BAR[flags[band.key]],
                ].join(" ")}
                style={{
                  width: band.width,
                  clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
                }}
              >
                <span className="block max-w-full truncate normal-case">
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

function LayerSectionHeader({
  icon,
  label,
  status,
}: {
  icon: string;
  label: string;
  status: LayerFlag;
}) {
  const { t } = useTranslations();
  return (
    <div className="mb-3 flex min-w-0 items-center gap-2.5">
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base",
          FLAG_RING[status],
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-balance text-sm font-semibold text-white sm:text-base">
          {label}
        </h3>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
          {t("workshop.pyramid.statusPrefix").replace(
            "{status}",
            t(FLAG_LABEL_KEYS[status]),
          )}
        </p>
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
  age,
  monthlyIncomeHKD,
  industry,
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
    <div className="min-w-0 overflow-x-hidden space-y-6 sm:space-y-7">
      <p className="text-pretty text-sm leading-relaxed text-zinc-400">
        {t("workshop.pyramid.intro")}
      </p>

      <WorkshopPyramidGraphic flags={layerFlags} />

      <section>
        <LayerSectionHeader
          icon="🛡️"
          label={t("workshop.pyramid.layers.protection.title")}
          status={layerFlags.protection}
        />
        <ProtectionLayerEditor
          value={pyramid.protection}
          onChange={(protection) => onChange({ ...pyramid, protection })}
          age={age}
          monthlyIncomeHKD={monthlyIncomeHKD}
          status={layerFlags.protection}
          rationale={rationale ?? undefined}
          disabled={isConfirming}
        />
      </section>

      <section>
        <LayerSectionHeader
          icon="🏦"
          label={t("workshop.pyramid.layers.emergencyFund.title")}
          status={layerFlags.emergencyFund}
        />
        <EmergencyFundLayerEditor
          value={pyramid.emergencyFund}
          onChange={(emergencyFund) => onChange({ ...pyramid, emergencyFund })}
          industry={industry}
          monthlyIncomeHKD={monthlyIncomeHKD}
          status={layerFlags.emergencyFund}
          disabled={isConfirming}
        />
      </section>

      <section>
        <LayerSectionHeader
          icon="🎯"
          label={t("workshop.pyramid.layers.goals.title")}
          status={layerFlags.goals}
        />
        <GoalsLayerEditor
          value={pyramid.goals}
          onChange={(goals) => onChange({ ...pyramid, goals })}
          status={layerFlags.goals}
          disabled={isConfirming}
        />
      </section>

      <section>
        <LayerSectionHeader
          icon="🚀"
          label={t("workshop.pyramid.layers.investment.title")}
          status={layerFlags.investment}
        />
        <InvestmentLayerEditor
          value={pyramid.investment}
          onChange={(investment) => onChange({ ...pyramid, investment })}
          age={age}
          status={layerFlags.investment}
          disabled={isConfirming}
        />
      </section>

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
