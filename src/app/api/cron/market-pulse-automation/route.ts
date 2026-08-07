import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron/cron-auth";
import type { AutomationResult } from "@/lib/market-pulse/cron-automation";
import {
  automationApprovePpa,
  automationCreateGuidedCycle,
  automationGetCycleStatus,
  automationGetStatus,
  automationLaunchCycle,
  automationPublishCard,
  automationPublishReadyCards,
  automationUnpublishCard,
  automationUpdateCard,
} from "@/lib/market-pulse/cron-automation";

export const runtime = "nodejs";

/**
 * Protected automation endpoint for the Market Pulse content pipeline.
 * Auth: `CRON_SECRET` header or `Authorization: Bearer <CRON_SECRET>`
 * (same contract as `/api/cron/market-pulse-reminders`).
 *
 * POST body: `{ action, input | cycleId }` where action is one of:
 * - `status`        -> cycle/card snapshot for the active cycle
 * - `createCycle`   -> create a guided DRAFT cycle with its day-plan cards
 * - `updateCard`    -> save card content (EN + optional zh-Hant)
 * - `approvePpa`    -> lock PPA signal + insight on a SIGNAL card
 * - `publishCards`  -> publish every currently-ready card in a cycle
 * - `launchCycle`   -> guided launch (publish ready, open, pin active, runtime OPEN)
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "";

    let result: AutomationResult<unknown>;
    switch (action) {
      case "status":
        result = await automationGetStatus();
        break;
      case "cycleStatus":
        result = await automationGetCycleStatus(body.cycleId);
        break;
      case "createCycle":
        result = await automationCreateGuidedCycle(body.input);
        break;
      case "updateCard":
        result = await automationUpdateCard(body.input);
        break;
      case "approvePpa":
        result = await automationApprovePpa(body.input);
        break;
      case "publishCards":
        result = await automationPublishReadyCards(body.cycleId);
        break;
      case "publishCard":
        result = await automationPublishCard(body.cardId);
        break;
      case "unpublishCard":
        result = await automationUnpublishCard(body.cardId);
        break;
      case "launchCycle":
        result = await automationLaunchCycle(body.cycleId);
        break;
      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[cron/market-pulse-automation] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Automation request failed." },
      { status: 500 },
    );
  }
}

/** Status snapshot for pipeline verification (also CRON_SECRET-guarded). */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await automationGetStatus();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
