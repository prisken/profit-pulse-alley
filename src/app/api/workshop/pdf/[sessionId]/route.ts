import { NextResponse } from "next/server";

import {
  generateWorkshopBlueprintPdf,
  type BlueprintPdfInput,
} from "@/lib/workshop/generate-pdf";
import { coerceBilingual } from "@/lib/workshop/bilingual";
import { getServerSiteLocale } from "@/lib/i18n/server";
import {
  buildPyramidBenchmarks,
  computeLayerFlags,
} from "@/lib/workshop/pyramid-benchmarks";
import { prisma } from "@/lib/prisma";
import type {
  ActionGoal,
  Bilingual,
  CrisisState,
  ExpenseCategoryKey,
  ExpensesState,
  LayerFlag,
  PyramidState,
  RiskProfile,
  RiskQuizState,
  StressTestResult,
  SummaryRatingLabelKey,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

const WORKSHOP_TONES = new Set<WorkshopTone>([
  "fun",
  "professional",
  "simple",
  "direct",
  "warm",
]);

const EXPENSE_CATEGORY_KEYS = new Set<ExpenseCategoryKey>([
  "housing",
  "food_living",
  "transport",
  "insurance",
  "discretionary",
]);

const SUMMARY_LABEL_KEYS = new Set<SummaryRatingLabelKey>([
  "needsAttention",
  "goodRoomToGrow",
  "strongFoundation",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function tryCoerceBilingual(value: unknown, field: string): Bilingual | null {
  try {
    return coerceBilingual(value, field);
  } catch {
    return null;
  }
}

function parseTone(value: unknown): WorkshopTone {
  if (typeof value === "string" && WORKSHOP_TONES.has(value as WorkshopTone)) {
    return value as WorkshopTone;
  }
  return "professional";
}

function parseExpenseCategoryKey(value: unknown): ExpenseCategoryKey | null {
  if (typeof value === "string" && EXPENSE_CATEGORY_KEYS.has(value as ExpenseCategoryKey)) {
    return value as ExpenseCategoryKey;
  }
  return null;
}

function parseSummaryLabelKey(value: unknown): SummaryRatingLabelKey {
  if (typeof value === "string" && SUMMARY_LABEL_KEYS.has(value as SummaryRatingLabelKey)) {
    return value as SummaryRatingLabelKey;
  }
  return "needsAttention";
}

function parsePyramid(value: unknown): PyramidState | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const protection = asRecord(record.protection);
  const emergencyFund = asRecord(record.emergencyFund);
  const goalsRoot = asRecord(record.goals);
  const investment = asRecord(record.investment);
  const risk = asRecord(investment?.riskAllocation);

  if (!protection || !emergencyFund || !goalsRoot || !investment || !risk) {
    return null;
  }

  const goalsRaw = Array.isArray(goalsRoot.goals) ? goalsRoot.goals : [];
  const goals = goalsRaw
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const id = String(row.id ?? "");
      const label = tryCoerceBilingual(row.label, "goal.label");
      if (!id || !label) {
        return null;
      }
      return {
        id,
        icon: String(row.icon ?? "Target"),
        label,
        targetAmountHKD: asFiniteNumber(row.targetAmountHKD),
        targetYear: Math.round(asFiniteNumber(row.targetYear)),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return {
    protection: {
      medicalCoveragePercent: asFiniteNumber(protection.medicalCoveragePercent),
      criticalIllnessAmountHKD: asFiniteNumber(
        protection.criticalIllnessAmountHKD,
      ),
    },
    emergencyFund: {
      savedAmountHKD: asFiniteNumber(emergencyFund.savedAmountHKD),
    },
    goals: { goals },
    investment: {
      riskAllocation: {
        low: Math.round(asFiniteNumber(risk.low)),
        mid: Math.round(asFiniteNumber(risk.mid)),
        high: Math.round(asFiniteNumber(risk.high)),
      },
      monthlyInvestmentHKD: asFiniteNumber(investment.monthlyInvestmentHKD),
      monthlyFunHKD: asFiniteNumber(investment.monthlyFunHKD),
    },
  };
}

function parseExpenses(value: unknown): ExpensesState | null {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.categories)) {
    return null;
  }
  const categories = record.categories
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const key = parseExpenseCategoryKey(row.key);
      if (!key) {
        return null;
      }
      return {
        key,
        icon: String(row.icon ?? "Circle"),
        amountHKD: asFiniteNumber(row.amountHKD),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const totalHKD =
    typeof record.totalHKD === "number"
      ? record.totalHKD
      : categories.reduce((sum, cat) => sum + cat.amountHKD, 0);

  return { categories, totalHKD };
}

function parseRiskQuiz(value: unknown): RiskQuizState | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const profile = record.profile;
  if (
    profile !== "conservative" &&
    profile !== "balanced" &&
    profile !== "aggressive"
  ) {
    return null;
  }
  const answers = Array.isArray(record.answers)
    ? record.answers
        .map((item) => {
          const row = asRecord(item);
          if (!row) {
            return null;
          }
          const choice = row.choice;
          if (choice !== "a" && choice !== "b" && choice !== "c") {
            return null;
          }
          return {
            questionId: String(row.questionId ?? ""),
            choice: choice as "a" | "b" | "c",
          };
        })
        .filter((a): a is NonNullable<typeof a> => Boolean(a?.questionId))
    : [];

  return {
    answers,
    score: asFiniteNumber(record.score),
    profile: profile as RiskProfile,
  };
}

function parseCrisis(value: unknown): CrisisState | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const title = tryCoerceBilingual(record.title, "crisis.title");
  if (!title) {
    return null;
  }
  const description =
    tryCoerceBilingual(record.description, "crisis.description") ?? {
      en: "",
      zhHant: "",
    };

  const profile = record.riskProfile;
  const riskProfile: RiskProfile =
    profile === "conservative" ||
    profile === "balanced" ||
    profile === "aggressive"
      ? profile
      : "balanced";

  const impactsRaw = Array.isArray(record.impacts) ? record.impacts : [];
  const impacts = impactsRaw
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const headline = tryCoerceBilingual(row.headline, "crisis.impact.headline");
      if (!headline) {
        return null;
      }
      const layerRaw = String(row.layer ?? "");
      if (
        layerRaw !== "protection" &&
        layerRaw !== "emergencyFund" &&
        layerRaw !== "investment" &&
        layerRaw !== "goals"
      ) {
        return null;
      }
      return {
        layer: layerRaw as
          | "protection"
          | "emergencyFund"
          | "investment"
          | "goals",
        icon: String(row.icon ?? "AlertCircle"),
        headline,
        detailHKD:
          typeof row.detailHKD === "number" ? row.detailHKD : undefined,
        detailMonths:
          typeof row.detailMonths === "number" ? row.detailMonths : undefined,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  return {
    title,
    description,
    riskProfile,
    monthlyIncomeImpactPercent: asFiniteNumber(
      record.monthlyIncomeImpactPercent,
    ),
    oneTimeCostHKD: asFiniteNumber(record.oneTimeCostHKD),
    durationMonths: Math.max(1, Math.round(asFiniteNumber(record.durationMonths, 1))),
    impacts,
  };
}

function parseLayerFlag(value: unknown): LayerFlag {
  if (value === "green" || value === "amber" || value === "red") {
    return value;
  }
  return "amber";
}

function parseStressTest(value: unknown): StressTestResult | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const ef = asRecord(record.emergencyFundProjection);
  const goalsRaw = Array.isArray(record.goalProjections)
    ? record.goalProjections
    : [];
  const surplusRaw = Array.isArray(record.monthlySurplusByYear)
    ? record.monthlySurplusByYear
    : [];

  const goalProjections = goalsRaw
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const goalId = String(row.goalId ?? "");
      const label = tryCoerceBilingual(row.label, "stressTest.goal.label");
      if (!goalId || !label) {
        return null;
      }
      const note =
        row.note == null || row.note === ""
          ? undefined
          : tryCoerceBilingual(row.note, "stressTest.goal.note") ?? undefined;
      return {
        goalId,
        label,
        icon: String(row.icon ?? "Target"),
        targetAmountHKD: asFiniteNumber(row.targetAmountHKD),
        targetYear: Math.round(asFiniteNumber(row.targetYear)),
        projectedYear:
          row.projectedYear === null || row.projectedYear === undefined
            ? null
            : Math.round(asFiniteNumber(row.projectedYear)),
        status: parseLayerFlag(row.status),
        note,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  if (!ef && goalProjections.length === 0 && surplusRaw.length === 0) {
    return null;
  }

  return {
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
  };
}

function parseSummary(value: unknown): SummaryState | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const ratingRoot = asRecord(record.rating);
  const breakdown = asRecord(ratingRoot?.breakdown);
  const goalsRaw = Array.isArray(record.actionGoals)
    ? record.actionGoals
    : Array.isArray(record.goals)
      ? record.goals
      : [];

  // Prefer v2 SummaryState; tolerate empty action list.
  const actionGoals: ActionGoal[] = goalsRaw
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const title = tryCoerceBilingual(row.title, "actionGoal.title");
      if (!title) {
        return null;
      }
      const reasoning =
        tryCoerceBilingual(row.reasoning, "actionGoal.reasoning") ?? {
          en: "",
          zhHant: "",
        };
      const category = String(row.category ?? "goal");
      if (
        category !== "protection" &&
        category !== "savings" &&
        category !== "investment" &&
        category !== "goal"
      ) {
        return null;
      }
      return {
        rank: Math.round(asFiniteNumber(row.rank)),
        title,
        category,
        icon: String(row.icon ?? "Target"),
        impactPoints: asFiniteNumber(row.impactPoints),
        reasoning,
      } satisfies ActionGoal;
    })
    .filter((g): g is ActionGoal => g !== null)
    .sort((a, b) => a.rank - b.rank);

  if (!ratingRoot && actionGoals.length === 0) {
    return null;
  }

  return {
    rating: {
      score: asFiniteNumber(ratingRoot?.score),
      labelKey: parseSummaryLabelKey(ratingRoot?.labelKey),
      breakdown: {
        protection: asFiniteNumber(breakdown?.protection),
        emergencyFund: asFiniteNumber(breakdown?.emergencyFund),
        goalsOnTrack: asFiniteNumber(breakdown?.goalsOnTrack),
        crisisResilience: asFiniteNumber(breakdown?.crisisResilience),
      },
    },
    actionGoals,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId: rawId } = await context.params;
  const sessionId = rawId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id: sessionId },
    include: { lead: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (!session.lead) {
    return NextResponse.json(
      { error: "Capture your details before downloading the blueprint." },
      { status: 400 },
    );
  }

  const pyramid = parsePyramid(session.finalPyramidJson);
  if (!pyramid) {
    return NextResponse.json(
      { error: "Confirmed pyramid data is missing for this session." },
      { status: 400 },
    );
  }

  const benchmarks = buildPyramidBenchmarks({
    age: session.age,
    monthlyIncomeHKD: session.monthlyIncome,
    industry: session.industry,
  });
  const layerFlags = computeLayerFlags(pyramid, benchmarks);

  // macroResultJson may be StressTestResult or { ...StressTestResult, notes }
  const stressTest = parseStressTest(session.macroResultJson);

  const locale = await getServerSiteLocale();

  const payload: BlueprintPdfInput = {
    locale,
    name: session.lead.name,
    email: session.lead.email,
    phone: session.lead.phone,
    industry: session.industry,
    age: session.age,
    tone: parseTone(session.tone),
    pyramid,
    layerFlags,
    expenses: parseExpenses(session.expensesJson),
    riskQuiz: parseRiskQuiz(session.riskQuizJson),
    stressTest,
    crisis: parseCrisis(session.crisisJson),
    summary: parseSummary(session.goalsJson),
    selectedGoal: session.lead.selectedGoal,
  };

  try {
    const pdf = await generateWorkshopBlueprintPdf(payload);
    const filename = `ppa-workshop-blueprint-${sessionId.slice(0, 8)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[workshop] PDF generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate PDF. Please try again." },
      { status: 500 },
    );
  }
}
