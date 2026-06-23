"use client";

import { motion } from "framer-motion";
import { Gift, Plane } from "lucide-react";

import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type PrizeBannerProps = {
  /** Primary cycle prize line, e.g. "#1 wins 2 Ocean Park tickets". */
  primaryPrize: string;
  /** Optional monthly leaderboard prize. */
  monthlyPrize?: string | null;
  className?: string;
};

export default function PrizeBanner({
  primaryPrize,
  monthlyPrize,
  className = "",
}: PrizeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: MARKET_PULSE_EASE }}
      className={`rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 px-4 py-4 shadow-lg shadow-amber-950/10 sm:px-5 sm:py-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15 text-amber-300">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/70">
            Prizes
          </p>
          <p className="text-base font-semibold leading-snug text-amber-50 sm:text-lg">
            {primaryPrize}
          </p>
          {monthlyPrize ? (
            <div className="flex items-start gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
              <Plane
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-zinc-400">
                <span className="font-medium text-zinc-300">
                  Monthly winner:{" "}
                </span>
                {monthlyPrize}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
