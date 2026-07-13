import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { getMarketPulseCycleNextAction } from "@/lib/market-pulse/admin-cycle-next-action";
import { formatGuidedLaunchAuditReason } from "@/lib/market-pulse/guided-launch-audit-reason";
import {
  buildGuidedHubProgressSummary,
  getGuidedCardDashboard,
} from "@/lib/market-pulse/guided-card-dashboard";
import { getGuidedLaunchPreview } from "@/lib/market-pulse/guided-launch-preview";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  GUIDED_AUDIT_REASON_FORBIDDEN_MARKERS,
  GUIDED_CARD_DASHBOARD_FORBIDDEN_MARKERS,
  GUIDED_HUB_PROGRESS_FORBIDDEN_MARKERS,
  GUIDED_LAUNCH_PREVIEW_FORBIDDEN_MARKERS,
  serializedExcludesMarkers,
} from "@/lib/market-pulse/guided-workflow-privacy-test-markers";

function sensitiveCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    id: "card-sensitive-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    sortOrder: 0,
    companyName: "Acme",
    companyNameZh: null,
    ticker: "ACME",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Sensitive headline",
    newsBody: "Full article body must not leak",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: "https://example.com/card.png",
    cardImageAlt: "Sensitive alt text",
    summary: "Summary",
    userPrompt: null,
    status: "DRAFT",
    ppaSignal: "BULLISH",
    ppaInsight: "Secret PPA insight",
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    ...overrides,
  };
}

describe("guided workflow privacy regression", () => {
  const cards = [sensitiveCard()];

  it("launch preview serialized output excludes PPA, body, and image markers", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards,
    });

    const serialized = JSON.stringify(preview);

    expect(serializedExcludesMarkers(serialized, GUIDED_LAUNCH_PREVIEW_FORBIDDEN_MARKERS)).toBe(
      true,
    );
    expect(serialized).toContain("Sensitive headline");
    expect(preview.cardRows[0]?.isPpaApproved).toBe(true);
  });

  it("card dashboard serialized output excludes PPA, body, and image markers", () => {
    const dashboard = getGuidedCardDashboard(cards);
    const serialized = JSON.stringify(dashboard);

    expect(
      serializedExcludesMarkers(serialized, GUIDED_CARD_DASHBOARD_FORBIDDEN_MARKERS),
    ).toBe(true);
    expect(dashboard.cardRows).toHaveLength(1);
    expect(dashboard.cardRows[0]?.id).toBe("card-sensitive-1");
  });

  it("hub progress serialized output excludes cardRows, cardId, and sensitive markers", () => {
    const summary = buildGuidedHubProgressSummary({
      cycleStatus: "DRAFT",
      cards,
    });

    expect(summary).not.toBeNull();
    const serialized = JSON.stringify(summary);

    expect(serializedExcludesMarkers(serialized, GUIDED_HUB_PROGRESS_FORBIDDEN_MARKERS)).toBe(
      true,
    );
    expect(serialized).not.toContain("card-sensitive-1");
  });

  it("guided launch audit reason excludes sensitive marker strings", () => {
    const reason = formatGuidedLaunchAuditReason({
      cycleId: "cycle-1",
      publishedCount: 1,
      runtimeStatus: "OPEN",
      activeCycleId: "cycle-1",
    });

    expect(
      serializedExcludesMarkers(reason, GUIDED_AUDIT_REASON_FORBIDDEN_MARKERS),
    ).toBe(true);
    expect(reason).not.toContain("Secret PPA insight");
    expect(reason).not.toContain("Full article body");
  });

  it("hub progress is null for terminal cycle statuses", () => {
    for (const cycleStatus of ["CLOSED", "REVEALED", "ARCHIVED"] as const) {
      expect(
        buildGuidedHubProgressSummary({
          cycleStatus,
          cards,
        }),
      ).toBeNull();
    }
  });

  it("non-guided cycles with unknown cards route to advanced builder", () => {
    const action = getMarketPulseCycleNextAction({
      cycleId: "cycle-1",
      cycleStatus: "DRAFT",
      cards: null,
      activeCycleId: null,
      runtimeStatus: "CLOSED",
    });

    expect(action.kind).toBe("advanced_builder");
  });
});
