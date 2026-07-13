import { describe, expect, it } from "vitest";

import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS } from "@/lib/market-pulse/market-pulse-test-fixtures";
import {
  canUseGuidedFlowForCycle,
  getHubCycleActionLinks,
  getMarketPulseCycleNextAction,
} from "@/lib/market-pulse/admin-cycle-next-action";

const CYCLE_ID = "cycle-1";

function baseCard(
  overrides: Partial<MarketPulseAdminCardRow> = {},
): MarketPulseAdminCardRow {
  return {
    ...MARKET_PULSE_ADMIN_CARD_ROW_DEFAULTS,
    id: "card-1",
    cycleId: CYCLE_ID,
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

function nextActionInput(
  overrides: Partial<Parameters<typeof getMarketPulseCycleNextAction>[0]> = {},
) {
  return {
    cycleId: CYCLE_ID,
    cycleStatus: "DRAFT" as const,
    cards: [] as MarketPulseAdminCardRow[],
    activeCycleId: null,
    runtimeStatus: "CLOSED",
    ...overrides,
  };
}

describe("canUseGuidedFlowForCycle", () => {
  it("returns true only for DRAFT and OPEN", () => {
    expect(canUseGuidedFlowForCycle("DRAFT")).toBe(true);
    expect(canUseGuidedFlowForCycle("OPEN")).toBe(true);
    expect(canUseGuidedFlowForCycle("CLOSED")).toBe(false);
    expect(canUseGuidedFlowForCycle("REVEALED")).toBe(false);
    expect(canUseGuidedFlowForCycle("ARCHIVED")).toBe(false);
  });
});

describe("getMarketPulseCycleNextAction", () => {
  it("returns archived for ARCHIVED cycles", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "ARCHIVED", cards: [baseCard()] }),
    );

    expect(action.kind).toBe("archived");
    expect(action.emphasis).toBe("muted");
    expect(action.href).toBeUndefined();
  });

  it("returns revealed for REVEALED cycles", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "REVEALED", cards: [baseCard()] }),
    );

    expect(action.kind).toBe("revealed");
    expect(action.emphasis).toBe("muted");
    expect(action.secondaryHref).toBe("/admin/market-pulse/cycles/cycle-1/builder");
  });

  it("returns closed for CLOSED cycles", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "CLOSED", cards: [baseCard()] }),
    );

    expect(action.kind).toBe("closed");
    expect(action.emphasis).toBe("muted");
    expect(action.href).toBeUndefined();
  });

  it("returns advanced_builder when cards is null", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({ cards: null }),
    );

    expect(action.kind).toBe("advanced_builder");
    expect(action.href).toBe("/admin/market-pulse/cycles/cycle-1/builder");
    expect(action.emphasis).toBe("secondary");
  });

  it("returns fill_guided_cards for DRAFT with no cards", () => {
    const action = getMarketPulseCycleNextAction(nextActionInput({ cards: [] }));

    expect(action.kind).toBe("fill_guided_cards");
    expect(action.href).toBe("/admin/market-pulse/cycles/cycle-1/guided-cards");
    expect(action.emphasis).toBe("primary");
  });

  it("returns fill_guided_cards when content is missing", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({
        cards: [baseCard({ newsBody: "", summary: "" })],
      }),
    );

    expect(action.kind).toBe("fill_guided_cards");
    expect(action.emphasis).toBe("primary");
  });

  it("returns fill_guided_cards when PPA is missing", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({
        cards: [
          baseCard({
            ppaSignal: null,
            ppaInsight: null,
            ppaSignalLockedAt: null,
          }),
        ],
      }),
    );

    expect(action.kind).toBe("fill_guided_cards");
    expect(action.emphasis).toBe("primary");
  });

  it("returns review_and_launch when ready but not launched", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({
        cards: [baseCard()],
      }),
    );

    expect(action.kind).toBe("review_and_launch");
    expect(action.href).toBe("/admin/market-pulse/cycles/cycle-1/guided-launch");
    expect(action.emphasis).toBe("primary");
  });

  it("returns review_and_launch for OPEN cycles that are not fully launched", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({
        cycleStatus: "OPEN",
        cards: [baseCard()],
        activeCycleId: null,
        runtimeStatus: "CLOSED",
      }),
    );

    expect(action.kind).toBe("review_and_launch");
    expect(action.emphasis).toBe("primary");
  });

  it("returns launched with secondary launch-status link when fully launched", () => {
    const action = getMarketPulseCycleNextAction(
      nextActionInput({
        cycleStatus: "OPEN",
        cards: [
          baseCard({
            status: "PUBLISHED",
            publishedAt: "2026-08-01T01:00:00.000Z",
          }),
        ],
        activeCycleId: CYCLE_ID,
        runtimeStatus: "OPEN",
      }),
    );

    expect(action.kind).toBe("launched");
    expect(action.emphasis).toBe("muted");
    expect(action.href).toBeUndefined();
    expect(action.secondaryHref).toBe(
      "/admin/market-pulse/cycles/cycle-1/guided-launch",
    );
    expect(action.secondaryLabelKey).toBe(
      "auth.admin.mp.hub.nextAction.launched.viewStatus",
    );
  });
});

