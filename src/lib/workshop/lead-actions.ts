"use server";

import { isProfileBehaviorMismatch } from "@/lib/workshop/action-goals-decisions";
import { parseGoalJourneyState } from "@/lib/workshop/goal-journey";
import { prisma } from "@/lib/prisma";
import { validateWorkshopPhone } from "@/lib/workshop/phone";
import type { CrisisStressTestSummary, RiskProfile } from "@/lib/workshop/types";

export type CaptureWorkshopLeadInput = {
  sessionId: string;
  name: string;
  email: string;
  phone: string;
  selectedGoal: string;
};

export type CaptureWorkshopLeadField = "name" | "email" | "phone" | "selectedGoal";

export type CaptureWorkshopLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string; field?: CaptureWorkshopLeadField };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VERDICTS = new Set(["SHIELDED", "PARTIAL", "PENETRATED"]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseRiskProfile(value: unknown): RiskProfile | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const profile = record.profile;
  if (
    profile === "conservative" ||
    profile === "balanced" ||
    profile === "aggressive"
  ) {
    return profile;
  }
  return null;
}

function parseStressTestVerdict(goalsJson: unknown): string | null {
  const record = asRecord(goalsJson);
  const stress = asRecord(record?.crisisStressTest);
  const verdict = stress?.verdict;
  if (typeof verdict === "string" && VERDICTS.has(verdict)) {
    return verdict;
  }
  return null;
}

/**
 * Validates and saves a WorkshopLead for the given session.
 * Phone is required (+852xxxxxxxx or international 8–15 digits).
 * Additive: stressTestVerdict + profileBehaviorMismatch from session JSON.
 */
export async function captureWorkshopLeadAction(
  input: CaptureWorkshopLeadInput,
): Promise<CaptureWorkshopLeadResult> {
  try {
    const sessionId = input.sessionId?.trim();
    if (!sessionId) {
      return { ok: false, error: "Session is missing. Please restart the workshop." };
    }

    const name = input.name?.trim();
    if (!name || name.length < 2) {
      return { ok: false, error: "Please enter your name.", field: "name" };
    }

    const email = normalizeEmail(input.email ?? "");
    if (!email || !EMAIL_RE.test(email)) {
      return {
        ok: false,
        error: "Please enter a valid email address.",
        field: "email",
      };
    }

    const selectedGoal = input.selectedGoal?.trim();
    if (!selectedGoal) {
      return {
        ok: false,
        error: "Please select a goal before capturing your blueprint.",
        field: "selectedGoal",
      };
    }

    const phoneResult = validateWorkshopPhone(input.phone ?? "");
    if (!phoneResult.ok) {
      return { ok: false, error: phoneResult.errorKey, field: "phone" };
    }

    const session = await prisma.workshopSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        goalsJson: true,
        riskQuizJson: true,
        goalJourneyJson: true,
      },
    });
    if (!session) {
      return { ok: false, error: "Workshop session not found. Please restart from intake." };
    }

    const stressTestVerdict = parseStressTestVerdict(session.goalsJson);
    const riskProfile = parseRiskProfile(session.riskQuizJson);
    const journey = parseGoalJourneyState(session.goalJourneyJson);
    const profileBehaviorMismatch =
      riskProfile != null
        ? isProfileBehaviorMismatch(riskProfile, journey)
        : null;

    // Satisfy TS when client hasn't regenerated Prisma types yet for additive cols.
    const additiveLeadFields: {
      stressTestVerdict: string | null;
      profileBehaviorMismatch: boolean | null;
    } = {
      stressTestVerdict,
      profileBehaviorMismatch,
    };

    const lead = await prisma.workshopLead.upsert({
      where: { sessionId },
      create: {
        sessionId,
        name,
        email,
        phone: phoneResult.phone,
        selectedGoal,
        ...additiveLeadFields,
      },
      update: {
        name,
        email,
        phone: phoneResult.phone,
        selectedGoal,
        ...additiveLeadFields,
      },
      select: { id: true },
    });

    return { ok: true, leadId: lead.id };
  } catch (error) {
    console.error("[workshop] captureWorkshopLeadAction failed:", error);
    return {
      ok: false,
      error: "workshop.capture.saveError",
    };
  }
}

/** @internal helper for tests — re-export shape check. */
export type CapturedLeadAdvisorContext = {
  stressTestVerdict: CrisisStressTestSummary["verdict"] | null;
  profileBehaviorMismatch: boolean | null;
};
