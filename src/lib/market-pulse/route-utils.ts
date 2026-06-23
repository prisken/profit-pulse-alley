import { NextResponse } from "next/server";

import {
  marketPulseErrorStatus,
  type MarketPulsePlayerError,
} from "@/lib/market-pulse/player-handlers";

export function marketPulseErrorResponse(error: MarketPulsePlayerError) {
  return NextResponse.json(
    {
      ok: false,
      code: error.code,
      error: error.error,
    },
    { status: marketPulseErrorStatus(error.code) },
  );
}

export function marketPulseJsonResponse<T extends Record<string, unknown>>(
  body: T,
  status = 200,
) {
  return NextResponse.json({ ok: true, ...body }, { status });
}
