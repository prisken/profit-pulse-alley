import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron/cron-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Delivery queue for booking confirmation WhatsApp messages.
 *
 * Flow: `confirmBooking` writes a BookingWhatsAppQueue row -> the local
 * gateway worker (iMac cron, owns the WhatsApp bridge) polls this endpoint,
 * sends the confirmation via the bridge, then reports back.
 *
 * Auth: `CRON_SECRET` header or `Authorization: Bearer <CRON_SECRET>`.
 *
 * GET  /api/book/whatsapp-queue  -> pending confirmations (limit 25)
 * POST /api/book/whatsapp-queue  -> { bookingId, ok, error? } mark sent / retry
 */
const MAX_ATTEMPTS = 5;
const PAGE_SIZE = 25;
/** Reminder window: send when the session starts in 23–25 hours. */
const REMINDER_WINDOW_HOURS = [23, 25] as const;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const pending = await prisma.bookingWhatsAppQueue.findMany({
    where: { status: "PENDING", attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: PAGE_SIZE,
    include: { booking: { select: { id: true, name: true, slotStart: true } } },
  });
  const now = Date.now();
  const [adminAlerts, reminders] = await Promise.all([
    // New bookings Prisken hasn't been pinged about yet (last 72h).
    prisma.booking.findMany({
      where: { status: "CONFIRMED", adminAlertSentAt: null, createdAt: { gte: new Date(now - 72 * 3600 * 1000) } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, name: true, email: true, whatsapp: true, slotStart: true, createdAt: true },
    }),
    // Client reminders: session starts in ~24h, not yet reminded.
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSentAt: null,
        slotStart: {
          gte: new Date(now + REMINDER_WINDOW_HOURS[0] * 3600 * 1000),
          lte: new Date(now + REMINDER_WINDOW_HOURS[1] * 3600 * 1000),
        },
      },
      orderBy: { slotStart: "asc" },
      take: PAGE_SIZE,
      select: { id: true, name: true, whatsapp: true, slotStart: true },
    }),
  ]);
  return NextResponse.json({
    ok: true,
    items: pending.map((q) => ({
      queueId: q.id,
      bookingId: q.bookingId,
      to: q.to,
      name: q.booking.name,
      slotStart: q.booking.slotStart.toISOString(),
    })),
    adminAlerts: adminAlerts.map((b) => ({
      bookingId: b.id,
      name: b.name,
      email: b.email,
      whatsapp: b.whatsapp,
      slotStart: b.slotStart.toISOString(),
      createdAt: b.createdAt.toISOString(),
    })),
    reminders: reminders.map((b) => ({
      bookingId: b.id,
      name: b.name,
      whatsapp: b.whatsapp,
      slotStart: b.slotStart.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let body: {
    bookingId?: unknown;
    ok?: unknown;
    error?: unknown;
    adminOk?: unknown;
    reminderOk?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  if (!bookingId) {
    return NextResponse.json({ ok: false, error: "Missing bookingId." }, { status: 400 });
  }

  const queue = await prisma.bookingWhatsAppQueue.findUnique({
    where: { bookingId },
  });
  if (!queue) {
    return NextResponse.json({ ok: false, error: "Unknown bookingId." }, { status: 404 });
  }

  if (body.ok === true) {
    const now = new Date();
    await prisma.$transaction([
      prisma.bookingWhatsAppQueue.update({
        where: { id: queue.id },
        data: { status: "SENT", sentAt: now },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { whatsappSentAt: now },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // Admin ping delivered — mark so it isn't re-sent.
  if (body.adminOk === true) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { adminAlertSentAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.adminOk === false) {
    return NextResponse.json({ ok: true, retry: true }); // not marked -> next poll retries
  }

  // 24h reminder delivered — mark so it isn't re-sent.
  if (body.reminderOk === true) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { reminderSentAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.reminderOk === false) {
    return NextResponse.json({ ok: true, retry: true });
  }

  // Failed attempt — retry until MAX_ATTEMPTS, then give up.
  const attempts = queue.attempts + 1;
  const error = typeof body.error === "string" ? body.error.slice(0, 500) : "send failed";
  await prisma.bookingWhatsAppQueue.update({
    where: { id: queue.id },
    data: {
      attempts,
      error,
      status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
    },
  });
  if (attempts >= MAX_ATTEMPTS) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { whatsappError: error },
    });
  }
  return NextResponse.json({ ok: true });
}
