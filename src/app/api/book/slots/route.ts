import { NextResponse } from "next/server";

import { getWeekOptions, slotLabels, type DayPref, type TimePref } from "@/lib/book/availability";
import { suggestSlots, isValidDayPref, isValidTimePref } from "@/lib/book/bookings";

export const runtime = "nodejs";

/**
 * POST /api/book/slots
 * Body: { weekKey, dayPref, timePref }
 * -> { ok, slots: [{ start, end, dayLabel, timeLabel }] } (up to 3, from 3 days)
 *    or { ok:false, code:"stale_week"|"invalid_input"|"no_slots", error }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const weekKey = (body as { weekKey?: unknown }).weekKey;
  const dayPref = (body as { dayPref?: unknown }).dayPref;
  const timePref = (body as { timePref?: unknown }).timePref;
  const variantRaw = (body as { variant?: unknown }).variant;
  const locale = (body as { locale?: unknown }).locale === "zh-Hant" ? "zh-Hant" : "en";
  const variant =
    typeof variantRaw === "number" && Number.isInteger(variantRaw) && variantRaw >= 0
      ? variantRaw
      : 0;

  if (typeof weekKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(weekKey)) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", error: "Missing week." },
      { status: 400 },
    );
  }
  if (!isValidDayPref(dayPref) || !isValidTimePref(timePref)) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", error: "Missing preferences." },
      { status: 400 },
    );
  }

  const now = new Date();
  const weekOption = getWeekOptions(now).find((o) => o.key === weekKey);
  if (!weekOption) {
    return NextResponse.json(
      { ok: false, code: "stale_week", error: "That week is no longer bookable." },
      { status: 409 },
    );
  }

  try {
    const slots = await suggestSlots({
      weekOption,
      dayPref: dayPref as DayPref,
      timePref: timePref as TimePref,
      now,
      variant,
    });
    // Empty (not an error) = that page has no more choices. The client shows
    // the "no more / see first options again" loop instead of a dead end.
    return NextResponse.json({
      ok: true,
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        ...slotLabels(s, locale),
      })),
    });
  } catch (error) {
    console.error("[book/slots] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load availability right now." },
      { status: 502 },
    );
  }
}
