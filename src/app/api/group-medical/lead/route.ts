import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    companySize?: string;
    locale?: string;
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

  if (name.length < 2) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ error: "valid phone required" }, { status: 400 });
  }
  if (!COMPANY_SIZES.includes(companySize as (typeof COMPANY_SIZES)[number])) {
    return NextResponse.json({ error: "company size required" }, { status: 400 });
  }

  try {
    await prisma.groupMedicalLead.create({
      data: { name, email, phone, companySize, locale },
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
      contactNumber: phone,
      provider: "Profit Pulse Ally",
      role: "Group medical lead",
      source: `Group medical quote — ${companySize} staff`,
      signedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[group-medical] CRM sync failed:", error);
  }

  return NextResponse.json({ ok: true });
}
