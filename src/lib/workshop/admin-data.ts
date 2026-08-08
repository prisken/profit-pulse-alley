import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { parseMacroResultJson } from "@/lib/workshop/macro-result";
import { prisma } from "@/lib/prisma";
import type { RiskProfile } from "@/lib/workshop/types";

export type WorkshopAdminLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  selectedGoal: string | null;
  stressTestVerdict: string | null;
  profileBehaviorMismatch: boolean | null;
  createdAt: string;
  industry: string;
  age: number;
  retirementAge: number | null;
  monthlyIncomeHKD: number | null;
  assetsDepletedAtAge: number | null;
  weakestLayer: string | null;
  riskProfile: RiskProfile | null;
  ratingScore: number | null;
  /** Raw session JSONs (what the user entered) for the admin detail view. */
  sessionJson: {
    finalPyramid: unknown;
    aiPyramid: unknown;
    expenses: unknown;
    riskQuiz: unknown;
    goals: unknown;
    crisis: unknown;
    macroResult: unknown;
    goalJourney: unknown;
  } | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseWeakestLayer(value: unknown): string | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const layer = record.weakestLayer;
  return typeof layer === "string" && layer.trim() ? layer.trim() : null;
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

function parseRatingScore(value: unknown): number | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const rating = asRecord(record.rating);
  if (!rating) {
    return null;
  }
  const score = rating.score;
  if (typeof score === "number" && Number.isFinite(score)) {
    return score;
  }
  return null;
}

function parseAssetsDepletedAtAge(macroResultJson: unknown): number | null {
  const parsed = parseMacroResultJson(macroResultJson);
  if (parsed?.kind !== "lifeTimeline") {
    return null;
  }
  return parsed.timeline.retirement.assetsDepletedAtAge;
}

export type WorkshopAdminListData = {
  adminEmail: string;
  leads: WorkshopAdminLeadRow[];
};

/**
 * ADMIN-only Workshop Pyramid Lab lead list (joined with session profile).
 */
export async function getWorkshopAdminLeadsData(): Promise<WorkshopAdminListData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const leads = await prisma.workshopLead.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      selectedGoal: true,
      stressTestVerdict: true,
      profileBehaviorMismatch: true,
      createdAt: true,
      session: {
        select: {
          industry: true,
          age: true,
          retirementAge: true,
          monthlyIncome: true,
          finalPyramidJson: true,
          aiPyramidJson: true,
          riskQuizJson: true,
          goalsJson: true,
          macroResultJson: true,
          expensesJson: true,
          crisisJson: true,
          goalJourneyJson: true,
        },
      },
    },
  });

  return {
    adminEmail: admin.email,
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      selectedGoal: lead.selectedGoal,
      stressTestVerdict: lead.stressTestVerdict ?? null,
      profileBehaviorMismatch: lead.profileBehaviorMismatch ?? null,
      createdAt: lead.createdAt.toISOString(),
      industry: lead.session.industry,
      age: lead.session.age,
      retirementAge: lead.session.retirementAge ?? null,
      monthlyIncomeHKD: Number.isFinite(lead.session.monthlyIncome)
        ? lead.session.monthlyIncome
        : null,
      assetsDepletedAtAge: parseAssetsDepletedAtAge(
        lead.session.macroResultJson,
      ),
      weakestLayer:
        parseWeakestLayer(lead.session.finalPyramidJson) ??
        parseWeakestLayer(lead.session.aiPyramidJson),
      riskProfile: parseRiskProfile(lead.session.riskQuizJson),
      ratingScore: parseRatingScore(lead.session.goalsJson),
      sessionJson: {
        finalPyramid: lead.session.finalPyramidJson,
        aiPyramid: lead.session.aiPyramidJson,
        expenses: lead.session.expensesJson,
        riskQuiz: lead.session.riskQuizJson,
        goals: lead.session.goalsJson,
        crisis: lead.session.crisisJson,
        macroResult: lead.session.macroResultJson,
        goalJourney: lead.session.goalJourneyJson,
      },
    })),
  };
}
