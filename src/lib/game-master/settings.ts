import { getKv } from "@/lib/kv";
import {
  DEFAULT_GAME_MASTER_SETTINGS,
  GAME_MASTER_SETTINGS_KEY,
  type GameMasterSettings,
} from "@/lib/game-master/types";

export async function getGameMasterSettings(): Promise<GameMasterSettings> {
  const kv = getKv();
  if (!kv) {
    return DEFAULT_GAME_MASTER_SETTINGS;
  }

  try {
    const stored = await kv.get<GameMasterSettings>(GAME_MASTER_SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_GAME_MASTER_SETTINGS;
    }
    return { ...DEFAULT_GAME_MASTER_SETTINGS, ...stored };
  } catch (error) {
    console.error("[game-master] Failed to read settings from KV:", error);
    return DEFAULT_GAME_MASTER_SETTINGS;
  }
}

export async function saveGameMasterSettings(
  settings: Omit<GameMasterSettings, "updatedAt">,
): Promise<GameMasterSettings> {
  const kv = getKv();
  if (!kv) {
    throw new Error(
      "KV is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN to your environment.",
    );
  }

  const payload: GameMasterSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(GAME_MASTER_SETTINGS_KEY, payload);
  return payload;
}
