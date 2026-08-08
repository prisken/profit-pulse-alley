import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  cycleFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: authMocks.requireAdminSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findUnique: prismaMocks.cycleFindUnique,
    },
  },
}));

import {
  buildGuidedCycleCardChecklist,
  getGuidedCycleCardsPageData,
} from "@/lib/market-pulse/guided-cycle-cards-page-data";
import { mapMarketPulseAdminCardRow } from "@/lib/market-pulse/admin-card-row";

const ADMIN = { userId: "admin-1", email: "admin@example.com" };

const CYCLE = {
  id: "cycle-1",
  name: "August 2026",
  status: "DRAFT",
  startsAt: new Date("2026-08-01T01:00:00.000Z"),
  endsAt: new Date("2026-08-10T13:00:00.000Z"),
  revealAt: new Date("2026-08-11T01:00:00.000Z"),
  prizeLabel: "Prize",
  cards: [
    {
      id: "card-1",
      cycleId: "cycle-1",
      dayIndex: 1,
      sortOrder: 0,
      cardType: "SIGNAL" as const,
      companyName: "Acme",
      companyNameZh: null,
      ticker: "ACME",
      exchange: null,
      logoUrl: null,
      logoInitials: null,
      priceLabel: null,
      priceDirection: null,
      headline: "Headline",
      headlineZhHant: null,
      newsBody: "Body",
      newsBodyZhHant: null,
      sourceName: null,
      sourceUrl: null,
      sourceDate: new Date("2026-08-01T01:00:00.000Z"),
      cardImageUrl: null,
      cardImageAlt: null,
      cardImageAltZhHant: null,
      summary: "Summary",
      summaryZhHant: null,
      userPrompt: "Prompt",
      userPromptZhHant: null,
      status: "DRAFT" as const,
      researchNotes: null,
      reviewStatus: "PENDING" as const,
      reviewedAt: null,
      reviewNote: null,
      ppaSignal: null,
      ppaInsight: null,
      ppaInsightZhHant: null,
      ppaSignalLockedAt: null,
      publishedAt: null,
      revealAt: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      _count: { decisions: 0 },
    },
    {
      id: "card-2",
      cycleId: "cycle-1",
      dayIndex: 2,
      sortOrder: 0,
      cardType: "REST" as const,
      companyName: "",
      companyNameZh: null,
      ticker: "",
      exchange: null,
      logoUrl: null,
      logoInitials: null,
      priceLabel: null,
      priceDirection: null,
      headline: "Rest day",
      headlineZhHant: null,
      newsBody: "Rest body",
      newsBodyZhHant: null,
      sourceName: null,
      sourceUrl: null,
      sourceDate: new Date("2026-08-02T01:00:00.000Z"),
      cardImageUrl: null,
      cardImageAlt: null,
      cardImageAltZhHant: null,
      summary: "Rest body",
      summaryZhHant: null,
      userPrompt: null,
      userPromptZhHant: null,
      status: "DRAFT" as const,
      researchNotes: null,
      reviewStatus: "PENDING" as const,
      reviewedAt: null,
      reviewNote: null,
      ppaSignal: null,
      ppaInsight: null,
      ppaInsightZhHant: null,
      ppaSignalLockedAt: null,
      publishedAt: null,
      revealAt: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      _count: { decisions: 0 },
    },
  ],
  _count: { cards: 2, decisions: 0 },
  decisions: [],
};

describe("getGuidedCycleCardsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAdminSession.mockResolvedValue(ADMIN);
    prismaMocks.cycleFindUnique.mockResolvedValue(CYCLE);
  });

  it("returns null for non-admin users", async () => {
    authMocks.requireAdminSession.mockResolvedValue(null);

    const data = await getGuidedCycleCardsPageData("cycle-1");
    expect(data).toBeNull();
  });

  it("loads cycle summary and checklist rows", async () => {
    const data = await getGuidedCycleCardsPageData("cycle-1");

    expect(data).not.toBeNull();
    expect(data?.cycle.name).toBe("August 2026");
    expect(data?.signalCardCount).toBe(1);
    expect(data?.restCardCount).toBe(1);
    expect(data?.startDateHkt).toBe("2026-08-01");
    expect(data?.checklist).toHaveLength(2);
    expect(data?.checklist[0]?.cardTypeLabel).toBe("Signal");
    expect(data?.checklist[1]?.cardTypeLabel).toBe("Market Rest");
  });
});

describe("buildGuidedCycleCardChecklist", () => {
  it("includes HKT date and signal card number", () => {
    const cards = CYCLE.cards.map((card) =>
      mapMarketPulseAdminCardRow(card),
    );

    const checklist = buildGuidedCycleCardChecklist(cards, CYCLE.startsAt);

    expect(checklist[0]?.hktDate).toBe("2026-08-01");
    expect(checklist[0]?.cardNumber).toBe(1);
    expect(checklist[1]?.cardNumber).toBeNull();
  });
});
