import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_KEY,
  parseGameSettings,
  type GameSettings,
} from "@/lib/game-settings";

export async function GET() {
  try {
    const stored = await kv.get<GameSettings>(GAME_SETTINGS_KEY);
    const settings = stored ?? DEFAULT_GAME_SETTINGS;
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[game-settings] GET failed:", error);
    return NextResponse.json(DEFAULT_GAME_SETTINGS);
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const settings = parseGameSettings(body);

    if (!settings) {
      return NextResponse.json(
        { error: "Invalid body. Expected { theme, event } with valid values." },
        { status: 400 },
      );
    }

    await kv.set(GAME_SETTINGS_KEY, settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[game-settings] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to save game settings." },
      { status: 500 },
    );
  }
}
