import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CYCLE_START,
  TEST_CYCLE_ID,
} from "@/lib/market-pulse/market-pulse-test-fixtures";

const prismaMocks = vi.hoisted(() => ({
  cycleFindMany: vi.fn(),
  cardFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseCycle: {
      findMany: prismaMocks.cycleFindMany,
    },
    marketPulseCard: {
      findFirst: prismaMocks.cardFindFirst,
    },
  },
}));

import {
  deriveFirstCardReleaseAtIso,
  getMarketPulseNextCycleStatus,
  pickNearestPublicFutureCycle,
} from "@/lib/market-pulse/next-cycle";

const DEMO_CYCLE_NAME = "[DEMO] Market Pulse Local Seed";
const NOW = new Date("2026-07-05T12:00:00.000Z");

function futureCycle(
  overrides: Partial<{
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    revealAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? "cycle-future",
    name: overrides.name ?? "August 2026 Market Pulse",
    startsAt: overrides.startsAt ?? new Date("2026-07-11T16:00:00.000Z"),
    endsAt: overrides.endsAt ?? new Date("2026-07-21T16:00:00.000Z"),
    revealAt: overrides.revealAt ?? new Date("2026-07-21T16:00:00.000Z"),
  };
}

describe("pickNearestPublicFutureCycle", () => {
  it("returns the nearest future real cycle and ignores active current cycles", () => {
    const current = futureCycle({
      id: "cycle-current",
      name: "July 2026 Market Pulse",
      startsAt: new Date("2026-06-30T16:00:00.000Z"),
    });
    const nearerFuture = futureCycle({
      id: "cycle-next",
      startsAt: new Date("2026-07-11T16:00:00.000Z"),
    });
    const laterFuture = futureCycle({
      id: "cycle-later",
      startsAt: new Date("2026-08-11T16:00:00.000Z"),
    });

    expect(
      pickNearestPublicFutureCycle(
        [current, laterFuture, nearerFuture],
        NOW,
        false,
      ),
    ).toMatchObject({ id: "cycle-next" });
  });

  it("hides future demo cycles in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(
      pickNearestPublicFutureCycle(
        [futureCycle({ name: DEMO_CYCLE_NAME })],
        NOW,
        false,
      ),
    ).toBeNull();
  });
});

describe("deriveFirstCardReleaseAtIso", () => {
  it("uses the earliest published card when available", () => {
    const releaseAt = deriveFirstCardReleaseAtIso(CYCLE_START, {
      dayIndex: 2,
      publishedAt: null,
    });

    expect(releaseAt).toBe(
      new Date("2026-01-02T01:00:00.000Z").toISOString(),
    );
  });

  it("falls back to day-one schedule when no cards are published yet", () => {
    const releaseAt = deriveFirstCardReleaseAtIso(CYCLE_START, null);

    expect(releaseAt).toBe(
      new Date("2026-01-01T01:00:00.000Z").toISOString(),
    );
  });
});

describe("getMarketPulseNextCycleStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    prismaMocks.cardFindFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns tbc when no future cycle exists", async () => {
    prismaMocks.cycleFindMany.mockResolvedValue([]);

    await expect(getMarketPulseNextCycleStatus({ now: NOW })).resolves.toEqual({
      status: "tbc",
    });
  });

  it("returns available for a future real cycle", async () => {
    const cycle = futureCycle({ id: TEST_CYCLE_ID });
    prismaMocks.cycleFindMany.mockResolvedValue([cycle]);

    await expect(getMarketPulseNextCycleStatus({ now: NOW })).resolves.toEqual({
      status: "available",
      cycleId: TEST_CYCLE_ID,
      name: cycle.name,
      startsAtIso: cycle.startsAt.toISOString(),
      endsAtIso: cycle.endsAt.toISOString(),
      revealAtIso: cycle.revealAt.toISOString(),
      firstCardReleaseAtIso: deriveFirstCardReleaseAtIso(cycle.startsAt, null),
    });
  });

  it("returns tbc for a future demo cycle in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    prismaMocks.cycleFindMany.mockResolvedValue([
      futureCycle({ name: DEMO_CYCLE_NAME }),
    ]);

    await expect(getMarketPulseNextCycleStatus({ now: NOW })).resolves.toEqual({
      status: "tbc",
    });
  });

  it("still returns the future cycle when a current cycle is also scheduled", async () => {
    prismaMocks.cycleFindMany.mockResolvedValue([
      futureCycle({
        id: "cycle-next",
        startsAt: new Date("2026-07-11T16:00:00.000Z"),
      }),
    ]);

    await expect(getMarketPulseNextCycleStatus({ now: NOW })).resolves.toMatchObject({
      status: "available",
      cycleId: "cycle-next",
    });

    expect(prismaMocks.cycleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startsAt: { gt: NOW },
          status: "OPEN",
        }),
      }),
    );
  });
});
