import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getMarketPulseSettings,
  parseMarketPulseSettings,
  saveMarketPulseSettings,
} from "@/lib/market-pulse/settings";

export async function GET() {
  const settings = await getMarketPulseSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const settings = parseMarketPulseSettings(body);

    if (!settings) {
      return NextResponse.json(
        { error: "Invalid body. Expected { theme, event } with valid values." },
        { status: 400 },
      );
    }

    const saved = await saveMarketPulseSettings(settings);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[game-settings] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to save game settings." },
      { status: 500 },
    );
  }
}
