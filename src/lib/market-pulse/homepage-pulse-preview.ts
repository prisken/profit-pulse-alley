import "server-only";

import { isDatabaseConfigured } from "@/lib/db-config";
import {
  getMarketPulseLeaderboard,
  getRevealedMarketPulseCycleForPage,
  isMarketPulseCycleRevealed,
} from "@/lib/market-pulse/server";
import type { MarketPulseLeaderboardEntryRow } from "@/lib/market-pulse/types";

const PREVIEW_ROW_LIMIT = 5;
const LOCKED_PLACEHOLDER_SLOTS = 3;
const SAMPLE_ROW_COUNT = 3;

export type HomePulseBoardPreviewState = "revealed" | "locked" | "sample";

/** Client-safe leaderboard row — no userId, email, phone, or PPA fields. */
export type HomePulseBoardPreviewRow = {
  rank: number | null;
  playerName: string;
  score?: number;
};

export type HomePulseBoardPreview = {
  state: HomePulseBoardPreviewState;
  cycleName: string | null;
  revealAtIso: string | null;
  rows: HomePulseBoardPreviewRow[];
};

const EMPTY_PREVIEW: HomePulseBoardPreview = {
  state: "sample",
  cycleName: null,
  revealAtIso: null,
  rows: [],
};

function buildLockedPlaceholderRows(): HomePulseBoardPreviewRow[] {
  return Array.from({ length: LOCKED_PLACEHOLDER_SLOTS }, () => ({
    rank: null,
    playerName: "",
  }));
}

export function buildSamplePulseBoardPreview(
  samplePlayerNames: readonly string[],
): HomePulseBoardPreview {
  const names = samplePlayerNames.slice(0, SAMPLE_ROW_COUNT);
  const rows: HomePulseBoardPreviewRow[] = names.map((playerName, index) => ({
    rank: index + 1,
    playerName,
    score: undefined,
  }));

  return {
    state: "sample",
    cycleName: null,
    revealAtIso: null,
    rows,
  };
}

function toSafeRevealedRow(
  entry: MarketPulseLeaderboardEntryRow,
): HomePulseBoardPreviewRow {
  return {
    rank: entry.rank,
    playerName: entry.playerName,
    score: entry.isRevealed ? entry.score : undefined,
  };
}

function sanitizePreviewRows(
  rows: HomePulseBoardPreviewRow[],
): HomePulseBoardPreviewRow[] {
  return rows.map((row) => {
    const safe: HomePulseBoardPreviewRow = {
      rank: row.rank,
      playerName: row.playerName,
    };
    if (row.score !== undefined) {
      safe.score = row.score;
    }
    return safe;
  });
}

export async function getHomePulseBoardPreview(): Promise<HomePulseBoardPreview> {
  if (!isDatabaseConfigured()) {
    return EMPTY_PREVIEW;
  }

  const now = new Date();

  let revealedCycle: Awaited<
    ReturnType<typeof getRevealedMarketPulseCycleForPage>
  >["revealedCycle"] = null;
  let pendingActiveCycle: Awaited<
    ReturnType<typeof getRevealedMarketPulseCycleForPage>
  >["pendingActiveCycle"] = null;

  try {
    ({ revealedCycle, pendingActiveCycle } =
      await getRevealedMarketPulseCycleForPage());
  } catch (error) {
    console.error(
      "[market-pulse/homepage-pulse-preview] Cycle resolution failed:",
      error,
    );
    return EMPTY_PREVIEW;
  }

  if (pendingActiveCycle) {
    return {
      state: "locked",
      cycleName: pendingActiveCycle.name,
      revealAtIso: pendingActiveCycle.revealAt.toISOString(),
      rows: buildLockedPlaceholderRows(),
    };
  }

  if (
    revealedCycle &&
    isMarketPulseCycleRevealed(revealedCycle, now)
  ) {
    let entries: MarketPulseLeaderboardEntryRow[] = [];

    try {
      entries = await getMarketPulseLeaderboard({
        mode: "CURRENT_CYCLE",
        cycleId: revealedCycle.id,
        limit: PREVIEW_ROW_LIMIT,
      });
    } catch (error) {
      console.error(
        "[market-pulse/homepage-pulse-preview] Leaderboard failed:",
        error,
      );
      return EMPTY_PREVIEW;
    }

    const revealedRows = entries
      .filter((entry) => entry.isRevealed)
      .map(toSafeRevealedRow);

    if (revealedRows.length > 0) {
      return {
        state: "revealed",
        cycleName: revealedCycle.name,
        revealAtIso: revealedCycle.revealAt.toISOString(),
        rows: sanitizePreviewRows(revealedRows),
      };
    }
  }

  return EMPTY_PREVIEW;
}
