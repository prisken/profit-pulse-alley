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
  return NextResponse.json({
    ok: true,
    items: pending.map((q) => ({
      queueId: q.id,
      bookingId: q.bookingId,
      to: q.to,
      name: q.booking.name,
      slotStart: q.booking.slotStart.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let body: { bookingId?: unknown; ok?: unknown; error?: unknown };
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
