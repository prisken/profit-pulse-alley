export const GAME_SETTINGS_KEY = "game-settings";

export const WEEKLY_THEMES = [
  "Wildcard",
  "AI Frenzy",
  "Green Tech",
  "FinTech",
] as const;

export const MARKET_EVENTS = ["None", "Market Crash", "Unicorn Day"] as const;

export type WeeklyTheme = (typeof WEEKLY_THEMES)[number];
export type MarketEvent = (typeof MARKET_EVENTS)[number];

export type GameSettings = {
  theme: WeeklyTheme;
  event: MarketEvent;
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  theme: "Wildcard",
  event: "None",
};

export function isWeeklyTheme(value: string): value is WeeklyTheme {
  return (WEEKLY_THEMES as readonly string[]).includes(value);
}

export function isMarketEvent(value: string): value is MarketEvent {
  return (MARKET_EVENTS as readonly string[]).includes(value);
}

export function parseGameSettings(body: unknown): GameSettings | null {
  if (!body || typeof body !== "object") return null;
  const { theme, event } = body as Record<string, unknown>;
  if (typeof theme !== "string" || typeof event !== "string") return null;
  if (!isWeeklyTheme(theme) || !isMarketEvent(event)) return null;
  return { theme, event };
}
