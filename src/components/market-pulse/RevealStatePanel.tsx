"use client";

import { Lock, LogIn, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { mergeMpClasses } from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type RevealStatePanelVariant = "locked" | "guest" | "no_participation";

export type RevealStatePanelProps = Readonly<{
  variant: RevealStatePanelVariant;
  title: string;
  body: string;
  className?: string;
}>;

const variantStyles: Record<
  RevealStatePanelVariant,
  { border: string; glow: string; iconWrap: string; Icon: typeof Lock }
> = {
  locked: {
    border: "border-amber-500/30",
    glow: "bg-amber-500/10",
    iconWrap: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    Icon: Lock,
  },
  guest: {
    border: "border-emerald-500/25",
    glow: "bg-emerald-500/10",
    iconWrap: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
    Icon: LogIn,
  },
  no_participation: {
    border: "border-zinc-700/80",
    glow: "bg-zinc-800/30",
    iconWrap: "border-zinc-600 bg-zinc-900 text-zinc-400",
    Icon: Sparkles,
  },
};

export default function RevealStatePanel({
  variant,
  title,
  body,
  className = "",
}: RevealStatePanelProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion ? { duration: 0.12 } : { duration: 0.35, ease: MARKET_PULSE_EASE }
      }
      className={mergeMpClasses(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-black px-4 py-8 text-center shadow-xl sm:rounded-3xl sm:px-6 sm:py-10",
        styles.border,
        className,
      )}
      role="status"
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full blur-3xl",
          styles.glow,
        )}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className={mergeMpClasses(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border",
            styles.iconWrap,
          )}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white sm:text-xl">{title}</h3>
        {body ? (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            {body}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function RevealLockedPreview() {
  return (
    <div
      className="mx-auto mt-6 max-w-sm space-y-2 opacity-50"
      aria-hidden="true"
    >
      {[1, 2].map((index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-16 rounded bg-zinc-800/80" />
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] text-amber-400/70">
              <Lock className="h-3 w-3" />
            </span>
          </div>
          <span className="mt-2 block h-3 w-full rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}
