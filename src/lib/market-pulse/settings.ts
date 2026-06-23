import { kv } from "@vercel/kv";

import {
  MARKET_EVENTS,
  WEEKLY_THEMES,
  type MarketEvent,
  type MarketPulseSettings,
  type MarketPulseSettingsLeaderboardMode,
  type MarketPulseSettingsStatus,
  type WeeklyTheme,
} from "@/lib/market-pulse/types";

/** KV storage key — kept as `game-settings` for backward compatibility. */
export const MARKET_PULSE_SETTINGS_KV_KEY = "game-settings";

export const MARKET_PULSE_STATUS_OPTIONS = [
  "open",
  "closed",
  "maintenance",
] as const satisfies readonly MarketPulseSettingsStatus[];

export const MARKET_PULSE_LEADERBOARD_MODE_OPTIONS = [
  "current-cycle",
  "all-time",
] as const satisfies readonly MarketPulseSettingsLeaderboardMode[];

export { MARKET_EVENTS, WEEKLY_THEMES };
export type {
  MarketEvent,
  MarketPulseSettings,
  MarketPulseSettingsLeaderboardMode,
  MarketPulseSettingsStatus,
  WeeklyTheme,
};

export const DEFAULT_MARKET_PULSE_SETTINGS: Required<
  Pick<MarketPulseSettings, "theme" | "event" | "status" | "leaderboardMode">
> = {
  theme: "Wildcard",
  event: "None",
  status: "open",
  leaderboardMode: "current-cycle",
};

export function isWeeklyTheme(value: string): value is WeeklyTheme {
  return (WEEKLY_THEMES as readonly string[]).includes(value);
}

export function isMarketEvent(value: string): value is MarketEvent {
  return (MARKET_EVENTS as readonly string[]).includes(value);
}

function normalizeStatus(value: unknown): MarketPulseSettingsStatus {
  if (value === "open" || value === "closed" || value === "maintenance") {
    return value;
  }
  if (value === "active") {
    return "open";
  }
  if (value === "disabled") {
    return "closed";
  }
  return DEFAULT_MARKET_PULSE_SETTINGS.status;
}

function normalizeLeaderboardMode(
  value: unknown,
): MarketPulseSettingsLeaderboardMode {
  if (value === "current-cycle" || value === "all-time") {
    return value;
  }
  if (value === "cycle") {
    return "current-cycle";
  }
  return DEFAULT_MARKET_PULSE_SETTINGS.leaderboardMode;
}

export function resolveMarketPulseSettings(
  partial?: Partial<MarketPulseSettings> | null,
): MarketPulseSettings {
  const theme =
    typeof partial?.theme === "string" && isWeeklyTheme(partial.theme)
      ? partial.theme
      : DEFAULT_MARKET_PULSE_SETTINGS.theme;
  const event =
    typeof partial?.event === "string" && isMarketEvent(partial.event)
      ? partial.event
      : DEFAULT_MARKET_PULSE_SETTINGS.event;

  const prizeLabel =
    typeof partial?.prizeLabel === "string"
      ? partial.prizeLabel.trim() || undefined
      : undefined;

  return {
    theme,
    event,
    status: normalizeStatus(partial?.status),
    leaderboardMode: normalizeLeaderboardMode(partial?.leaderboardMode),
    ...(prizeLabel ? { prizeLabel } : {}),
    ...(typeof partial?.updatedAt === "string" ? { updatedAt: partial.updatedAt } : {}),
  };
}

export function parseMarketPulseSettings(
  body: unknown,
): MarketPulseSettings | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  if (typeof record.theme !== "string" || typeof record.event !== "string") {
    return null;
  }
  if (!isWeeklyTheme(record.theme) || !isMarketEvent(record.event)) {
    return null;
  }

  const partial: Partial<MarketPulseSettings> = {
    theme: record.theme,
    event: record.event,
  };

  if (record.status !== undefined && record.status !== null) {
    partial.status = normalizeStatus(record.status);
  }

  if (record.leaderboardMode !== undefined && record.leaderboardMode !== null) {
    partial.leaderboardMode = normalizeLeaderboardMode(record.leaderboardMode);
  }

  if (typeof record.prizeLabel === "string") {
    partial.prizeLabel = record.prizeLabel;
  }

  if (typeof record.updatedAt === "string") {
    partial.updatedAt = record.updatedAt;
  }

  return resolveMarketPulseSettings(partial);
}

export async function getMarketPulseSettings(): Promise<MarketPulseSettings> {
  try {
    const stored = await kv.get<MarketPulseSettings>(
      MARKET_PULSE_SETTINGS_KV_KEY,
    );
    return resolveMarketPulseSettings(stored);
  } catch (error) {
    console.error("[market-pulse/settings] GET failed:", error);
    return resolveMarketPulseSettings();
  }
}

export async function saveMarketPulseSettings(
  settings: MarketPulseSettings,
): Promise<MarketPulseSettings> {
  const payload = resolveMarketPulseSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  await kv.set(MARKET_PULSE_SETTINGS_KV_KEY, payload);
  return payload;
}
