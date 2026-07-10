"use client";

import type { ReactNode } from "react";

import {
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import {
  mergeMpClasses,
  MP_GLOW_RADIAL_STYLES,
  MP_GRID_OVERLAY_STYLE,
  MP_METRIC_TEXT,
  MP_MOCK_LEADERBOARD_ROWS,
  MP_PROOF_CHIP_STYLES,
  MP_STATUS_CHIP_STYLES,
  MP_SURFACE_STYLES,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mpSurfacePadding,
  type MpGlowAccent,
  type MpMockLeaderboardRow,
  type MpProofChipVariant,
  type MpStatusChipVariant,
  type MpSurfaceVariant,
} from "@/lib/market-pulse/visual-primitives";

export {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_FOCUS_RING_AMBER,
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_MOCK_LEADERBOARD_ROWS,
  MP_OBSIDIAN_BG,
  MP_PRIMARY_BTN,
  MP_PULSE_ACCENT_BADGE,
  MP_PULSE_ACCENT_ICON,
  MP_PULSE_TEXT,
  MP_PULSE_TEXT_SOFT,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  type MpGlowAccent,
  type MpMockLeaderboardRow,
  type MpProofChipVariant,
  type MpStatusChipVariant,
  type MpSurfaceVariant,
} from "@/lib/market-pulse/visual-primitives";

/* ── Glow background ─────────────────────────────────────────────── */

export type MarketPulseGlowBackgroundProps = Readonly<{
  children: ReactNode;
  accent?: MpGlowAccent;
  showGrid?: boolean;
  className?: string;
  innerClassName?: string;
}>;

export function MarketPulseGlowBackground({
  children,
  accent = "emerald",
  showGrid = false,
  className = "",
  innerClassName = "",
}: MarketPulseGlowBackgroundProps) {
  return (
    <div
      className={mergeMpClasses(
        "relative isolate overflow-x-hidden bg-mp-obsidian text-white",
        className,
      )}
    >
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-0",
          MP_GLOW_RADIAL_STYLES[accent],
        )}
        aria-hidden="true"
      />
      {showGrid ? (
        <div
          className={mergeMpClasses(
            "pointer-events-none absolute inset-0 opacity-40 motion-reduce:opacity-25",
            MP_GRID_OVERLAY_STYLE,
          )}
          aria-hidden="true"
        />
      ) : null}
      <div className={mergeMpClasses("relative", innerClassName)}>{children}</div>
    </div>
  );
}

/* ── Premium surface ───────────────────────────────────────────────── */

export type MarketPulseSurfaceProps = Readonly<{
  children: ReactNode;
  variant?: MpSurfaceVariant;
  density?: "compact" | "default" | "spacious";
  className?: string;
  /** Optional decorative blurs inside the surface (no pointer events). */
  showOrbs?: boolean;
}>;

export function MarketPulseSurface({
  children,
  variant = "default",
  density = "default",
  className = "",
  showOrbs = false,
}: MarketPulseSurfaceProps) {
  return (
    <article
      className={mergeMpClasses(
        "relative overflow-hidden",
        MP_SURFACE_STYLES[variant],
        mpSurfacePadding(density),
        className,
      )}
    >
      {showOrbs ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,230,118,0.06),transparent)] motion-reduce:opacity-80"
          aria-hidden="true"
        />
      ) : null}
      <div className="relative">{children}</div>
    </article>
  );
}

/* ── Status chip ───────────────────────────────────────────────────── */

export type MarketPulseStatusChipProps = Readonly<{
  label: string;
  variant?: MpStatusChipVariant;
  icon?: ReactNode;
  showPulse?: boolean;
  className?: string;
}>;

