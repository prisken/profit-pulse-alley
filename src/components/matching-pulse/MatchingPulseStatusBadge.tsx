import {
  formatMatchingPulseStatusLabel,
} from "@/lib/matching-pulse/labels";
import type { MatchingPulseStatusValue } from "@/lib/matching-pulse/constants";
import { isMatchingPulseStatus } from "@/lib/matching-pulse/constants";
import { mergeMpClasses } from "@/lib/market-pulse/visual-primitives";

const STATUS_STYLES: Record<MatchingPulseStatusValue, string> = {
  NEW: "border-mp-pulse/30 bg-mp-pulse/10 text-mp-pulse",
  REVIEWING: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  NEED_MORE_INFO: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  POTENTIAL_MATCH_FOUND: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  INTRO_MADE: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  CLOSED: "border-white/10 bg-mp-obsidian-elevated text-zinc-400",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
};

type MatchingPulseStatusBadgeProps = Readonly<{
  status: string;
  className?: string;
}>;

export default function MatchingPulseStatusBadge({
  status,
  className = "",
}: MatchingPulseStatusBadgeProps) {
  const style = isMatchingPulseStatus(status)
    ? STATUS_STYLES[status]
    : "border-white/10 bg-mp-obsidian-elevated text-zinc-400";

  return (
    <span
      className={mergeMpClasses(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide sm:px-3 sm:py-1 sm:text-xs",
        style,
        className,
      )}
    >
      {formatMatchingPulseStatusLabel(status)}
    </span>
  );
}
