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

/**
 * Minimal pyramid JSON so the PDF route can render a (sparse) blueprint for
 * smoke-test sessions. A real player session carries full state. Shape = v4
 * (normalizePyramidState reads PyramidState directly: protection /
 * emergencyFund / goals.goals[] / investment.riskAllocation).
 */
const TEST_PYRAMID = {
  protection: { medicalCoveragePercent: 0, criticalIllnessAmountHKD: 0 },
  emergencyFund: { savedAmountHKD: 0 },
  goals: { goals: [] },
  investment: {
    riskAllocation: { low: 33, mid: 34, high: 33 },
    lumpSumHKD: 0,
  },
};

type QueueMarkBody = {
  leadId?: unknown;
  ok?: unknown;
  error?: unknown;
  action?: unknown;
  phone?: unknown;
};

/**
 * Old leads may hold a bare 8-digit HK number ("60713746") from before
 * phone normalization. The WhatsApp bridge needs E.164, so expand those
 * at read time — belt and braces next to validateWorkshopPhone.
 */
function toE164(phone: string): string {
  const p = phone.replace(/[\s\-()]/g, "");
  return /^\d{8}$/.test(p) ? `+852${p}` : p;
}

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

  const normalized = leads.map((lead) => ({
    ...lead,
    phone: toE164(lead.phone),
  }));

  return NextResponse.json({ ok: true, leads: normalized });
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

  // Smoke-test helper: fabricate a minimal session + lead queued for WhatsApp
  // delivery. Lets the delivery worker (and Prisken) verify the full chain
  // (queue -> PDF -> bridge -> WhatsApp) without completing a whole game.
  if (body.action === "test") {
    const phone =
      typeof body.phone === "string" ? body.phone.trim().replace(/\s+/g, "") : "";
    if (!/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json(
        { ok: false, error: "phone must be E.164 like +85260147819" },
        { status: 400 },
      );
    }
    const session = await prisma.workshopSession.create({
      data: {
        age: 35,
        retirementAge: 65,
        monthlyIncome: 50_000,
        industry: "Test",
        tone: "professional",
        aiPyramidJson: TEST_PYRAMID,
        finalPyramidJson: TEST_PYRAMID,
      },
      select: { id: true },
    });
    const lead = await prisma.workshopLead.create({
      data: {
        sessionId: session.id,
        name: "Test Lead",
        email: "",
        phone,
        selectedGoal: "Smoke test",
        whatsappPdfRequestedAt: new Date(),
      },
      select: { id: true },
    });
    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      sessionId: session.id,
      pdfUrl: `/api/workshop/pdf/${encodeURIComponent(session.id)}`,
    });
  }

  // Re-queue a lead that was already marked sent (or errored) so the delivery
  // worker retries it — used when a delivery went to a malformed number or
  // needs a manual re-push. Resets attempts so it gets a fresh budget.
  if (body.action === "requeue") {
    const leadId = typeof body.leadId === "string" ? body.leadId : "";
    if (!leadId) {
      return NextResponse.json({ ok: false, error: "leadId is required" }, { status: 400 });
    }
    const existing = await prisma.workshopLead.findUnique({
      where: { id: leadId },
      select: { id: true, phone: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }
    if (!existing.phone) {
      return NextResponse.json(
        { ok: false, error: "Lead has no phone; nothing to re-queue" },
        { status: 400 },
      );
    }
    await prisma.workshopLead.update({
      where: { id: leadId },
      data: {
        whatsappPdfSentAt: null,
        whatsappPdfAttempts: 0,
        whatsappPdfError: null,
        whatsappPdfRequestedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, leadId });
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
