import { describe, expect, it } from "vitest";

import {
  buildLeaderboardCycleOptions,
  getLeaderboardViewState,
  resolveLeaderboardSelectedCycleId,
  type LeaderboardCycleRow,
} from "@/lib/market-pulse/leaderboard-cycle-select";

const NOW = new Date("2026-07-05T12:00:00.000Z");

function cycle(
  overrides: Partial<LeaderboardCycleRow> & { id: string },
): LeaderboardCycleRow {
  return {
    name: `Cycle ${overrides.id}`,
    startsAt: "2026-06-01T00:00:00.000Z",
    endsAt: "2026-06-10T00:00:00.000Z",
    revealAt: "2026-06-11T00:00:00.000Z",
    status: "REVEALED",
    ...overrides,
  };
}

describe("buildLeaderboardCycleOptions", () => {
  it("includes active unrevealed cycle and revealed historical cycles", () => {
    const active = cycle({
      id: "active",
      status: "OPEN",
      revealAt: "2026-07-11T00:00:00.000Z",
    });
    const past = cycle({ id: "past-1", revealAt: "2026-06-11T00:00:00.000Z" });
    const future = cycle({
      id: "future",
      status: "OPEN",
      revealAt: "2026-12-01T00:00:00.000Z",
    });

    const options = buildLeaderboardCycleOptions(active, [past, future], NOW);

    expect(options.map((o) => o.id)).toEqual(["active", "past-1"]);
    expect(options.find((o) => o.id === "active")).toMatchObject({
      isActive: true,
      labelKind: "current",
      isRevealed: false,
    });
    expect(options.find((o) => o.id === "past-1")).toMatchObject({
      labelKind: "archived",
      isRevealed: true,
    });
  });

  it("sorts newest reveal first", () => {
    const older = cycle({ id: "older", revealAt: "2026-05-01T00:00:00.000Z" });
    const newer = cycle({ id: "newer", revealAt: "2026-06-01T00:00:00.000Z" });

    const options = buildLeaderboardCycleOptions(null, [older, newer], NOW);

    expect(options.map((o) => o.id)).toEqual(["newer", "older"]);
  });

  it("excludes unrevealed non-active cycles from selector options", () => {
    const unrevealedPast = cycle({
      id: "hidden",
      status: "OPEN",
      revealAt: "2026-12-01T00:00:00.000Z",
    });

    const options = buildLeaderboardCycleOptions(null, [unrevealedPast], NOW);

    expect(options).toEqual([]);
  });
});

describe("resolveLeaderboardSelectedCycleId", () => {
  const options = buildLeaderboardCycleOptions(
    cycle({
      id: "active",
      status: "OPEN",
      revealAt: "2026-07-11T00:00:00.000Z",
    }),
    [cycle({ id: "past", revealAt: "2026-06-01T00:00:00.000Z" })],
    NOW,
  );

  it("defaults to active cycle when no param", () => {
    expect(
      resolveLeaderboardSelectedCycleId(null, options, "active"),
    ).toEqual({ cycleId: "active", unavailable: false });
  });

  it("defaults to latest revealed when no active cycle", () => {
    expect(resolveLeaderboardSelectedCycleId(null, options, null)).toEqual({
      cycleId: "past",
      unavailable: false,
    });
  });

  it("uses requested revealed cycle", () => {
    expect(
      resolveLeaderboardSelectedCycleId("past", options, "active"),
    ).toEqual({ cycleId: "past", unavailable: false });
  });

  it("marks unknown cycle as unavailable", () => {
    expect(
      resolveLeaderboardSelectedCycleId("missing", options, "active"),
    ).toEqual({ cycleId: null, unavailable: true });
  });
});

describe("getLeaderboardViewState", () => {
  const activeUnrevealed = buildLeaderboardCycleOptions(
    cycle({
      id: "active",
      status: "OPEN",
      revealAt: "2026-07-11T00:00:00.000Z",
    }),
    [],
    NOW,
  )[0]!;

  const revealed = buildLeaderboardCycleOptions(
    null,
    [cycle({ id: "past" })],
    NOW,
  )[0]!;

  it("returns locked for active unrevealed cycle", () => {
    expect(getLeaderboardViewState(activeUnrevealed, 0, false)).toBe("locked");
  });

  it("returns ready when revealed cycle has entries", () => {
    expect(getLeaderboardViewState(revealed, 3, false)).toBe("ready");
  });

  it("returns no_scores when revealed cycle has no entries", () => {
    expect(getLeaderboardViewState(revealed, 0, false)).toBe("no_scores");
  });

  it("returns unavailable for invalid selection", () => {
    expect(getLeaderboardViewState(null, 0, true)).toBe("unavailable");
  });
});
