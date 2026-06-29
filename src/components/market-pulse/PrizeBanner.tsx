"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gift } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type PrizeBannerProps = {
  prizeMessage?: string;
  variant?: "default" | "compact";
  className?: string;
};

export default function PrizeBanner({
  prizeMessage,
  variant = "default",
  className = "",
}: PrizeBannerProps) {
  const { t } = useTranslations();
  const isCompact = variant === "compact";
  const reduceMotion = useReducedMotion() ?? false;
  const message = prizeMessage ?? t("announcement.prize");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: MARKET_PULSE_EASE }}
      className={`rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 shadow-lg shadow-amber-950/10 sm:rounded-2xl ${
        isCompact ? "px-3 py-3 sm:px-5 sm:py-5" : "px-4 py-4 sm:px-5 sm:py-5"
      } ${className}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/15 text-amber-300 sm:rounded-xl ${
            isCompact ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          <Gift
            className={isCompact ? "h-4 w-4" : "h-5 w-5"}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <p
            className={`font-semibold uppercase tracking-[0.14em] text-amber-200/70 ${
              isCompact ? "text-[10px]" : "text-xs tracking-[0.16em]"
            }`}
          >
            {t("mp.prize.heading")}
          </p>
          <p
            className={`font-semibold leading-snug text-amber-50 ${
              isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