export function MarketPulseStatusChip({
  label,
  variant = "neutral",
  icon,
  showPulse = false,
  className = "",
}: MarketPulseStatusChipProps) {
  const styles = MP_STATUS_CHIP_STYLES[variant];

  return (
    <span
      className={mergeMpClasses(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold normal-case tracking-wide sm:px-4 sm:py-1.5 sm:text-xs",
        styles.container,
        className,
      )}
    >
      {showPulse && styles.dot ? (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span
            className={mergeMpClasses(
              "absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping",
              styles.dot,
            )}
          />
          <span
            className={mergeMpClasses(
              "relative inline-flex h-2 w-2 rounded-full",
              styles.dot,
            )}
          />
        </span>
      ) : null}
      {icon ? (
        <span className="inline-flex shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 text-balance leading-snug">{label}</span>
    </span>
  );
}

/* ── Proof chip (game mechanic hints) ──────────────────────────────── */

export type MarketPulseProofChipProps = Readonly<{
  label: string;
  variant?: MpProofChipVariant;
  icon?: ReactNode;
  className?: string;
}>;

export function MarketPulseProofChip({
  label,
  variant = "dailySignal",
  icon,
  className = "",
}: MarketPulseProofChipProps) {
  return (
    <span
      className={mergeMpClasses(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold normal-case tracking-wide sm:gap-2 sm:px-3 sm:py-1 sm:text-[11px]",
        MP_PROOF_CHIP_STYLES[variant],
        className,
      )}
    >
      {icon ? (
        <span className="inline-flex shrink-0 [&>svg]:h-3 [&>svg]:w-3 sm:[&>svg]:h-3.5 sm:[&>svg]:w-3.5">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 text-balance leading-snug">{label}</span>
    </span>
  );
}

/* ── Mock leaderboard rows (decorative previews) ───────────────────── */

export type MarketPulseMockLeaderboardRowsProps = Readonly<{
  rows?: MpMockLeaderboardRow[];
  /** When false, scores render as a lock placeholder. */
  showScores?: boolean;
  lockedScoreLabel?: string;
  compact?: boolean;
  className?: string;
  /** Accessible name for the decorative list. */
  ariaLabel?: string;
}>;

function mockRankStyles(rank: number, highlighted: boolean): string {
  if (rank === 1 || highlighted) {
    return "bg-amber-500/20 text-amber-300";
  }
  if (rank <= 3) {
    return "bg-zinc-800 text-zinc-200";
  }
  return "bg-zinc-800/60 text-zinc-400";
}

export function MarketPulseMockLeaderboardRows({
  rows = MP_MOCK_LEADERBOARD_ROWS,
  showScores = true,
  lockedScoreLabel = "—",
  compact = false,
  className = "",
  ariaLabel = "Sample leaderboard preview",
}: MarketPulseMockLeaderboardRowsProps) {
  return (
    <ol
      className={mergeMpClasses(
        "divide-y divide-white/[0.06] overflow-hidden",
        MP_TERMINAL_PANEL,
        "shadow-lg shadow-black/20",
        className,
      )}
      aria-label={ariaLabel}
    >
      {rows.map((row) => (
        <li
          key={`${row.rank}-${row.playerName}`}
          className={mergeMpClasses(
            "flex items-center gap-3",
            compact ? "px-3 py-2.5" : "px-3 py-3 sm:px-5 sm:py-4",
          )}
        >
          <span
            className={mergeMpClasses(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm",
              MP_METRIC_TEXT,
              mockRankStyles(row.rank, row.highlighted ?? false),
            )}
            aria-hidden="true"
          >
            {row.rank}
          </span>
          <span
            className={mergeMpClasses(
              "min-w-0 flex-1 truncate font-medium text-zinc-100",
              compact ? "text-sm" : "text-sm sm:text-base",
            )}
          >
            {row.playerName}
          </span>
          <span
            className={mergeMpClasses(
              "shrink-0 font-semibold text-mp-pulse/80",
              MP_METRIC_TEXT,
              compact ? "text-sm" : "text-sm sm:text-base",
            )}
            aria-hidden="true"
          >
            {showScores ? row.scoreLabel ?? lockedScoreLabel : lockedScoreLabel}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ── Decorative decision buttons (previews only) ───────────────────── */

export type MarketPulseDecisionPreviewButtonProps = Readonly<{
  decision: MarketPulseDecision;
  label: string;
  active?: boolean;
  className?: string;
}>;

function TriangleLeft({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 12 14"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M11 1.5v11L2 7z" />
    </svg>
  );
}

function TriangleRight({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 12 14"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M1 1.5v11l9-5.5z" />
    </svg>
  );
}

export function MarketPulseDecisionPreviewButton({
  decision,
  label,
  active = false,
  className = "",
}: MarketPulseDecisionPreviewButtonProps) {
  const tone = getSignalTone(decision);
  const isBullish = decision === "BULLISH";

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      disabled
      className={mergeMpClasses(
        "inline-flex min-h-[3.25rem] flex-1 cursor-default items-center justify-center gap-2 rounded-xl border-2 bg-black/80 px-3 py-3 text-base font-bold text-white opacity-95 sm:min-h-14 sm:text-lg",
        tone.borderClass,
        active ? mergeMpClasses(tone.bgClass, "ring-2", tone.ringClass) : "",
        className,
      )}
    >
      {!isBullish ? (
        <TriangleLeft className="h-3.5 w-3.5 shrink-0 text-amber-400 sm:h-4 sm:w-4" />
      ) : null}
      <span>{label}</span>
      {isBullish ? (
        <TriangleRight className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
      ) : null}
    </button>
  );
}

export type MarketPulseDecisionPreviewPairProps = Readonly<{
  bullishLabel: string;
  cautiousLabel: string;
  activeDecision?: MarketPulseDecision | null;
  className?: string;
}>;

export function MarketPulseDecisionPreviewPair({
  bullishLabel,
  cautiousLabel,
  activeDecision = null,
  className = "",
}: MarketPulseDecisionPreviewPairProps) {
  return (
    <div
      className={mergeMpClasses("grid grid-cols-2 gap-2.5 sm:gap-3", className)}
      aria-hidden="true"
    >
      <MarketPulseDecisionPreviewButton
        decision="CAUTIOUS"
        label={cautiousLabel}
        active={activeDecision === "CAUTIOUS"}
      />
      <MarketPulseDecisionPreviewButton
        decision="BULLISH"
        label={bullishLabel}
        active={activeDecision === "BULLISH"}
      />
    </div>
  );
}

/* ── Section header ────────────────────────────────────────────────── */

export type MarketPulseSectionHeaderProps = Readonly<{
  title: string;
  eyebrow?: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
  titleId?: string;
  className?: string;
}>;

export function MarketPulseSectionHeader({
  title,
  eyebrow,
  description,
  align = "left",
  action,
  titleId,
  className = "",
}: MarketPulseSectionHeaderProps) {
  const centered = align === "center";

  return (
    <header
      className={mergeMpClasses(
        "flex flex-col gap-3",
        centered ? "items-center text-center" : "items-start text-left",
        action ? "sm:flex-row sm:items-end sm:justify-between sm:gap-4" : "",
        className,
      )}
    >
      <div className={mergeMpClasses("min-w-0", centered ? "max-w-2xl" : "max-w-3xl")}>
        {eyebrow ? (
          <p className={mergeMpClasses(MP_TICKER_TEXT, "text-mp-pulse/90 sm:text-xs sm:tracking-[0.2em]")}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className={mergeMpClasses(
            "font-bold tracking-tight text-white",
            eyebrow ? "mt-1.5 sm:mt-2" : "",
            centered
              ? "text-xl sm:text-3xl md:text-4xl"
              : "text-lg sm:text-2xl md:text-3xl",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={mergeMpClasses(
              "text-pretty text-xs leading-relaxed text-zinc-400 sm:text-sm sm:leading-relaxed md:text-base",
              centered ? "mt-2 sm:mt-3" : "mt-1 sm:mt-2",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </header>
  );
}
