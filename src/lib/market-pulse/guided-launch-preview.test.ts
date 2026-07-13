import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import {
  getGuidedLaunchPreview,
  GUIDED_LAUNCH_PREVIEW_PPA_FIELD_KEYS,
  guidedLaunchPreviewRowExcludesPpaFields,
} from "@/lib/market-pulse/guided-launch-preview";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";

function baseCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    id: "card-1",
    cycleId: "cycle-1",
    dayIndex: 1,
    companyName: "Acme",
    companyNameZh: null,
    ticker: "ACME",
    exchange: null,
    logoUrl: null,
    logoInitials: null,
    priceLabel: null,
    priceDirection: null,
    headline: "Headline",
    newsBody: "Body",
    sourceName: null,
    sourceUrl: null,
    sourceDate: null,
    cardImageUrl: null,
    cardImageAlt: null,
    summary: "Summary",
    userPrompt: null,
    status: "DRAFT",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight",
    ppaSignalLockedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: null,
    revealAt: null,
    decisionCount: 0,
    ...overrides,
  };
}

describe("getGuidedLaunchPreview", () => {
  it("reports zero cards and launch blocked for empty DRAFT cycle", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [],
    });

    expect(preview.totalCards).toBe(0);
    expect(preview.signalCount).toBe(0);
    expect(preview.restCount).toBe(0);
    expect(preview.readyCount).toBe(0);
    expect(preview.publishedCount).toBe(0);
    expect(preview.launchAllowed).toBe(false);
    expect(preview.blockingReasons).toContain("There are no cards in this cycle.");
    expect(preview.cardRows).toEqual([]);
  });

  it("reports launch allowed with correct counts for ready DRAFT cycle with SIGNAL and REST", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseCard(),
        baseCard({
          id: "card-rest",
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: "Rest day",
          newsBody: "Take a break.",
          summary: "Take a break.",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.totalCards).toBe(2);
    expect(preview.signalCount).toBe(1);
    expect(preview.restCount).toBe(1);
    expect(preview.readyCount).toBe(2);
    expect(preview.publishedCount).toBe(0);
    expect(preview.launchAllowed).toBe(true);
    expect(preview.blockingReasons).toEqual([]);
  });

  it("reports missing content count and blocks launch", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "OPEN" },
      cards: [baseCard({ newsBody: "", summary: "" })],
    });

    expect(preview.missingContentCount).toBe(1);
    expect(preview.missingPpaCount).toBe(0);
    expect(preview.launchAllowed).toBe(false);
    expect(preview.blockingReasons).toContain("Some signal cards are missing content.");
    expect(preview.cardsByStatus.missing_content).toBe(1);
  });

  it("reports missing PPA count and blocks launch", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseCard({
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.missingPpaCount).toBe(1);
    expect(preview.missingContentCount).toBe(0);
    expect(preview.launchAllowed).toBe(false);
    expect(preview.blockingReasons).toContain(
      "Some signal cards still need PPA approval.",
    );
    expect(preview.cardsByStatus.missing_ppa).toBe(1);
  });

  it.each(["CLOSED", "REVEALED", "ARCHIVED"] as const)(
    "blocks launch for %s cycles",
    (status) => {
      const preview = getGuidedLaunchPreview({
        cycle: { id: "cycle-1", status },
        cards: [baseCard()],
      });

      expect(preview.launchAllowed).toBe(false);
      expect(preview.blockingReasons.length).toBeGreaterThan(0);
    },
  );

  it("never includes PPA field values in preview rows", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [baseCard()],
    });

    for (const row of preview.cardRows) {
      expect(guidedLaunchPreviewRowExcludesPpaFields(row)).toBe(true);
      for (const key of GUIDED_LAUNCH_PREVIEW_PPA_FIELD_KEYS) {
        expect(row).not.toHaveProperty(key);
      }
      expect(row.isPpaApproved).toBe(true);
    }

    const serialized = JSON.stringify(preview.cardRows);
    expect(serialized).not.toContain("ppaSignal");
    expect(serialized).not.toContain("ppaInsight");
    expect(serialized).not.toContain("ppaSignalLockedAt");
  });

  it("counts published cards separately from ready status", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "OPEN" },
      cards: [
        baseCard({
          id: "published",
          status: "PUBLISHED",
          publishedAt: "2026-01-02T00:00:00.000Z",
        }),
        baseCard({ id: "ready-draft" }),
      ],
    });

    expect(preview.publishedCount).toBe(1);
    expect(preview.readyCount).toBe(1);
    expect(preview.cardsByStatus.published).toBe(1);
    expect(preview.cardsByStatus.ready).toBe(1);
    expect(preview.launchAllowed).toBe(true);
  });

  it("produces correct cardsByStatus counts for mixed statuses", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseCard({ id: "ready", status: "DRAFT" }),
        baseCard({
          id: "published",
          status: "PUBLISHED",
          publishedAt: "2026-01-02T00:00:00.000Z",
        }),
        baseCard({
          id: "missing-content",
          newsBody: "",
          summary: "",
        }),
        baseCard({
          id: "missing-ppa",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    expect(preview.cardsByStatus).toEqual({
      ready: 1,
      published: 1,
      missing_content: 1,
      missing_ppa: 1,
    });
    expect(preview.launchAllowed).toBe(false);
  });

  it("sets REST preview rows with null PPA approval and company/ticker only on SIGNAL", () => {
    const preview = getGuidedLaunchPreview({
      cycle: { id: "cycle-1", status: "DRAFT" },
      cards: [
        baseCard(),
        baseCard({
          id: "rest",
          cardType: "REST",
          companyName: "",
          ticker: "",
          headline: "Rest",
          newsBody: "Body",
          summary: "Body",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ],
    });

    const signalRow = preview.cardRows.find((row) => row.cardType === "SIGNAL");
    const restRow = preview.cardRows.find((row) => row.cardType === "REST");

    expect(signalRow?.companyName).toBe("Acme");
    expect(signalRow?.ticker).toBe("ACME");
    expect(signalRow?.isPpaApproved).toBe(true);

    expect(restRow?.companyName).toBeNull();
    expect(restRow?.ticker).toBeNull();
    expect(restRow?.isPpaApproved).toBeNull();
  });
});
