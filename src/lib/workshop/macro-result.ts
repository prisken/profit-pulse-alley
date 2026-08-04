/**
 * Persisted `macroResultJson` shapes for Workshop Pyramid Lab.
 * v3 life-timeline replaces the legacy StressTestResult blob (still readable).
 */

import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  LayerFlag,
  PyramidState,
  StressTestNote,
  StressTestResult,
} from "@/lib/workshop/types";

/** Discriminator for v3 life-timeline payloads in WorkshopSession.macroResultJson. */
export const MACRO_RESULT_VERSION_LIFE_TIMELINE = "lifeTimeline" as const;

export type LifeTimelineMacroResult = {
  version: typeof MACRO_RESULT_VERSION_LIFE_TIMELINE;
  timeline: TimelineResult;
  notes?: StressTestNote[];
};

export type ParsedMacroResult =
  | {
      kind: "lifeTimeline";
      timeline: TimelineResult;
      notes: StressTestNote[];
    }
  | {
      kind: "legacy";
      stressTest: StressTestResult;
      notes: StressTestNote[];
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseLayerFlag(value: unknown): LayerFlag {
  if (value === "green" || value === "amber" || value === "red") {
    return value;
  }
  return "amber";
}

function parseNotes(value: unknown): StressTestNote[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const notes: StressTestNote[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row || typeof row.id !== "string" || !row.id.trim()) {
      continue;
    }
    const noteRaw = asRecord(row.note);
    if (
      !noteRaw ||
      typeof noteRaw.en !== "string" ||
      typeof noteRaw.zhHant !== "string"
    ) {
      continue;
    }
    notes.push({
      id: row.id.trim(),
      note: { en: noteRaw.en, zhHant: noteRaw.zhHant },
    });
  }
  return notes;
}

function isTimelineResult(value: unknown): value is TimelineResult {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.rows) || !Array.isArray(record.goals)) {
    return false;
  }
  const ef = asRecord(record.emergencyFund);
  const retirement = asRecord(record.retirement);
  return Boolean(ef && retirement);
}

/**
 * Map a life-timeline result into the legacy StressTestResult shape used by
 * crisis overlay, financial rating, and PDF sections that still expect v2 fields.
 */
export function timelineToLegacyStressTest(
  timeline: TimelineResult,
  pyramid: PyramidState,
): StressTestResult {
  const startAge = timeline.rows[0]?.age ?? 0;
  const startYear = timeline.rows[0]?.year ?? new Date().getFullYear();

  const efStatus: LayerFlag =
    timeline.emergencyFund.status === "oversaved"
      ? "amber"
      : timeline.emergencyFund.status;

  return {
    monthlySurplusByYear: timeline.rows.map((row, index) => ({
      year: index + 1,
      income: row.totalIncome,
      expenses: row.expenses,
      surplus: row.surplus,
    })),
    emergencyFundProjection: {
      targetMonths: timeline.emergencyFund.targetMonths,
      projectedMonths:
        efStatus === "green" || timeline.emergencyFund.status === "oversaved"
          ? 0
          : Math.max(1, Math.round(timeline.emergencyFund.targetMonths * 12)),
      status: efStatus,
    },
    goalProjections: timeline.goals.map((g) => {
      const fromPyramid = pyramid.goals.goals.find((p) => p.id === g.goalId);
      return {
        goalId: g.goalId,
        label: fromPyramid?.label ?? {
          en: g.goalId,
          zhHant: g.goalId,
        },
        icon: fromPyramid?.icon ?? "Target",
        targetAmountHKD: Math.round(g.inflatedTargetHKD),
        targetYear: startYear + (g.targetAge - startAge),
        goalType: "spend",
        projectedYear:
          g.attainedAtAge == null
            ? null
            : startYear + (g.attainedAtAge - startAge),
        status: g.status,
      };
    }),
  };
}

/**
 * Parse stored macroResultJson — v3 life-timeline or legacy StressTestResult.
 * Returns null when the blob is empty / unusable (caller may recompute).
 */
export function parseMacroResultJson(value: unknown): ParsedMacroResult | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const notes = parseNotes(record.notes);

  if (
    record.version === MACRO_RESULT_VERSION_LIFE_TIMELINE &&
    isTimelineResult(record.timeline)
  ) {
    return {
      kind: "lifeTimeline",
      timeline: record.timeline,
      notes,
    };
  }

  // Legacy: StressTestResult (+ optional notes) without version field.
  const ef = asRecord(record.emergencyFundProjection);
  const goalsRaw = Array.isArray(record.goalProjections)
    ? record.goalProjections
    : [];
  const surplusRaw = Array.isArray(record.monthlySurplusByYear)
    ? record.monthlySurplusByYear
    : [];

  if (!ef && goalsRaw.length === 0 && surplusRaw.length === 0) {
    return null;
  }

  const goalProjections = goalsRaw
    .map((item) => {
      const row = asRecord(item);
      if (!row || typeof row.goalId !== "string") {
        return null;
      }
      const label = asRecord(row.label);
      if (
        !label ||
        typeof label.en !== "string" ||
        typeof label.zhHant !== "string"
      ) {
        return null;
      }
      return {
        goalId: row.goalId,
        label: { en: label.en, zhHant: label.zhHant },
        icon: typeof row.icon === "string" ? row.icon : "Target",
        targetAmountHKD: asFiniteNumber(row.targetAmountHKD),
        targetYear: Math.round(asFiniteNumber(row.targetYear)),
        goalType: "spend",
        projectedYear:
          row.projectedYear === null || row.projectedYear === undefined
            ? null
            : Math.round(asFiniteNumber(row.projectedYear)),
        status: parseLayerFlag(row.status),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return {
    kind: "legacy",
    notes,
    stressTest: {
      monthlySurplusByYear: surplusRaw
        .map((item) => {
          const row = asRecord(item);
          if (!row) {
            return null;
          }
          return {
            year: Math.round(asFiniteNumber(row.year)),
            income: asFiniteNumber(row.income),
            expenses: asFiniteNumber(row.expenses),
            surplus: asFiniteNumber(row.surplus),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
      emergencyFundProjection: {
        targetMonths: asFiniteNumber(ef?.targetMonths, 6),
        projectedMonths: asFiniteNumber(ef?.projectedMonths),
        status: parseLayerFlag(ef?.status),
      },
      goalProjections,
    },
  };
}

/** Resolve a StressTestResult for PDF / rating consumers regardless of stored version. */
export function stressTestFromMacroResult(
  value: unknown,
  pyramid: PyramidState | null,
): StressTestResult | null {
  const parsed = parseMacroResultJson(value);
  if (!parsed) {
    return null;
  }
  if (parsed.kind === "legacy") {
    return parsed.stressTest;
  }
  if (!pyramid) {
    return timelineToLegacyStressTest(parsed.timeline, {
      protection: { medicalCoveragePercent: 0, criticalIllnessAmountHKD: 0 },
      emergencyFund: { savedAmountHKD: 0 },
      goals: { goals: [] },
      investment: {
        riskAllocation: { low: 100, mid: 0, high: 0 },
        lumpSumHKD: 0,
        monthlyInvestmentHKD: 0,
        monthlyFunHKD: 0,
      },
    });
  }
  return timelineToLegacyStressTest(parsed.timeline, pyramid);
}
