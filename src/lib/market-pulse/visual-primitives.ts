/**
 * Shared Market Pulse visual tokens — safe for client and server imports (no React).
 */

export const MP_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export const MP_FOCUS_RING_AMBER =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

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

export const MP_SURFACE_STYLES: Record<MpSurfaceVariant, string> = {
  default:
    "rounded-2xl border border-white/10 bg-zinc-900/60 shadow-xl shadow-black/20 backdrop-blur-sm sm:rounded-3xl",
  elevated:
    "rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/95 to-zinc-950 shadow-2xl shadow-black/40 backdrop-blur-sm sm:rounded-3xl",
  glass:
    "rounded-2xl border border-white/15 bg-white/[0.04] shadow-lg shadow-black/25 backdrop-blur-md sm:rounded-3xl",
  outline:
    "rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 sm:rounded-3xl",
  prize:
    "rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 shadow-lg shadow-amber-950/10 sm:rounded-3xl",
};

export const MP_GLOW_RADIAL_STYLES: Record<MpGlowAccent, string> = {
  emerald:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent_55%)]",
  amber:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,158,11,0.12),transparent_55%)]",
  neutral:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_55%)]",
  dual:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.14),transparent_45%),radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(245,158,11,0.08),transparent_50%)]",
};

export const MP_GRID_OVERLAY_STYLE =
  "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]";

export const MP_STATUS_CHIP_STYLES: Record<
  MpStatusChipVariant,
  { container: string; dot?: string }
> = {
  live: {
    container:
      "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  paused: {
    container: "border-zinc-600/40 bg-zinc-800/80 text-zinc-300",
    dot: "bg-zinc-500",
  },
  preLaunch: {
    container: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  },
  locked: {
    container: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  revealed: {
    container: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  },
  archived: {
    container: "border-zinc-600/40 bg-zinc-800/80 text-zinc-300",
  },
  prize: {
    container: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  countdown: {
    container: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  },
  neutral: {
    container: "border-white/15 bg-white/[0.04] text-zinc-300",
  },
};

export const MP_PROOF_CHIP_STYLES: Record<MpProofChipVariant, string> = {
  dailySignal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  participation: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  lockedUntilReveal: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  ppaInsight: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  prize: "border-amber-500/30 bg-amber-500/10 text-amber-100",
};

/** Join class names, skipping falsy entries. */
export function mergeMpClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

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
