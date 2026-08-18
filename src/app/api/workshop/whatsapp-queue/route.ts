import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron/cron-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Delivery queue for workshop blueprint PDFs sent over WhatsApp.
 *
 * The pyramid workshop captures an optional phone number; when present the
 * lead is queued here (`whatsappPdfRequestedAt` set) and a local delivery
 * worker (gateway cron on the iMac — the WhatsApp bridge owner) polls this
 * endpoint, downloads the PDF from `/api/workshop/pdf/<sessionId>`, sends it
 * via the bridge, then reports back with POST /complete.
 *
 * Auth: same contract as the other cron routes — `CRON_SECRET` header or
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * GET  /api/workshop/whatsapp-queue  -> pending leads (limit 25)
 * POST /api/workshop/whatsapp-queue  -> { leadId, ok, error? } mark sent / retry
 */
const MAX_ATTEMPTS = 5;
const PAGE_SIZE = 25;

type QueueMarkBody = {
  leadId?: unknown;
  ok?: unknown;
  error?: unknown;
};

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.workshopLead.findMany({
    where: {
      phone: { not: "" },
      whatsappPdfRequestedAt: { not: null },
      whatsappPdfSentAt: null,
      whatsappPdfAttempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      sessionId: true,
      name: true,
      phone: true,
      whatsappPdfRequestedAt: true,
      whatsappPdfAttempts: true,
      whatsappPdfError: true,
    },
  });

  return NextResponse.json({ ok: true, leads });
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: QueueMarkBody;
  try {
    body = (await request.json()) as QueueMarkBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!leadId) {
    return NextResponse.json({ ok: false, error: "leadId is required" }, { status: 400 });
  }

  const lead = await prisma.workshopLead.findUnique({
    where: { id: leadId },
    select: { id: true, whatsappPdfSentAt: true },
  });
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  if (body.ok === true) {
    // Mark delivered. Idempotent: a lead already marked sent stays sent.
    await prisma.workshopLead.update({
      where: { id: leadId },
      data: { whatsappPdfSentAt: new Date(), whatsappPdfError: null },
    });
    return NextResponse.json({ ok: true });
  }

  // Failure: count the attempt and record the error for admin visibility.
  const errorText =
    typeof body.error === "string" && body.error.length > 0
      ? body.error.slice(0, 500)
      : "Delivery failed";
  await prisma.workshopLead.update({
    where: { id: leadId },
    data: {
      whatsappPdfAttempts: { increment: 1 },
      whatsappPdfError: errorText,
    },
  });
  return NextResponse.json({ ok: true });
}
