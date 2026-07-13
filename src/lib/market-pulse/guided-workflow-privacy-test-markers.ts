/**
 * Test-only sensitive-field markers for guided admin workflow privacy regression.
 * Not imported by production code.
 */

export const GUIDED_ADMIN_PPA_MARKERS = [
  "ppaSignal",
  "ppaInsight",
  "ppaSignalLockedAt",
] as const;

export const GUIDED_ADMIN_BODY_AND_IMAGE_MARKERS = [
  "newsBody",
  "body",
  "article body",
  "card body",
  "card payload",
  "cardImageUrl",
  "imageUrl",
  "cardImageAlt",
  "imageAltText",
  "cardImageAltText",
] as const;

export const GUIDED_LAUNCH_PREVIEW_FORBIDDEN_MARKERS = [
  ...GUIDED_ADMIN_PPA_MARKERS,
  ...GUIDED_ADMIN_BODY_AND_IMAGE_MARKERS,
] as const;

export const GUIDED_CARD_DASHBOARD_FORBIDDEN_MARKERS = [
  ...GUIDED_ADMIN_PPA_MARKERS,
  ...GUIDED_ADMIN_BODY_AND_IMAGE_MARKERS,
] as const;

export const GUIDED_HUB_PROGRESS_FORBIDDEN_MARKERS = [
  ...GUIDED_CARD_DASHBOARD_FORBIDDEN_MARKERS,
  "cardRows",
  "cardsByStatus",
  "cardId",
] as const;

export const GUIDED_AUDIT_REASON_FORBIDDEN_MARKERS = [
  ...GUIDED_ADMIN_PPA_MARKERS,
  ...GUIDED_ADMIN_BODY_AND_IMAGE_MARKERS,
] as const;

export function serializedExcludesMarkers(
  serialized: string,
  markers: readonly string[],
): boolean {
  return markers.every((marker) => !serialized.includes(marker));
}
