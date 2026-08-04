import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prisma } from "@/lib/prisma";
import type { RiskProfile } from "@/lib/workshop/types";

export type WorkshopAdminLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  selectedGoal: string | null;
  createdAt: string;
  industry: string;
  age: number;
  weakestLayer: string | null;
  riskProfile: RiskProfile | null;
  ratingScore: number | null;
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
      createdAt: true,
      session: {
        select: {
          industry: true,
          age: true,
          finalPyramidJson: true,
          aiPyramidJson: true,
          riskQuizJson: true,
          goalsJson: true,
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
      createdAt: lead.createdAt.toISOString(),
      industry: lead.session.industry,
      age: lead.session.age,
      weakestLayer:
        parseWeakestLayer(lead.session.finalPyramidJson) ??
        parseWeakestLayer(lead.session.aiPyramidJson),
      riskProfile: parseRiskProfile(lead.session.riskQuizJson),
      ratingScore: parseRatingScore(lead.session.goalsJson),
    })),
  };
}
