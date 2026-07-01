"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarOff, Loader2 } from "lucide-react";

import DecisionLockedCard, {
  type DecisionLockedCardContext,
} from "@/components/market-pulse/DecisionLockedCard";
import {
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MarketPulseSwipeCardData, MarketPulseSwipeSubmitResult } from "@/lib/market-pulse/types";

const springEntrance = { type: "spring" as const, stiffness: 300, damping: 28 };

type CardPhase = "idle" | "submitting" | "locked";

export type MarketPulseRestCardProps = {
  card: MarketPulseSwipeCardData;
  onClaim: () => Promise<MarketPulseSwipeSubmitResult>;
  initialAcknowledged?: boolean;
  disabled?: boolean;
  showClaimButton?: boolean;
  lockedCycleContext?: DecisionLockedCardContext;
  className?: string;
};

export default function MarketPulseRestCard({
  card,
  onClaim,
  initialAcknowledged = false,
  disabled = false,
  showClaimButton = true,
  lockedCycleContext,
  className = "",
}: MarketPulseRestCardProps) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const submittingRef = useRef(false);
  const [phase, setPhase] = useState<CardPhase>(
    initialAcknowledged ? "locked" : "idle",
  );

  const submitClaim = useCallback(async () => {
    if (disabled || submittingRef.current || phase === "locked") {
      return;
    }

    submittingRef.current = true;
    setPhase("submitting");

    const result = await onClaim();

    submittingRef.current = false;

    if (result.ok) {
      setPhase("locked");
      return;
    }

    setPhase("idle");
  }, [disabled, onClaim, phase]);

  const bodyText = card.newsBody?.trim() || card.summary?.trim() || null;
  const interactionsDisabled = disabled || phase === "submitting" || phase === "locked";

  if (phase === "locked") {
    return (
      <div className={mergeMpClasses("mx-auto w-full max-w-md overflow-x-hidden", className)}>
        <p className="sr-only" role="status" aria-live="polite">
          {t("mp.rest.success.locked")}
        </p>
        <DecisionLockedCard
          decision="ACKNOWLEDGED"
          cycleContext={lockedCycleContext}
        />
      </div>
    );
  }

  return (
    <div
      className={mergeMpClasses(
        "mx-auto flex w-full min-h-0 max-w-md flex-col overflow-x-hidden",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <motion.article
          key={card.id}
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: 0.15 } : springEntrance}
          className={mergeMpClasses(
            "relative flex min-h-0 max-h-[min(72dvh,calc(100dvh-11rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-b from-zinc-950 via-black to-black p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:max-h-[min(82dvh,44rem)] sm:p-5",
            disabled ? "opacity-90" : "",
            phase === "submitting" ? "pointer-events-none opacity-80" : "",
          )}
          aria-labelledby={`rest-card-headline-${card.id}`}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-sky-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200 sm:text-xs">
              <CalendarOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("mp.rest.badge")}
            </div>

            <h2
              id={`rest-card-headline-${card.id}`}
              className="text-balance text-lg font-semibold leading-snug text-white sm:text-xl"
            >
              {card.headline}
            </h2>

            {bodyText ? (
              <p className="text-sm leading-relaxed text-zinc-300 sm:text-[15px]">{bodyText}</p>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                {t("mp.rest.noSignalToday")}
              </p>
            )}

            <p className="text-xs leading-relaxed text-zinc-500 sm:text-sm">
              {t("mp.rest.participationOnlyNote")}
            </p>
            <p className="text-xs leading-relaxed text-zinc-500 sm:text-sm">
              {t("mp.rest.noPredictionRequired")}
            </p>
          </div>

          {showClaimButton ? (
            <div className="relative mt-4 shrink-0 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={interactionsDisabled}
                onClick={() => void submitClaim()}
                className={mergeMpClasses(
                  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-sky-500/70 bg-sky-500/15 px-5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60",
                  MP_FOCUS_RING,
                )}
                aria-busy={phase === "submitting"}
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("mp.rest.claiming")}
                  </>
                ) : (
                  t("mp.rest.claimParticipation")
                )}
              </button>
            </div>
          ) : null}
        </motion.article>
      </div>
    </div>
  );
}
