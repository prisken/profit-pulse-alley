/** Redis key prefix for all Game Master admin settings */
export const GAME_MASTER_KEY_PREFIX = "game-master:";

export const GAME_MASTER_SETTINGS_KEY = `${GAME_MASTER_KEY_PREFIX}settings`;

/** Configurable settings stored in Vercel KV for the investment game admin panel */
export type GameMasterSettings = {
  /** Whether new game sessions are allowed */
  gameEnabled: boolean;
  /** Display name for the active scenario */
  scenarioName: string;
  /** Starting capital shown to players (HKD) */
  startingCapital: number;
  /** Default game length in days */
  defaultDays: 5 | 10;
  /** Optional maintenance message when game is disabled */
  maintenanceMessage?: string;
  /** ISO timestamp of last admin update */
  updatedAt: string;
};

export const DEFAULT_GAME_MASTER_SETTINGS: GameMasterSettings = {
  gameEnabled: true,
  scenarioName: "Castle Siege — Default Scenario",
  startingCapital: 1_000_000,
  defaultDays: 10,
  updatedAt: new Date(0).toISOString(),
};
