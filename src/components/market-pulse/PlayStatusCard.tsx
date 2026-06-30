"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import PlayDecorativeSignalPreview from "@/components/market-pulse/PlayDecorativeSignalPreview";
import {
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type PlayStatusCta = Readonly<{
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}>;

export type PlayStatusCardProps = Readonly<{
  icon: LucideIcon;
  title: string;
  body: string;
  detail?: string;
  ctas: PlayStatusCta[];
  showSignalPreview?: boolean;
  accent?: "emerald" | "amber" | "zinc";
  className?: string;
}>;

const accentStyles = {
  emerald: {
    border: "border-emerald-500/25",
    iconWrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    glow: "bg-emerald-500/10",
  },
  amber: {
    border: "border-amber-500/25",
    iconWrap: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    glow: "bg-amber-500/10",
  },
  zinc: {
    border: "border-white/10",
    iconWrap: "border-zinc-600 bg-zinc-900 text-zinc-300",
    glow: "bg-zinc-800/40",
  },
} as const;

function ctaClassName(variant: PlayStatusCta["variant"] = "secondary"): string {
  switch (variant) {
    case "primary":
      return "border-emerald-400 bg-emerald-400 text-zinc-950 hover:bg-emerald-300";
    case "ghost":
      return "border-white/15 bg-transparent text-zinc-300 hover:border-white/25 hover:text-white";
    case "secondary":
    default:
      return "border-white/20 bg-white/5 text-white hover:bg-white/10";
  }
}

export default function PlayStatusCard({
  icon: Icon,
  title,
  body,
  detail,
  ctas,
  showSignalPreview = false,
  accent = "emerald",
  className = "",
}: PlayStatusCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const styles = accentStyles[accent];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.4, ease: MARKET_PULSE_EASE }}
      className={mergeMpClasses(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-black px-4 py-5 shadow-xl shadow-black/30 sm:px-6 sm:py-6",
        styles.border,
        className,
      )}
      aria-labelledby="play-status-card-title"
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-10 top-0 h-20 rounded-full blur-3xl",
          styles.glow,
        )}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-lg text-center">
        <div
          className={mergeMpClasses(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border sm:h-14 sm:w-14",
            styles.iconWrap,
          )}
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </div>

        <h2
          id="play-status-card-title"
          className="mt-4 text-lg font-bold text-white sm:text-xl"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          {body}
        </p>
        {detail ? (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {detail}
          </p>
        ) : null}

        {showSignalPreview ? (
          <div className="mt-5">
            <PlayDecorativeSignalPreview />
          </div>
        ) : null}

        <nav
          className="mt-5 flex w-full flex-col gap-2 sm:mt-6"
          aria-label={title}
        >
          {ctas.map((cta) => (
            <Link
              key={`${cta.href}-${cta.label}`}
              href={cta.href}
              className={mergeMpClasses(
                "inline-flex min-h-11 w-full items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors",
                MP_FOCUS_RING,
                ctaClassName(cta.variant),
              )}
            >
              {cta.label}
            </Link>
          ))}
        </nav>
      </div>
    </motion.section>
  );
}
