/** Default prize copy for the cycle leaderboard winner (rank 1). */
export const PRIZE_RANK_1_NAME = "1 Ocean Park ticket";

export function prizeNameForRank(rank: number): string {
  if (rank === 1) {
    return PRIZE_RANK_1_NAME;
  }
  return "";
}
