export type SaveMarketPulseScoreResult =
  | { saved: true }
  | { saved: false; error: string };

export const WEEKLY_THEMES = [
  "Wildcard",
  "AI Frenzy",
  "Green Tech",
  "FinTech",
] as const;

export const MARKET_EVENTS = ["None", "Market Crash", "Unicorn Day"] as const;

export type WeeklyTheme = (typeof WEEKLY_THEMES)[number];
export type MarketEvent = (typeof MARKET_EVENTS)[number];

export type MarketPulseSettingsStatus = "open" | "closed" | "maintenance";
export type MarketPulseSettingsLeaderboardMode = "current-cycle" | "all-time";

/** @deprecated Use `MarketPulseSettingsLeaderboardMode`. */
export type MarketPulseLeaderboardMode = MarketPulseSettingsLeaderboardMode;

/** KV-backed admin settings for the active Market Pulse scenario. */
export type MarketPulseSettings = {
  theme: string;
  event: string;
  status?: MarketPulseSettingsStatus;
  leaderboardMode?: MarketPulseSettingsLeaderboardMode;
  prizeLabel?: string;
  updatedAt?: string;
};

/** @deprecated Use `MarketPulseSettings`. */
export type GameSettings = MarketPulseSettings;

/** Leaderboard row shown on the Game Hub. */
export type MarketPulseLeaderboardEntry = {
  id: string;
  rank: number;
  /** Player display name from membership profile. */
  playerName: string;
  score: number;
  image?: string | null;
  completedAt?: Date | string;
  createdAt?: Date | string;
  cycleId?: string;
};

/** Leaderboard payload for the Game Hub. */
export type MarketPulseLeaderboardView = {
  entries: MarketPulseLeaderboardEntry[];
  mode: MarketPulseSettingsLeaderboardMode;
  cycleId?: string;
  /** True when the current cycle had no scores and all-time rows are shown instead. */
  usedAllTimeFallback?: boolean;
};

/** A saved score row in a member's Market Pulse history. */
export type MarketPulseHistoryEntry = {
  id: string;
  score: number;
  /** When the run was saved (played on). */
  createdAt: Date;
  cycleId: string | null;
  gameVersion: string | null;
};

/** Outcome of a completed Market Pulse play session. */
export type MarketPulseRunResult = {
  score: number;
  startingBalance?: number;
  endingBalance?: number;
  durationSeconds?: number;
  scenarioVersion?: string;
};

/** Saved on each score row for future rule/scenario migrations. */
export const MARKET_PULSE_GAME_VERSION = "1";

/** Active 10-day challenge window used for homepage countdown and cycle prizes. */
export type MarketPulseChallengeCycle = {
  /** Stable leaderboard key in HKT, e.g. `2026-01-01_2026-01-10`. */
  cycleId: string;
  /** Zero-based index from `CHALLENGE_CYCLE_EPOCH_MS`. */
  cycleIndex: number;
  startAt: Date;
  /** Exclusive next-cycle boundary at HKT midnight. */
  endAt: Date;
  now: Date;
  remainingMs: number;
};

/** UI-friendly countdown breakdown for the active challenge cycle. */
export type ChallengeCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

/** Sanitized card fields safe for swipe UI — never includes PPA signal or insight. */
export type MarketPulseSwipeCardData = {
  id: string;
  cardType: import("@prisma/client").MarketPulseCardType;
  companyName: string;
  companyNameZh?: string | null;
  ticker: string;
  exchange?: string | null;
  logoUrl?: string | null;
  logoInitials?: string | null;
  priceLabel?: string | null;
  priceDirection?: string | null;
  headline: string;
  newsBody?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | Date | null;
  cardImageUrl?: string | null;
  cardImageAlt?: string | null;
  summary?: string | null;
  userPrompt?: string | null;
};

export type MarketPulseSwipeSubmitResult =
  | { ok: true }
  | { ok: false; error: string };

/** Client-safe reveal card row (only populated when cycle is revealed). */
export type MarketPulseRevealCardRow = {
  cardId: string;
  dayIndex: number;
  sortOrder: number;
  cardsOnDay: number;
  cardType: import("@prisma/client").MarketPulseCardType;
  companyName: string;
  headline: string;
  ticker: string | null;
  summary: string | null;
  newsBody: string | null;
  cardImageUrl: string | null;
  cardImageAlt: string | null;
  played: boolean;
  viewerDecision: string | null;
  decidedAtIso: string | null;
  ppaSignal: string | null;
  ppaInsight: string | null;
  isMatch: boolean | null;
  isRestCard: boolean;
  participationPoints: number | null;
  matchBonus: number | null;
  streakBonus: number | null;
  totalPoints: number | null;
};

export type MarketPulseRevealPageData = {
  status: "pending" | "revealed";
  isAuthenticated: boolean;
  pendingCycle: {
    name: string;
    revealAtIso: string;
  } | null;
  revealedCycle: {
    id: string;
    name: string;
  } | null;
  playNextAvailable: boolean;
  nextCycle: import("@/lib/market-pulse/next-cycle").MarketPulseNextCycleStatus;
  results: {
    cycleId: string;
    cycleName: string;
    totalPoints: number;
    rank: number | null;
    matchesCount: number;
    totalPlayed: number;
    totalSkipped: number;
    totalPublished: number;
    bestStreak: number;
    totals: {
      participationPoints: number;
      matchBonus: number;
      streakBonus: number;
      totalPoints: number;
    };
    cards: MarketPulseRevealCardRow[];
  } | null;
  acquisition: {
    showNextStepPreferencePrompt: boolean;
  };
};

/** Public leaderboard row — safe for client components (no email). */
export type MarketPulseLeaderboardEntryRow = {
  rank: number;
  userId: string;
  playerName: string;
  image: string | null;
  score: number;
  participationPoints: number;
  bonusPoints: number;
  isRevealed: boolean;
  cardsPlayed?: number;
};
