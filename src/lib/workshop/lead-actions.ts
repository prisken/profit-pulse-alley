"use server";

import { prisma } from "@/lib/prisma";
import { validateWorkshopPhone } from "@/lib/workshop/phone";

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates and saves a WorkshopLead for the given session.
 * Phone is required (+852xxxxxxxx or international 8–15 digits).
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
      select: { id: true },
    });
    if (!session) {
      return { ok: false, error: "Workshop session not found. Please restart from intake." };
    }

    const lead = await prisma.workshopLead.upsert({
      where: { sessionId },
      create: {
        sessionId,
        name,
        email,
        phone: phoneResult.phone,
        selectedGoal,
      },
      update: {
        name,
        email,
        phone: phoneResult.phone,
        selectedGoal,
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
