/** Default prize copy for Market Pulse cycle leaderboard winners. */
export const PRIZE_RANK_1_NAME = "2 Ocean Park tickets";
export const PRIZE_RANKS_2_10_NAME = "Exclusive PPA industry report";

export function prizeNameForRank(rank: number): string {
  if (rank === 1) {
    return PRIZE_RANK_1_NAME;
  }
  if (rank >= 2 && rank <= 10) {
    return PRIZE_RANKS_2_10_NAME;
  }
  return PRIZE_RANKS_2_10_NAME;
}
