/**
 * The Pitch Meeting — ADMIN-only lead list.
 * Parses each lead's journeyJson into readable, filterable fields.
 */

import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ARCHETYPES,
  METRICS,
  POSTURES,
  ROUNDS,
  getModule,
  type ArchetypeKey,
  type BandKey,
  type PostureKey,
  type RoundKey,
} from "@/lib/pitch-game/content";
import { formatValue } from "@/lib/pitch-game/logic";

export type PitchAdminInputCell = {
  key: string;
  label: string;
  value: string;
};

export type PitchAdminLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  concern: string | null;
  createdAt: string;
  archetypeKey: ArchetypeKey | null;
  archetypeLabel: string | null;
  archetypeEmoji: string | null;
  metricLabel: string | null;
  roundLabel: string | null;
  band: BandKey | null;
  postureLabel: string | null;
  condition: string | null;
  reaction: string | null;
  automationFix: string | null;
  inputs: PitchAdminInputCell[];
  rawJourney: Record<string, unknown> | null;
};

export type PitchAdminListData = {
  adminEmail: string;
  totalLeads: number;
  leads: PitchAdminLeadRow[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isArchetypeKey(value: string | null): value is ArchetypeKey {
  return value !== null && value in ARCHETYPES;
}

function isRoundKey(value: string | null): value is RoundKey {
  return value !== null && value in ROUNDS;
}

function isPostureKey(value: string | null): value is PostureKey {
  return value !== null && value in POSTURES;
}

function isBandKey(value: string | null): value is BandKey {
  return value === "green" || value === "amber" || value === "red";
}

function parseJourney(journeyJson: unknown): {
  moduleId: string | null;
  archetypeKey: ArchetypeKey | null;
  metricKey: string | null;
  roundKey: RoundKey | null;
  band: BandKey | null;
  postureKey: PostureKey | null;
  reaction: string | null;
  condition: string | null;
  automationFix: string | null;
  inputsRaw: Record<string, unknown> | null;
  raw: Record<string, unknown> | null;
} {
  const journey = asRecord(journeyJson);
  if (!journey) {
    return {
      moduleId: null,
      archetypeKey: null,
      metricKey: null,
      roundKey: null,
      band: null,
      postureKey: null,
      reaction: null,
      condition: null,
      automationFix: null,
      inputsRaw: null,
      raw: null,
    };
  }
  const archetypeKey = asString(journey.archetype);
  const roundKey = asString(journey.roundKey);
  const postureKey = asString(journey.posture);
  const band = asString(journey.band);
  return {
    moduleId: asString(journey.moduleId),
    archetypeKey: isArchetypeKey(archetypeKey) ? archetypeKey : null,
    metricKey: asString(journey.metric),
    roundKey: isRoundKey(roundKey) ? roundKey : null,
    band: isBandKey(band) ? band : null,
    postureKey: isPostureKey(postureKey) ? postureKey : null,
    reaction: asString(journey.reaction),
    condition: asString(journey.condition),
    automationFix: asString(journey.automationFix),
    inputsRaw: asRecord(journey.inputs),
    raw: journey,
  };
}

function buildInputCells(
  moduleId: string | null,
  inputsRaw: Record<string, unknown> | null,
): PitchAdminInputCell[] {
  const mod = moduleId ? getModule(moduleId) : undefined;
  if (!mod || !inputsRaw) {
    return [];
  }
  return mod.fields.map((field) => {
    const raw = inputsRaw[field.key];
    const value =
      typeof raw === "number" && Number.isFinite(raw)
        ? formatValue(raw, field.kind)
        : "—";
    return { key: field.key, label: field.label.en, value };
  });
}

function toRow(lead: {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  concern: string | null;
  createdAt: Date;
  journeyJson: unknown;
}): PitchAdminLeadRow {
  const j = parseJourney(lead.journeyJson);
  const mod = j.moduleId ? getModule(j.moduleId) : undefined;
  const metricLabel =
    mod && j.metricKey
      ? METRICS[mod.archetype].find((m) => m.key === j.metricKey)?.title.en ??
        null
      : null;

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    concern: lead.concern,
    createdAt: lead.createdAt.toISOString(),
    archetypeKey: j.archetypeKey,
    archetypeLabel: j.archetypeKey ? ARCHETYPES[j.archetypeKey].title.en : null,
    archetypeEmoji: j.archetypeKey ? ARCHETYPES[j.archetypeKey].emoji : null,
    metricLabel,
    roundLabel: j.roundKey ? ROUNDS[j.roundKey].label.en : null,
    band: j.band,
    postureLabel: j.postureKey ? POSTURES[j.postureKey].title.en : null,
    condition: j.condition,
    reaction: j.reaction,
    automationFix: j.automationFix,
    inputs: buildInputCells(j.moduleId, j.inputsRaw),
    rawJourney: j.raw,
  };
}

/**
 * ADMIN-only Pitch Meeting lead list.
 */
export async function getPitchAdminLeadsData(): Promise<PitchAdminListData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const rows = await prisma.pitchMeetingLead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    adminEmail: admin.email,
    totalLeads: rows.length,
    leads: rows.map((row) => toRow(row)),
  };
}
