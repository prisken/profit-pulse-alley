import { describe, expect, it, vi } from "vitest";

import type { RevealPpaCardInput } from "@/lib/market-pulse/reveal-ppa-validation";
import {
  formatRevealPpaBlockMessage,
  getMissingPpaFields,
  validatePublishedCardsPpaForReveal,
} from "@/lib/market-pulse/reveal-ppa-validation";

const prismaMocks = vi.hoisted(() => ({
  cardFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCard: {
      findMany: prismaMocks.cardFindMany,
    },
  },
}));

const CYCLE_ID = "cycle-1";

function buildCard(overrides: Partial<RevealPpaCardInput> = {}): RevealPpaCardInput {
  return {
    id: "card-1",
    cycleId: CYCLE_ID,
    dayIndex: 1,
    headline: "Headline",
    companyName: "Acme",
    status: "PUBLISHED",
    ppaSignal: "BULLISH",
    ppaInsight: "Insight text",
    ppaSignalLockedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getMissingPpaFields", () => {
  it("returns empty when PPA is complete and locked", () => {
    expect(getMissingPpaFields(buildCard())).toEqual([]);
  });

  it("flags missing ppaSignal", () => {
    expect(getMissingPpaFields(buildCard({ ppaSignal: null }))).toContain(
      "ppaSignal",
    );
  });

  it("flags missing ppaInsight", () => {
    expect(getMissingPpaFields(buildCard({ ppaInsight: "" }))).toContain(
      "ppaInsight",
    );
  });

  it("flags unlocked PPA", () => {
    expect(getMissingPpaFields(buildCard({ ppaSignalLockedAt: null }))).toContain(
      "ppaLocked",
    );
  });

  it("returns empty for REST cards even without PPA", () => {
    expect(
      getMissingPpaFields(
        buildCard({
          cardType: "REST",
          ppaSignal: null,
          ppaInsight: null,
          ppaSignalLockedAt: null,
        }),
      ),
    ).toEqual([]);
  });
});

describe("validatePublishedCardsPpaForReveal", () => {
  it("fails when one card is missing ppaSignal", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard(),
      buildCard({
        id: "card-2",
        dayIndex: 2,
        companyName: "Beta",
        ppaSignal: null,
      }),
    ]);

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.message).toMatch(/Cannot reveal yet/i);
      expect(result.message).toMatch(/1 card/i);
      expect(result.missingCards).toHaveLength(1);
      expect(result.missingCards[0]?.missing).toContain("ppaSignal");
    }
  });

  it("fails when one card is missing ppaInsight", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard({ ppaInsight: "   " }),
    ]);

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.missingCards[0]?.missing).toContain("ppaInsight");
    }
  });

  it("fails when one card has ppaLocked false", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard({ ppaSignalLockedAt: null }),
    ]);

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.missingCards[0]?.missing).toContain("ppaLocked");
    }
  });

  it("succeeds when all published cards have complete locked PPA", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard(),
      buildCard({ id: "card-2", dayIndex: 2, companyName: "Beta" }),
      buildCard({ id: "card-3", dayIndex: 3, status: "DRAFT", ppaSignal: null }),
    ]);

    expect(result).toEqual({ ready: true });
  });

  it("accepts multiple published cards on the same day when PPA is complete", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard({ id: "card-a", dayIndex: 3, sortOrder: 0 }),
      buildCard({ id: "card-b", dayIndex: 3, sortOrder: 1, companyName: "Beta" }),
    ]);

    expect(result).toEqual({ ready: true });
  });

  it("blocks reveal when one same-day card is missing PPA", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard({ id: "card-a", dayIndex: 3, sortOrder: 0 }),
      buildCard({
        id: "card-b",
        dayIndex: 3,
        sortOrder: 1,
        companyName: "Beta",
        ppaInsight: "",
      }),
    ]);

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.missingCards).toHaveLength(1);
      expect(result.message).toMatch(/day 3 · card 2 \(Beta\)/i);
    }
  });

  it("formats a clear admin error message", () => {
    const message = formatRevealPpaBlockMessage([
      {
        id: "card-2",
        dayIndex: 2,
        headline: "Beta news",
        companyName: "Beta",
        missing: ["ppaLocked"],
      },
    ]);

    expect(message).toMatch(/Cannot reveal yet/i);
    expect(message).toMatch(/1 card/i);
    expect(message).toMatch(/day 2 \(Beta\)/i);
  });

  it("succeeds when only REST cards lack PPA", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard(),
      buildCard({
        id: "rest-1",
        dayIndex: 2,
        cardType: "REST",
        companyName: "Rest",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(result).toEqual({ ready: true });
  });

  it("still blocks reveal when a signal card lacks PPA alongside rest cards", () => {
    const result = validatePublishedCardsPpaForReveal(CYCLE_ID, [
      buildCard({
        id: "signal-missing",
        ppaInsight: "",
      }),
      buildCard({
        id: "rest-1",
        dayIndex: 2,
        cardType: "REST",
        ppaSignal: null,
        ppaInsight: null,
        ppaSignalLockedAt: null,
      }),
    ]);

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.missingCards).toHaveLength(1);
      expect(result.missingCards[0]?.id).toBe("signal-missing");
    }
  });
});

describe("validateCycleReadyForReveal", () => {
  it("loads published cards from prisma", async () => {
    const { validateCycleReadyForReveal } = await import(
      "@/lib/market-pulse/reveal-ppa-validation.server"
    );
    prismaMocks.cardFindMany.mockResolvedValue([buildCard()]);

    const result = await validateCycleReadyForReveal(CYCLE_ID);

    expect(result).toEqual({ ready: true });
    expect(prismaMocks.cardFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cycleId: CYCLE_ID, status: "PUBLISHED" },
      }),
    );
  });
});
