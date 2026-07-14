import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron/cron-auth";
import { runMarketPulseReminderCron } from "@/lib/notifications/reminder-cron";

export const runtime = "nodejs";

/**
 * Protected cron: send Market Pulse reminder emails to opted-in users.
 * Auth: `CRON_SECRET` header or `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runMarketPulseReminderCron();
    return NextResponse.json({
      ok: true,
      opportunity: summary.opportunity,
      candidates: summary.candidates,
      attempted: summary.attempted,
      sent: summary.sent,
      skipped: summary.skipped,
      failed: summary.failed,
    });
  } catch (error) {
    console.error("[cron/market-pulse-reminders] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Reminder cron failed." },
      { status: 500 },
    );
  }
}
