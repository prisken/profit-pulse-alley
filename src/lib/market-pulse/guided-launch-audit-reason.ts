export type GuidedLaunchAuditReasonInput = {
  cycleId: string;
  publishedCount: number;
  runtimeStatus?: string | null;
  activeCycleId?: string | null;
};

export function formatGuidedLaunchAuditReason(
  input: GuidedLaunchAuditReasonInput,
): string {
  const parts = [
    "Guided launch",
    `cycleId=${input.cycleId}`,
    `publishedCount=${input.publishedCount}`,
  ];

  if (input.runtimeStatus) {
    parts.push(`runtimeStatus=${input.runtimeStatus}`);
  }
  if (input.activeCycleId) {
    parts.push(`activeCycleId=${input.activeCycleId}`);
  }

  return `${parts.join("; ")}: publish cards, open cycle, pin active, runtime OPEN`;
}

export const GUIDED_LAUNCH_AUDIT_PPA_FIELD_MARKERS = [
  "ppaSignal",
  "ppaInsight",
  "ppaSignalLockedAt",
] as const;

export function guidedLaunchAuditReasonExcludesSensitiveFields(
  reason: string,
): boolean {
  return GUIDED_LAUNCH_AUDIT_PPA_FIELD_MARKERS.every(
    (marker) => !reason.includes(marker),
  );
}
