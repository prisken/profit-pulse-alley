export function shouldShowLockedCycleProgress(
  dayCurrent: number,
  dayTotal: number,
): boolean {
  return dayTotal > 0 && dayCurrent > 0;
}
