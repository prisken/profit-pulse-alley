import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";

/**
 * Canonical headcount bands. The landing form sends 1-2 / 3-10 (so the 3-19
 * PROTECT band is visible); 1-10 is kept for older submissions.
 */
const COMPANY_SIZES = ["1-2", "3-10", "1-10", "11-50", "51-200", "201-500", "500+"] as const;

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    companySize?: string;
    locale?: string;
    preferredContact?: string;
    role?: string;
    company?: string;
    renewalMonth?: string;
    existingPremium?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const companySize = String(body.companySize ?? "").trim();
  const locale = String(body.locale ?? "").trim() || null;
  const role = String(body.role ?? "").trim() || null;
  const company = String(body.company ?? "").trim() || null;
  const renewalMonth = String(body.renewalMonth ?? "").trim() || null;
  const existingPremium = String(body.existingPremium ?? "").trim() || null;
  const preferredContact =
    String(body.preferredContact ?? "email").trim().toLowerCase() === "whatsapp"
      ? "whatsapp"
      : "email";

  if (name.length < 2) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (preferredContact === "whatsapp" && phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ error: "phone required for WhatsApp" }, { status: 400 });
  }
  if (!COMPANY_SIZES.includes(companySize as (typeof COMPANY_SIZES)[number])) {
    return NextResponse.json({ error: "company size required" }, { status: 400 });
  }

  try {
    await prisma.groupMedicalLead.create({
      data: {
        name, role, company, email, phone: phone || null, companySize,
        renewalMonth, existingPremium, locale, preferredContact,
      },
    });
  } catch (error) {
    console.error("[group-medical] lead save failed:", error);
    return NextResponse.json({ error: "could not save lead" }, { status: 500 });
  }

  // Best-effort CRM handoff — the lead is already saved locally.
  try {
    await syncMemberSignupToCrm({
      userId: `group-medical-${Date.now()}`,
      email,
      name,
      contactNumber: phone || null,
      provider: "Profit Pulse Ally",
      role: "Group medical lead",
      source: `Group medical quote — ${companySize} staff${renewalMonth ? ` — renews ${renewalMonth}` : ""} — via ${preferredContact}`,
      signedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[group-medical] CRM sync failed:", error);
  }

  return NextResponse.json({ ok: true });
}
