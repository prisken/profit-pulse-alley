import "server-only";

/**
 * Booking service: slot suggestion + confirmation.
 *
 * confirmBooking pipeline:
 *   1. re-validate the week option is currently offerable
 *   2. re-check the chosen slot against fresh free/busy (race guard)
 *   3. persist Booking
 *   4. create the Google Calendar event
 *   5. send the branded confirmation email (existing email layer)
 *   6. queue the WhatsApp confirmation (gateway worker polls)
 */
import {
  generateCandidateSlots,
  getWeekOptions,
  pickThreeSlots,
  type BusyInterval,
  type CandidateSlot,
  type DayPref,
  type TimePref,
  type WeekOption,
} from "@/lib/book/availability";
import { createBookingEvent, getBusyIntervals } from "@/lib/book/google-calendar";
import { buildProductEmailBodies } from "@/lib/email/email-layout";
import { sendProductEmail } from "@/lib/email/email-sender";
import { addHktCalendarDays } from "@/lib/market-pulse/hkt-time";
import { logEmailAttempt } from "@/lib/notifications/email-log";
import { prisma } from "@/lib/prisma";

export const BOOKING_EMAIL_TYPE = "booking_confirmation" as const;

export function isValidDayPref(value: unknown): value is DayPref {
  return value === "weekday" || value === "weekend";
}

export function isValidTimePref(value: unknown): value is TimePref {
  return value === "office" || value === "after_office";
}

export function isValidWeekOption(option: WeekOption, now: Date): boolean {
  return getWeekOptions(now).some((o) => o.key === option.key);
}

/** Busy intervals covering the whole chosen week (Mon 00:00 → next Mon 00:00 HKT). */
export async function busyForWeek(mondayKey: string): Promise<BusyInterval[]> {
  const monday = new Date(`${mondayKey}T00:00:00.000Z`);
  const nextMonday = addHktCalendarDays(monday, 7);
  return getBusyIntervals(monday, nextMonday);
}

export async function suggestSlots(input: {
  weekOption: WeekOption;
  dayPref: DayPref;
  timePref: TimePref;
  now: Date;
}): Promise<CandidateSlot[]> {
  if (!isValidWeekOption(input.weekOption, input.now)) {
    throw new Error("That week is no longer bookable — please pick a fresh week.");
  }
  const busy = await busyForWeek(input.weekOption.key);
  const slots = generateCandidateSlots({
    mondayKey: input.weekOption.key,
    dayPref: input.dayPref,
    timePref: input.timePref,
    now: input.now,
    busy,
  });
  return pickThreeSlots(slots);
}

function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  if (/^\+?\d{8,15}$/.test(digits)) {
    return digits.startsWith("+") ? digits : `+${digits}`;
  }
  return value.trim();
}

export type ConfirmBookingInput = {
  name: string;
  email: string;
  whatsapp: string;
  weekOption: WeekOption;
  dayPref: DayPref;
  timePref: TimePref;
  slotStart: Date;
  now: Date;
};

export type ConfirmBookingResult =
  | { ok: true; bookingId: string; slotStart: Date; slotEnd: Date }
  | { ok: false; error: string; code?: string };

export async function confirmBooking(
  input: ConfirmBookingInput,
): Promise<ConfirmBookingResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const whatsapp = normalizePhone(input.whatsapp);

  if (!name || !email || !email.includes("@") || whatsapp.length < 8) {
    return { ok: false, code: "invalid_input", error: "Please check your contact details." };
  }
  if (!isValidDayPref(input.dayPref) || !isValidTimePref(input.timePref)) {
    return { ok: false, code: "invalid_input", error: "Invalid preferences." };
  }
  if (!isValidWeekOption(input.weekOption, input.now)) {
    return { ok: false, code: "stale_week", error: "That week is no longer bookable." };
  }

  // Race guard: re-check the exact slot against fresh free/busy.
  const busy = await busyForWeek(input.weekOption.key);
  const candidates = generateCandidateSlots({
    mondayKey: input.weekOption.key,
    dayPref: input.dayPref,
    timePref: input.timePref,
    now: input.now,
    busy,
  });
  const match = candidates.find(
    (s) => s.start.getTime() === input.slotStart.getTime(),
  );
  if (!match) {
    return {
      ok: false,
      code: "slot_taken",
      error: "That slot was just taken — please pick another.",
    };
  }

  const sessionMs = match.end.getTime() - match.start.getTime();

  const booking = await prisma.booking.create({
    data: {
      name,
      email,
      whatsapp,
      weekKey: input.weekOption.key,
      dayPref: input.dayPref,
      timePref: input.timePref,
      slotStart: match.start,
      slotEnd: match.end,
    },
  });

  // Calendar event (best-effort — booking stands even if calendar hiccups).
  try {
    const event = await createBookingEvent({
      summary: `1-on-1 Financial Analysis — ${name}`,
      description: [
        `Name: ${name}`,
        `Email: ${email}`,
        `WhatsApp: ${whatsapp}`,
        `Preferences: ${input.dayPref} / ${input.timePref}`,
        `Booking ID: ${booking.id}`,
      ].join("\n"),
      start: match.start,
      end: match.end,
      location: "Online (details sent after booking)",
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { calendarEventId: event.id, calendarLink: event.htmlLink },
    });
  } catch (error) {
    console.error("[booking] calendar event failed:", error);
  }

  // Confirmation email (branded, via existing email layer).
  const slotText = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(match.start);
  const bodies = buildProductEmailBodies({
    subject: `Your 1-on-1 Financial Analysis — ${slotText} (HKT)`,
    paragraphs: [
      `Thanks ${name} — your session is confirmed.`,
      `📅 ${slotText} (Hong Kong time, 60 minutes)`,
      `A member of the team will WhatsApp you at ${whatsapp} shortly before the session with the meeting link.`,
      `Got questions or need to move the time? Just reply to this email or message us on WhatsApp — no booking needed.`,
    ],
  });
  const emailResult = await sendProductEmail({ to: email, ...bodies });
  await logEmailAttempt({
    email,
    type: BOOKING_EMAIL_TYPE,
    status: emailResult.ok ? "sent" : "failed",
    providerMessageId: emailResult.ok ? emailResult.providerMessageId : undefined,
    error: emailResult.ok ? undefined : emailResult.error,
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      emailSentAt: emailResult.ok ? new Date() : null,
      emailError: emailResult.ok ? null : emailResult.error ?? null,
    },
  });

  // WhatsApp confirmation queue (gateway worker polls and delivers).
  try {
    await prisma.bookingWhatsAppQueue.create({
      data: { bookingId: booking.id, to: whatsapp },
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { whatsappQueuedAt: new Date() },
    });
  } catch (error) {
    console.error("[booking] whatsapp queue failed:", error);
  }

  return {
    ok: true,
    bookingId: booking.id,
    slotStart: match.start,
    slotEnd: match.end,
  };
}