describe("getHubCycleActionLinks", () => {
  it("shows one primary next action for fill_guided_cards", () => {
    const nextAction = getMarketPulseCycleNextAction(nextActionInput({ cards: [] }));
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "DRAFT");

    expect(links.primaryHref).toBe("/admin/market-pulse/cycles/cycle-1/guided-cards");
    expect(links.primaryEmphasis).toBe("primary");
    expect(links.showFillGuidedCards).toBe(false);
    expect(links.showReviewAndLaunch).toBe(false);
    expect(links.secondaryLinks.some((link) => link.href.includes("/builder"))).toBe(
      true,
    );
  });

  it("always includes advanced builder as secondary or fallback", () => {
    const nextAction = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "CLOSED", cards: [baseCard()] }),
    );
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "CLOSED");

    expect(links.primaryHref).toBeNull();
    expect(links.secondaryLinks).toEqual([
      {
        href: "/admin/market-pulse/cycles/cycle-1/builder",
        labelKey: "auth.admin.mp.openBuilder",
      },
    ]);
  });

  it("does not show guided launch as primary for CLOSED cycles", () => {
    const nextAction = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "CLOSED", cards: [baseCard()] }),
    );
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "CLOSED");

    expect(links.primaryHref).toBeNull();
    expect(links.showReviewAndLaunch).toBe(false);
    expect(
      links.secondaryLinks.some((link) => link.href.includes("guided-launch")),
    ).toBe(false);
  });

  it("does not show guided launch as primary for REVEALED cycles", () => {
    const nextAction = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "REVEALED", cards: [baseCard()] }),
    );
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "REVEALED");

    expect(links.primaryHref).toBeNull();
    expect(links.showReviewAndLaunch).toBe(false);
  });

  it("does not show guided launch as primary for ARCHIVED cycles", () => {
    const nextAction = getMarketPulseCycleNextAction(
      nextActionInput({ cycleStatus: "ARCHIVED", cards: [baseCard()] }),
    );
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "ARCHIVED");

    expect(links.primaryHref).toBeNull();
    expect(links.showReviewAndLaunch).toBe(false);
  });

  it("shows launch status secondary link for launched cycles", () => {
    const nextAction = getMarketPulseCycleNextAction(
      nextActionInput({
        cycleStatus: "OPEN",
        cards: [
          baseCard({
            status: "PUBLISHED",
            publishedAt: "2026-08-01T01:00:00.000Z",
          }),
        ],
        activeCycleId: CYCLE_ID,
        runtimeStatus: "OPEN",
      }),
    );
    const links = getHubCycleActionLinks(nextAction, CYCLE_ID, "OPEN");

    expect(links.primaryHref).toBeNull();
    expect(links.showReviewAndLaunch).toBe(false);
    expect(links.secondaryLinks[0]?.href).toBe(
      "/admin/market-pulse/cycles/cycle-1/guided-launch",
    );
    expect(links.secondaryLinks[0]?.labelKey).toBe(
      "auth.admin.mp.hub.nextAction.launched.viewStatus",
    );
  });
});
