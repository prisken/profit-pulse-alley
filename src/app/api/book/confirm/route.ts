import { NextResponse } from "next/server";

import { getWeekOptions, type DayPref, type TimePref } from "@/lib/book/availability";
import {
  confirmBooking,
  isValidDayPref,
  isValidTimePref,
} from "@/lib/book/bookings";

export const runtime = "nodejs";

/**
 * POST /api/book/confirm
 * Body: { name, email, whatsapp, weekKey, dayPref, timePref, slotStart }
 * -> { ok:true, bookingId, slotStart, slotEnd } | { ok:false, code, error }
 *
 * Server re-validates the week and re-checks the slot against fresh
 * free/busy before creating the booking (race guard).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const b = body as {
    name?: unknown;
    email?: unknown;
    whatsapp?: unknown;
    weekKey?: unknown;
    dayPref?: unknown;
    timePref?: unknown;
    slotStart?: unknown;
  };

  if (
    typeof b.name !== "string" ||
    typeof b.email !== "string" ||
    typeof b.whatsapp !== "string" ||
    typeof b.weekKey !== "string" ||
    typeof b.slotStart !== "string"
  ) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", error: "Missing booking details." },
      { status: 400 },
    );
  }
  if (!isValidDayPref(b.dayPref) || !isValidTimePref(b.timePref)) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", error: "Missing preferences." },
      { status: 400 },
    );
  }

  const now = new Date();
  const weekOption = getWeekOptions(now).find((o) => o.key === b.weekKey);
  if (!weekOption) {
    return NextResponse.json(
      { ok: false, code: "stale_week", error: "That week is no longer bookable." },
      { status: 409 },
    );
  }

  const slotStart = new Date(b.slotStart);
  if (Number.isNaN(slotStart.getTime())) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", error: "Invalid slot." },
      { status: 400 },
    );
  }

  const result = await confirmBooking({
    name: b.name,
    email: b.email,
    whatsapp: b.whatsapp,
    weekOption,
    dayPref: b.dayPref as DayPref,
    timePref: b.timePref as TimePref,
    slotStart,
    now,
  });

  if (!result.ok) {
    const status =
      result.code === "invalid_input" ? 400 : result.code === "slot_taken" ? 409 : 409;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
