import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";
import { getWebinarSeriesEvent } from "@/lib/events/webinar-series-2026";

/**
 * PPA Webinar Series 2026 registration.
 *
 * Forwarded to the same CRM signup pipeline as member registration, tagged as a
 * webinar registrant with the series week in the source so the CRM can segment
 * per session. Best-effort: a CRM hiccup must not lose the registrant's
 * confirmation, so the route still returns ok.
 */

interface RegisterBody {
  slug?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  locale?: string;
  answers?: Record<string, string>;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  const event = getWebinarSeriesEvent(slug);
  if (!event) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim() || null;
  const phone = String(body.phone ?? "").trim() || null;
  const company = String(body.company ?? "").trim();

  // Qualification answers are optional and only used to shape follow-up.
  const answers = body.answers ?? {};
  const answerBits = [
    answers.shareholders ? `shareholders ${answers.shareholders}` : "",
    answers.agreement ? `SA ${answers.agreement}` : "",
    answers.cover ? `keyman ${answers.cover}` : "",
    answers.concern ? `concern ${answers.concern}` : "",
  ].filter(Boolean);

  const source = `PPA Webinar Series 2026 — W${event.week} ${event.topicEn}${
    company ? ` — ${company}` : ""
  }${answerBits.length ? ` — ${answerBits.join("; ")}` : ""}`;

  if (Object.keys(answers).length) {
    console.info("[events/register] answers", { email, answers });
  }

  // Persist every registration so the admin console can track it. Best-effort:
  // a database hiccup must not cost the registrant their confirmation.
  try {
    await prisma.webinarRegistration.upsert({
      where: { slug_email: { slug, email } },
      create: {
        slug,
        week: event.week,
        name,
        email,
        phone,
        company: company || null,
        locale: String(body.locale ?? "").trim() || null,
        answers: (Object.keys(answers).length ? answers : undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      update: {
        name,
        phone,
        company: company || null,
        locale: String(body.locale ?? "").trim() || null,
        ...(Object.keys(answers).length
          ? { answers: answers as Prisma.InputJsonValue }
          : {}),
      },
    });
  } catch (error) {
    console.error("[events/register] registration persist failed:", error);
  }

  try {
    await syncMemberSignupToCrm({
      userId: `webinar-${event.week}-${Date.now()}`,
      email,
      name,
      contactNumber: phone,
      provider: "Profit Pulse Ally",
      role: "Webinar Registrant",
      source,
      signedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[events/register] CRM sync failed:", error);
  }

  return NextResponse.json({ ok: true, saved: true, week: event.week });
}
