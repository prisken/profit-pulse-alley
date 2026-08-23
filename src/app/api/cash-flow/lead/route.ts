import { NextResponse } from "next/server";
import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";

/**
 * Calculator lead gate — collects email before showing results.
 * Reuses the CRM member-sync webhook (same pattern as member signup),
 * tagged as "Calculator Lead / Cash Flow Interest".
 */
export async function POST(request: Request) {
  let body: { email?: string; monthly?: number; years?: number; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const monthly = Number(body.monthly) || 0;
  const years = Number(body.years) || 15;
  const locale = body.locale === "zh-Hant" ? "zh-Hant" : "en";

  try {
    await syncMemberSignupToCrm({
      userId: `cash-flow-${Date.now()}`,
      email,
      name: null,
      contactNumber: null,
      provider: "Profit Pulse Ally",
      role: "Calculator Lead",
      source: "Cash Flow Protector Calculator",
      signedUpAt: new Date().toISOString(),
    });
  } catch {
    // CRM sync is best-effort — never block the user's result on it.
    console.error("[cash-flow-lead] CRM sync failed");
  }

  return NextResponse.json({
    ok: true,
    meta: {
      monthly,
      years,
      locale,
      // Illustrated only — never presented as guaranteed.
      rateNote:
        "Illustrated rate 4–5% annual, within official illustration ranges for certain long-term participating products. Not guaranteed.",
    },
  });
}
