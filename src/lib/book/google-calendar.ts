import "server-only";

/**
 * Google Calendar access for booking (server-side).
 *
 * Env (see .env.production / Vercel):
 *   GOG_CLIENT_ID              — OAuth client id (same project as sheets sync)
 *   GOG_CLIENT_SECRET          — OAuth client secret
 *   GOG_CALENDAR_REFRESH_TOKEN — refresh token with calendar + calendar.events scopes
 *   GOG_CALENDAR_ID            — calendar to read free/busy + write events (default priskenlo@gmail.com)
 */
import type { BusyInterval } from "@/lib/book/availability";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FREE_BUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
const CALENDAR_EVENTS_URL = (calendarId: string) =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

function requireEnv(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  busyCalendarIds: string[];
} {
  const clientId = process.env.GOG_CLIENT_ID?.trim();
  const clientSecret = process.env.GOG_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOG_CALENDAR_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Booking calendar is not configured (GOG_CLIENT_ID / GOG_CLIENT_SECRET / GOG_CALENDAR_REFRESH_TOKEN).",
    );
  }
  const calendarId = process.env.GOG_CALENDAR_ID?.trim() || "priskenlo@gmail.com";
  const busyIds = (process.env.GOG_CALENDAR_BUSY_IDS?.trim() || `${calendarId},priskenlo@gmail.com`)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { clientId, clientSecret, refreshToken, calendarId, busyCalendarIds: busyIds };
}

async function fetchAccessToken(): Promise<{ access_token: string; expires_in?: number }> {
  const { clientId, clientSecret, refreshToken } = requireEnv();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token refresh failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as { access_token: string; expires_in?: number };
}

export async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAtMs - 60_000) {
    return cachedAccessToken.token;
  }
  const tokens = await fetchAccessToken();
  const expiresInMs = (tokens.expires_in ?? 3600) * 1000;
  cachedAccessToken = { token: tokens.access_token, expiresAtMs: Date.now() + expiresInMs };
  return tokens.access_token;
}

/** Busy intervals across the busy calendars (PPA 1-on-1 + Prisken's main). */
export async function getBusyIntervals(from: Date, to: Date): Promise<BusyInterval[]> {
  const { busyCalendarIds } = requireEnv();
  const token = await getGoogleAccessToken();
  const res = await fetch(FREE_BUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: "Asia/Hong_Kong",
      items: busyCalendarIds.map((id) => ({ id })),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google free/busy failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  const busy: BusyInterval[] = [];
  for (const id of busyCalendarIds) {
    for (const b of data.calendars?.[id]?.busy ?? []) {
      busy.push({ start: new Date(b.start), end: new Date(b.end) });
    }
  }
  return busy;
}

export type BookingEventInput = {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
};

export async function createBookingEvent(
  input: BookingEventInput,
): Promise<{ id: string; htmlLink: string }> {
  const { calendarId } = requireEnv();
  const token = await getGoogleAccessToken();
  const res = await fetch(CALENDAR_EVENTS_URL(calendarId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start.toISOString(), timeZone: "Asia/Hong_Kong" },
      end: { dateTime: input.end.toISOString(), timeZone: "Asia/Hong_Kong" },
      transparency: "opaque",
      visibility: "private",
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 * 24 },
          { method: "popup", minutes: 30 },
        ],
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google event create failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string; htmlLink?: string };
  return { id: data.id, htmlLink: data.htmlLink ?? "" };
}
