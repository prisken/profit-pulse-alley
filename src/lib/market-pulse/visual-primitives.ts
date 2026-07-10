/**
 * Shared Market Pulse visual tokens — safe for client and server imports (no React).
 */

export const MP_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mp-pulse/80 focus-visible:ring-offset-2 focus-visible:ring-offset-mp-obsidian";

export const MP_FOCUS_RING_AMBER =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-mp-obsidian";

/** Obsidian page / section background */
export const MP_OBSIDIAN_BG = "bg-mp-obsidian text-white";

/** Standard homepage / MP section shell */
export const MP_HOME_SECTION =
  "border-t border-white/[0.08] bg-mp-obsidian px-3 py-8 text-white sm:px-6 sm:py-12 md:py-14";

/** Premium terminal card surface */
export const MP_TERMINAL_PANEL =
  "rounded-xl border border-white/[0.08] bg-mp-obsidian-panel shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:rounded-2xl";

export const MP_TERMINAL_PANEL_ELEVATED =
  "rounded-xl border border-white/[0.1] bg-mp-obsidian-elevated shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:rounded-2xl";

/** JetBrains Mono for metrics, timers, tickers, leaderboard figures */
export const MP_METRIC_TEXT = "font-mono tabular-nums tracking-tight";

export const MP_TICKER_TEXT =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.16em]";

/** Neon Pulse Green — primary actions and live states only */
export const MP_PULSE_TEXT = "text-mp-pulse";

export const MP_PULSE_TEXT_SOFT = "text-mp-pulse/90";

export const MP_PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-mp-pulse font-bold text-mp-pulse-foreground transition-colors hover:bg-mp-pulse/90 active:bg-mp-pulse/80";

export const MP_PULSE_LIVE_CHIP =
  "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse";

export const MP_PULSE_ACCENT_ICON =
  "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse";

export const MP_PULSE_ACCENT_BADGE =
  "border-mp-pulse/25 bg-mp-pulse/10 text-mp-pulse";

export type MpSurfaceVariant = "default" | "elevated" | "glass" | "outline" | "prize";

export type MpGlowAccent = "emerald" | "amber" | "neutral" | "dual";

export type MpStatusChipVariant =
  | "live"
  | "paused"
  | "preLaunch"
  | "locked"
  | "revealed"
  | "archived"
  | "prize"
  | "countdown"
  | "neutral";

export type MpProofChipVariant =
  | "dailySignal"
  | "participation"
  | "lockedUntilReveal"
  | "ppaInsight"
  | "prize";

/** Join class names, skipping falsy entries. */
export function mergeMpClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export const MP_SURFACE_STYLES: Record<MpSurfaceVariant, string> = {
  default: mergeMpClasses(MP_TERMINAL_PANEL, "shadow-lg shadow-black/20"),
  elevated: mergeMpClasses(
    MP_TERMINAL_PANEL_ELEVATED,
    "border-mp-pulse/20 shadow-xl shadow-black/30",
  ),
  glass: mergeMpClasses(
    MP_TERMINAL_PANEL,
    "bg-mp-obsidian-elevated/80 backdrop-blur-sm",
  ),
  outline:
    "rounded-xl border border-dashed border-white/15 bg-mp-obsidian-panel/60 sm:rounded-2xl",
  prize: mergeMpClasses(
    MP_TERMINAL_PANEL,
    "border-amber-500/20 shadow-lg shadow-black/25",
  ),
};

/** Subtle top glow — reduced vs prior emerald gradients */
export const MP_GLOW_RADIAL_STYLES: Record<MpGlowAccent, string> = {
  emerald:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(0,230,118,0.08),transparent_60%)]",
  amber:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(245,158,11,0.06),transparent_60%)]",
  neutral:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(255,255,255,0.04),transparent_60%)]",
  dual:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(0,230,118,0.07),transparent_55%)]",
};

export const MP_GRID_OVERLAY_STYLE =
  "bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]";

export const MP_STATUS_CHIP_STYLES: Record<
  MpStatusChipVariant,
  { container: string; dot?: string }
> = {
  live: {
    container: MP_PULSE_LIVE_CHIP,
    dot: "bg-mp-pulse",
  },
  paused: {
    container: "border-white/10 bg-mp-obsidian-elevated text-mp-muted",
    dot: "bg-zinc-500",
  },
  preLaunch: {
    container: "border-mp-pulse/25 bg-mp-pulse/10 text-mp-pulse/90",
  },
  locked: {
    container: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  revealed: {
    container: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  },
  archived: {
    container: "border-white/10 bg-mp-obsidian-elevated text-mp-muted",
  },
  prize: {
    container: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  countdown: {
    container: "border-mp-pulse/25 bg-mp-pulse/10 text-mp-pulse/90",
    dot: "bg-mp-pulse",
  },
  neutral: {
    container: "border-white/10 bg-mp-obsidian-panel/80 text-zinc-300",
  },
};

export const MP_PROOF_CHIP_STYLES: Record<MpProofChipVariant, string> = {
  dailySignal: "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse/90",
  participation: "border-mp-pulse/25 bg-mp-pulse/10 text-mp-pulse",
  lockedUntilReveal: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  ppaInsight: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  prize: "border-amber-500/30 bg-amber-500/10 text-amber-100",
};

/** Resolve surface padding by density. */
export function mpSurfacePadding(density: "compact" | "default" | "spacious"): string {
  switch (density) {
    case "compact":
      return "p-3 sm:p-4";
    case "spacious":
      return "p-6 sm:p-8 md:p-10";
    default:
      return "p-4 sm:p-6 md:p-8";
  }
}

export type MpMockLeaderboardRow = {
  rank: number;
  playerName: string;
  scoreLabel?: string;
  highlighted?: boolean;
};

export const MP_MOCK_LEADERBOARD_ROWS: MpMockLeaderboardRow[] = [
  { rank: 1, playerName: "Alex C.", scoreLabel: "120", highlighted: true },
  { rank: 2, playerName: "Jordan L.", scoreLabel: "110" },
  { rank: 3, playerName: "Sam W.", scoreLabel: "100" },
];
