import { NextResponse } from "next/server";
import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";

/**
 * AI Gateway demo lead capture — the "phone home" endpoint.
 *
 * The standalone PPA AI Gateway kit (runs on a customer's machine) POSTs leads
 * here when its config.json has `leads.endpoint` set to
 * https://profitpulseally.com/api/lead. Same CRM pipeline as member signup,
 * tagged as an AI Gateway lead so it can be triaged separately.
 *
 * Called server-to-server from the kit (no CORS needed), but CORS headers are
 * included anyway for direct browser use.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-webhook-secret",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    company?: string;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const company = String(body.company ?? "").trim();
  const source = String(body.source ?? "AI Gateway Demo").trim();

  try {
    await syncMemberSignupToCrm({
      userId: `gateway-${Date.now()}`,
      email,
      name: String(body.name ?? "").trim() || null,
      contactNumber: null,
      provider: "Profit Pulse Ally",
      role: "AI Gateway Lead",
      source: company ? `${source} — ${company}` : source,
      signedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    // CRM sync is best-effort — never fail the lead save on it.
    console.error("[ai-gateway-lead] CRM sync failed:", error);
  }

  const response = NextResponse.json({ ok: true, saved: true });
  Object.entries(CORS_HEADERS).forEach(([k, v]) =>
    response.headers.set(k, v),
  );
  return response;
}
