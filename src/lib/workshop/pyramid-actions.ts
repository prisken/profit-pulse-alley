"use server";

import { Prisma } from "@prisma/client";

import {
  callDeepSeekParsed,
  isTransientWorkshopAiError,
} from "@/lib/workshop/deepseek-client";
import {
  buildDeterministicExpensesGuess,
  buildDeterministicPyramidGuess,
  buildDeterministicSqueezeReasoning,
} from "@/lib/workshop/ai-fallbacks";
import { assertStrictBilingual } from "@/lib/workshop/bilingual";
import { deriveGoalAge, deriveGoalYear } from "@/lib/workshop/goal-year";
import { translate } from "@/lib/i18n/messages";
import {
  runGoalStressTest,
  type GoalStressTestInput,
  type MacroSimulationResult,
  resolveWageCurveKind,
  wageCagrForAge,
  WAGE_CURVES,
} from "@/lib/workshop/macro-simulation";
import {
  buildActionGoalsDecisionsPayload,
  buildDeterministicActionGoalsFallback,
} from "@/lib/workshop/action-goals-decisions";
import { logActionGoalsFallback } from "@/lib/workshop/action-goal-fallbacks";
import {
  applyCrisis,
  buildCrisisImpactsFromEngine,
  runCrisisStressTest,
  toCrisisStressTestSummary,
} from "@/lib/workshop/crisis-stress-test";
import {
  MACRO_RESULT_VERSION_LIFE_TIMELINE,
  parseMacroResultJson,
  timelineToLegacyStressTest,
} from "@/lib/workshop/macro-result";
import { normalizePyramidState } from "@/lib/workshop/pyramid-normalize";
import {
  activeGoalsForJourney,
  applyGoalDecision,
  computeGoalOutlook,
  currentJourneyAllocation,
  emptyGoalJourneyState,
  parseGoalJourneyState,
  rerunTimelineForJourney,
  type GoalOutlook,
} from "@/lib/workshop/goal-journey";
import { solveSqueeze } from "@/lib/workshop/squeeze-solver";
import {
  runLifeTimeline,
  type TimelineResult,
} from "@/lib/workshop/timeline-engine";
import {
  buildPyramidBenchmarks,
  computeLayerFlags,
  type PyramidBenchmarkSnapshot,
} from "@/lib/workshop/pyramid-benchmarks";
import {
  RATING_WEIGHTS,
  computeFinancialRating,
  computeGoalImpactPoints,
  type GoalImpactContext,
  type RatingCategory,
} from "@/lib/workshop/financial-rating";
import type {
  ActionGoal,
  Bilingual,
  CrisisImpact,
  CrisisState,
  CrisisType,
  ExpenseCategory,
  ExpenseCategoryKey,
  ExpensesState,
  GoalJourneyDecision,
  GoalJourneyState,
  GoalItem,
  LayerFlags,
  SqueezeRecommendation,
  PyramidState,
  RiskProfile,
  RiskQuizAnswer,
  StressTestNote,
  StressTestResult,
  SummaryRating,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";
import { CRISIS_TYPES } from "@/lib/workshop/types";
import {
  formatHouseholdForAi,
  formatIndustryForAi,
  isWorkshopHouseholdKey,
  isWorkshopIndustryKey,
} from "@/lib/workshop/intake-options";
import { prisma } from "@/lib/prisma";

/** @deprecated v1 flat layers — kept for interim macro/crisis adapters. */
export type PyramidWeakestLayer = "foundation" | "core" | "growth" | "apex";

export type PredictPyramidInput = {
  age: number;
  /** Planned retirement age (validated: > age, clamped 40–80). */
  retirementAge: number;
  monthlyIncome: number;
  /** Stable English industry enum key (e.g. "tech", "other"). */
  industry: string;
  /** Free-text industry when `industry` is `"other"`. Used in AI prompts only. */
  industryOther?: string;
  householdStatus?: string;
  tone: WorkshopTone;
};

export type PredictPyramidResult = PyramidState & {
  sessionId: string;
  rationale: Bilingual;
  protectionExplanation: Bilingual;
  emergencyFundExplanation: Bilingual;
  layerFlags: LayerFlags;
  benchmarks: PyramidBenchmarkSnapshot;
  /** AI risk-allocation guess (informational only — not bound to editable state). */
  aiRiskAllocation: { low: number; mid: number; high: number };
};

const WORKSHOP_TONES = new Set<WorkshopTone>([
  "fun",
  "professional",
  "simple",
  "direct",
  "warm",
]);

const PREDICT_PYRAMID_SYSTEM_PROMPT = `You are estimating a Hong Kong professional's CURRENT financial pyramid — what they likely already have today, NOT recommendations.

Given age, planned retirement age, monthly income (HKD), industry, and household status, return realistic CURRENT-state guesses:

1) protection.medicalCoveragePercent — 0–100 integer guess of their current medical/hospital coverage %.
2) protection.criticalIllnessAmountHKD — current CI sum assured in HKD (often 0 if they likely have none).
3) emergencyFund.savedAmountHKD — current liquid emergency savings in HKD.
4) goals.goals — array of 2–4 GoalItem objects inferred from age + household + retirement runway:
   - unmarried / single and under 35 → often include a wedding fund
   - age under 28 → may include further-education / upskilling fund
   - has kids (married with kids / single parent) → include kids' education fund
   - always include at least one sensible retirement-adjacent or long-horizon goal if the list would otherwise be thin
   - when retirementAge − age is short, prefer nearer-term goals and smaller retirement nest eggs
   - You MAY propose at most ONE goal with goalType "retirementTarget" (nest-egg line at retirement — not a cash spend). All other goals must use goalType "spend" (cash outflow at target age). Always set goalType explicitly.
   Each goal needs: id (short slug like "wedding"), icon (a lucide-react icon name string e.g. "Heart", "GraduationCap", "PiggyBank", "Home", "Plane"), label as bilingual { en, zhHant }, targetAmountHKD (income-relative), targetAge (age the person will be when the goal is due — preferred), goalType ("spend" | "retirementTarget"). You may also include targetYear (calendar year); the app derives the other from age + userAge.
5) investment.lumpSumHKD — REQUIRED. Guess a plausible CURRENT total invested capital (HKD) already held today in stocks/funds/bonds/MPF excess — NOT a monthly contribution. Scale with age, income, industry, and remaining runway to retirementAge (shorter runway → often smaller lump sum; longer career of saving → larger).
   Also investment.monthlyInvestmentHKD — REQUIRED. Guess a sensible MONTHLY amount they already put into investments (stocks/funds/MPF excess). Typical 10–30% of monthly income, never above estimated surplus (income − living costs − fun). Prefer ~15% of income when unsure.
   Also investment.monthlyFunHKD — plausible monthly discretionary/fun budget.
6) investment.riskAllocation — your FIRST GUESS of how they might currently allocate risk as integer % { low, mid, high } summing to 100. Shorter runway to retirementAge → bias toward higher low% / lower high%. This is informational flavor only.
7) rationale — 2–3 sentences, tone-flavored, referencing THEIR specific guessed CURRENT numbers (not generic advice). Must be bilingual { en, zhHant }.
8) protectionExplanation — bilingual { en, zhHant }. The user prompt includes a DETERMINISTIC critical-illness recommendation (multiple × annual income = recommended HKD). Explain WHY that computed guide makes sense for this age/income profile in the chosen tone. HARD RULE: do NOT invent a different recommended CI amount or multiple — only narrate the provided numbers.
9) emergencyFundExplanation — bilingual { en, zhHant }. The user prompt includes a DETERMINISTIC emergency-fund target (industry months × income-based burn). Explain WHY that guide fits this industry/profile. HARD RULE: do NOT invent a different recommended EF amount or month count — only narrate the provided numbers. You may mention that later expense confirmation can refine the burn estimate.

Do NOT invent recommended "should have" targets as the primary pyramid CURRENT-state numbers — estimate CURRENT reality. Do not return markdown.

Return ONLY valid JSON:
{
  "protection": { "medicalCoveragePercent": number, "criticalIllnessAmountHKD": number },
  "emergencyFund": { "savedAmountHKD": number },
  "goals": {
    "goals": [
      {
        "id": string,
        "icon": string,
        "label": { "en": string, "zhHant": string },
        "targetAmountHKD": number,
        "targetAge": number,
        "goalType": "spend" | "retirementTarget"
      }
    ]
  },
  "investment": {
    "riskAllocation": { "low": number, "mid": number, "high": number },
    "lumpSumHKD": number,
    "monthlyInvestmentHKD": number,
    "monthlyFunHKD": number
  },
  "rationale": { "en": string, "zhHant": string },
  "protectionExplanation": { "en": string, "zhHant": string },
  "emergencyFundExplanation": { "en": string, "zhHant": string }
}`;

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid pyramid prediction: "${field}" must be a finite number.`);
  }
  return value;
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid pyramid prediction: "${field}" must be a non-empty string.`);
  }
  return value.trim();
}

function assertRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid pyramid prediction: "${field}" must be an object.`);
  }
  return value as Record<string, unknown>;
}

function parseRiskAllocation(
  value: unknown,
  field: string,
): { low: number; mid: number; high: number } {
  const record = assertRecord(value, field);
  const low = Math.round(assertFiniteNumber(record.low, `${field}.low`));
  const mid = Math.round(assertFiniteNumber(record.mid, `${field}.mid`));
  const high = Math.round(assertFiniteNumber(record.high, `${field}.high`));
  if (low < 0 || mid < 0 || high < 0) {
    throw new Error(`Invalid pyramid prediction: "${field}" percentages cannot be negative.`);
  }
  if (low + mid + high !== 100) {
    throw new Error(
      `Invalid pyramid prediction: "${field}" must sum to 100 (got ${low + mid + high}).`,
    );
  }
  return { low, mid, high };
}

function parseGoalItem(
  value: unknown,
  index: number,
  userAge: number,
): GoalItem {
  const field = `goals.goals[${index}]`;
  const record = assertRecord(value, field);
  const id = assertNonEmptyString(record.id, `${field}.id`);
  const icon = assertNonEmptyString(record.icon, `${field}.icon`);
  const label = assertStrictBilingual(record.label, `${field}.label`);
  const targetAmountHKD = assertFiniteNumber(
    record.targetAmountHKD,
    `${field}.targetAmountHKD`,
  );
  if (targetAmountHKD < 0) {
    throw new Error(`Invalid pyramid prediction: "${field}.targetAmountHKD" cannot be negative.`);
  }

  const hasAge =
    typeof record.targetAge === "number" && Number.isFinite(record.targetAge);
  const hasYear =
    typeof record.targetYear === "number" && Number.isFinite(record.targetYear);

  let targetAge: number;
  let targetYear: number;

  if (hasAge) {
    targetAge = Math.round(record.targetAge as number);
    if (targetAge < 1 || targetAge > 120) {
      throw new Error(
        `Invalid pyramid prediction: "${field}.targetAge" must be a plausible age.`,
      );
    }
    targetYear = deriveGoalYear(targetAge, userAge);
  } else if (hasYear) {
    targetYear = Math.round(record.targetYear as number);
    if (targetYear < 2000 || targetYear > 2100) {
      throw new Error(
        `Invalid pyramid prediction: "${field}.targetYear" must be a plausible calendar year.`,
      );
    }
    targetAge = deriveGoalAge(targetYear, userAge);
  } else {
    throw new Error(
      `Invalid pyramid prediction: "${field}" needs targetAge or targetYear.`,
    );
  }

  return {
    id,
    icon,
    label,
    targetAmountHKD,
    targetAge,
    targetYear,
    goalType: record.goalType === "retirementTarget" ? "retirementTarget" : "spend",
  };
}

type ParsedAiPyramid = {
  pyramid: PyramidState;
  rationale: Bilingual;
  protectionExplanation: Bilingual;
  emergencyFundExplanation: Bilingual;
};

function parseAiPyramidPrediction(
  raw: string,
  userAge: number,
): ParsedAiPyramid {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for pyramid prediction. Please try again.",
    );
  }

  const root = assertRecord(parsed, "root");
  const protectionRaw = assertRecord(root.protection, "protection");
  const emergencyRaw = assertRecord(root.emergencyFund, "emergencyFund");
  const goalsRaw = assertRecord(root.goals, "goals");
  const investmentRaw = assertRecord(root.investment, "investment");

  const medicalCoveragePercent = assertFiniteNumber(
    protectionRaw.medicalCoveragePercent,
    "protection.medicalCoveragePercent",
  );
  if (medicalCoveragePercent < 0 || medicalCoveragePercent > 100) {
    throw new Error(
      'Invalid pyramid prediction: "protection.medicalCoveragePercent" must be between 0 and 100.',
    );
  }

  const criticalIllnessAmountHKD = assertFiniteNumber(
    protectionRaw.criticalIllnessAmountHKD,
    "protection.criticalIllnessAmountHKD",
  );
  if (criticalIllnessAmountHKD < 0) {
    throw new Error(
      'Invalid pyramid prediction: "protection.criticalIllnessAmountHKD" cannot be negative.',
    );
  }

  const savedAmountHKD = assertFiniteNumber(
    emergencyRaw.savedAmountHKD,
    "emergencyFund.savedAmountHKD",
  );
  if (savedAmountHKD < 0) {
    throw new Error(
      'Invalid pyramid prediction: "emergencyFund.savedAmountHKD" cannot be negative.',
    );
  }

  if (!Array.isArray(goalsRaw.goals)) {
    throw new Error('Invalid pyramid prediction: "goals.goals" must be an array.');
  }
  if (goalsRaw.goals.length < 2 || goalsRaw.goals.length > 4) {
    throw new Error(
      `Invalid pyramid prediction: "goals.goals" must contain 2–4 items (got ${goalsRaw.goals.length}).`,
    );
  }
  const goals = goalsRaw.goals.map((item, index) =>
    parseGoalItem(item, index, userAge),
  );

  const monthlyFunHKD = assertFiniteNumber(
    investmentRaw.monthlyFunHKD,
    "investment.monthlyFunHKD",
  );
  if (monthlyFunHKD < 0) {
    throw new Error(
      "Invalid pyramid prediction: investment.monthlyFunHKD cannot be negative.",
    );
  }

  let lumpSumHKD = 0;
  if (
    typeof investmentRaw.lumpSumHKD === "number" &&
    Number.isFinite(investmentRaw.lumpSumHKD)
  ) {
    lumpSumHKD = Math.round(investmentRaw.lumpSumHKD);
    if (lumpSumHKD < 0) {
      throw new Error(
        "Invalid pyramid prediction: investment.lumpSumHKD cannot be negative.",
      );
    }
  } else {
    throw new Error(
      'Invalid pyramid prediction: "investment.lumpSumHKD" is required.',
    );
  }

  let monthlyInvestmentHKD = 0;
  if (
    typeof investmentRaw.monthlyInvestmentHKD === "number" &&
    Number.isFinite(investmentRaw.monthlyInvestmentHKD)
  ) {
    monthlyInvestmentHKD = Math.round(investmentRaw.monthlyInvestmentHKD);
    if (monthlyInvestmentHKD < 0) {
      throw new Error(
        "Invalid pyramid prediction: investment.monthlyInvestmentHKD cannot be negative.",
      );
    }
  }

  const riskAllocation = parseRiskAllocation(
    investmentRaw.riskAllocation,
    "investment.riskAllocation",
  );
  const rationale = assertStrictBilingual(root.rationale, "rationale");
  const protectionExplanation = assertStrictBilingual(
    root.protectionExplanation,
    "protectionExplanation",
  );
  const emergencyFundExplanation = assertStrictBilingual(
    root.emergencyFundExplanation,
    "emergencyFundExplanation",
  );

  return {
    pyramid: {
      protection: {
        medicalCoveragePercent: Math.round(medicalCoveragePercent),
        criticalIllnessAmountHKD: Math.round(criticalIllnessAmountHKD),
      },
      emergencyFund: {
        savedAmountHKD: Math.round(savedAmountHKD),
      },
      goals: { goals },
      investment: {
        riskAllocation,
        lumpSumHKD,
        monthlyInvestmentHKD,
        monthlyFunHKD: Math.round(monthlyFunHKD),
      },
    },
    rationale,
    protectionExplanation,
    emergencyFundExplanation,
  };
}

function validatePredictInput(input: PredictPyramidInput): {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  industry: string;
  industryOther: string | null;
  householdStatus: string | null;
  tone: WorkshopTone;
} {
  if (
    typeof input.age !== "number" ||
    !Number.isFinite(input.age) ||
    input.age < 16 ||
    input.age > 100
  ) {
    throw new Error("Age must be a number between 16 and 100.");
  }
  if (
    typeof input.monthlyIncome !== "number" ||
    !Number.isFinite(input.monthlyIncome) ||
    input.monthlyIncome < 0
  ) {
    throw new Error("Monthly income must be a non-negative number (HKD).");
  }

  const age = Math.round(input.age);
  let retirementAge = Math.round(
    typeof input.retirementAge === "number" && Number.isFinite(input.retirementAge)
      ? input.retirementAge
      : 65,
  );
  retirementAge = Math.min(80, Math.max(40, retirementAge));
  if (retirementAge <= age) {
    throw new Error("Retirement age must be greater than your current age.");
  }

  const industry = input.industry?.trim();
  if (!industry || !isWorkshopIndustryKey(industry)) {
    throw new Error("Industry is required.");
  }

  const industryOther =
    industry === "other" ? input.industryOther?.trim() || null : null;
  if (industry === "other" && !industryOther) {
    throw new Error("Please describe your industry.");
  }

  if (!WORKSHOP_TONES.has(input.tone)) {
    throw new Error("Please choose how your AI advisor should talk to you.");
  }

  const householdRaw = input.householdStatus?.trim() || null;
  if (!householdRaw || !isWorkshopHouseholdKey(householdRaw)) {
    throw new Error("Household status is required.");
  }

  return {
    age,
    retirementAge,
    monthlyIncome: input.monthlyIncome,
    industry,
    industryOther,
    householdStatus: householdRaw,
    tone: input.tone,
  };
}

/**
 * Calls DeepSeek for CURRENT-state pyramid guesses, validates JSON,
 * computes deterministic layer flags, and creates a WorkshopSession.
 * Editable risk allocation is seeded from pyramid-benchmarks (not AI).
 */
export async function predictPyramidAction(
  input: PredictPyramidInput,
): Promise<PredictPyramidResult> {
  const validated = validatePredictInput(input);

  const industryForMath = formatIndustryForAi(
    validated.industry,
    validated.industryOther,
  );

  const benchmarks = buildPyramidBenchmarks({
    age: validated.age,
    monthlyIncomeHKD: validated.monthlyIncome,
    industry: industryForMath,
  });

  const userPrompt = [
    `Age: ${validated.age}`,
    `Planned retirement age: ${validated.retirementAge}`,
    `Years until retirement (runway): ${validated.retirementAge - validated.age}`,
    `Monthly income (HKD): ${validated.monthlyIncome}`,
    `Industry: ${industryForMath}`,
    `Household status: ${formatHouseholdForAi(validated.householdStatus)}`,
    "",
    "Estimate CURRENT coverage and balances — not ideal recommendations.",
    "Factor the retirement runway into risk allocation and lumpSumHKD guesses (shorter runway → more conservative mix, often smaller invested capital).",
    "",
    "DETERMINISTIC GUIDES (for explanations only — do NOT change these amounts):",
    `Critical illness: ${benchmarks.ciBreakdown.multiple.toFixed(1)} × annual income HKD ${benchmarks.ciBreakdown.annualIncomeHKD} = HKD ${benchmarks.ciBreakdown.recommendedHKD}`,
    `Emergency fund: ${benchmarks.efBreakdown.targetMonths} months × income-based burn for industry "${benchmarks.efBreakdown.industryKey}" = HKD ${benchmarks.efBreakdown.recommendedHKD}`,
    "Narrate protectionExplanation and emergencyFundExplanation using exactly these guide numbers.",
  ].join("\n");

  let aiPyramid: PyramidState;
  let rationale: Bilingual;
  let protectionExplanation: Bilingual;
  let emergencyFundExplanation: Bilingual;

  try {
    const parsed = await callDeepSeekParsed(
      {
        systemPrompt: PREDICT_PYRAMID_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        tone: validated.tone,
        bilingualFields: true,
      },
      (raw) => parseAiPyramidPrediction(raw, validated.age),
      { maxParseAttempts: 2 },
    );
    aiPyramid = parsed.pyramid;
    rationale = parsed.rationale;
    protectionExplanation = parsed.protectionExplanation;
    emergencyFundExplanation = parsed.emergencyFundExplanation;
  } catch (error) {
    if (!isTransientWorkshopAiError(error)) {
      throw error;
    }
    console.warn(
      "[workshop] predictPyramidAction: AI unavailable after retries; using deterministic fallback",
      error instanceof Error ? error.message : error,
    );
    const fallback = buildDeterministicPyramidGuess({
      age: validated.age,
      monthlyIncome: validated.monthlyIncome,
      industry: industryForMath,
      retirementAge: validated.retirementAge,
    });
    aiPyramid = fallback.pyramid;
    rationale = fallback.rationale;
    protectionExplanation = fallback.protectionExplanation;
    emergencyFundExplanation = fallback.emergencyFundExplanation;
  }

  const finalPyramid: PyramidState = {
    ...aiPyramid,
    investment: {
      ...aiPyramid.investment,
      // Editable starting risk = deterministic glide path, not the AI guess.
      riskAllocation: { ...benchmarks.riskAllocation },
    },
  };

  const layerFlags = computeLayerFlags(aiPyramid, benchmarks, {
    monthlyIncomeHKD: validated.monthlyIncome,
  });

  const aiPyramidJson = {
    ...aiPyramid,
    rationale,
    protectionExplanation,
    emergencyFundExplanation,
  } as unknown as Prisma.InputJsonValue;

  const finalPyramidJson = {
    ...finalPyramid,
    rationale,
    protectionExplanation,
    emergencyFundExplanation,
  } as unknown as Prisma.InputJsonValue;

  if (
    !prisma.workshopSession ||
    typeof prisma.workshopSession.create !== "function"
  ) {
    throw new Error(
      "Workshop database models look out of date. Restart npm run dev after prisma generate.",
    );
  }

  const session = await prisma.workshopSession.create({
    data: {
      age: validated.age,
      retirementAge: validated.retirementAge,
      monthlyIncome: validated.monthlyIncome,
      industry: validated.industry,
      householdStatus: validated.householdStatus,
      tone: validated.tone,
      aiPyramidJson,
      finalPyramidJson,
    },
    select: { id: true },
  });

  return {
    ...finalPyramid,
    sessionId: session.id,
    rationale,
    protectionExplanation,
    emergencyFundExplanation,
    layerFlags,
    benchmarks,
    aiRiskAllocation: aiPyramid.investment.riskAllocation,
  };
}

export type ConfirmPyramidInput = {
  sessionId: string;
  pyramid: PyramidState;
  rationale?: Bilingual;
};

/**
 * Persists the user-confirmed / edited v2 pyramid on an existing WorkshopSession.
 */
export async function confirmPyramidAction(
  input: ConfirmPyramidInput,
): Promise<{ sessionId: string }> {
  const sessionId = input.sessionId?.trim();
  if (!sessionId) {
    throw new Error("Session ID is required to confirm the pyramid.");
  }

  const pyramid = input.pyramid;
  if (!pyramid?.protection || !pyramid.emergencyFund || !pyramid.goals || !pyramid.investment) {
    throw new Error("Pyramid state is incomplete.");
  }

  const risk = pyramid.investment.riskAllocation;
  if (
    !risk ||
    risk.low + risk.mid + risk.high !== 100 ||
    risk.low < 0 ||
    risk.mid < 0 ||
    risk.high < 0
  ) {
    throw new Error("Risk allocation must be non-negative percentages summing to 100.");
  }

  const lumpSumHKD = Math.max(
    0,
    Math.round(
      typeof pyramid.investment.lumpSumHKD === "number" &&
        Number.isFinite(pyramid.investment.lumpSumHKD)
        ? pyramid.investment.lumpSumHKD
        : 0,
    ),
  );
  const monthlyInvestmentHKD = Math.max(
    0,
    Math.round(
      typeof pyramid.investment.monthlyInvestmentHKD === "number" &&
        Number.isFinite(pyramid.investment.monthlyInvestmentHKD)
        ? pyramid.investment.monthlyInvestmentHKD
        : 0,
    ),
  );

  const writablePyramid: PyramidState = {
    ...pyramid,
    goals: {
      goals: pyramid.goals.goals.map((g) => ({
        ...g,
        goalType: g.goalType === "retirementTarget" ? "retirementTarget" : "spend",
      })),
    },
    investment: {
      riskAllocation: { ...risk },
      lumpSumHKD,
      monthlyInvestmentHKD,
      monthlyFunHKD: Math.max(0, Math.round(pyramid.investment.monthlyFunHKD)),
    },
  };

  const finalPyramidJson = {
    ...writablePyramid,
    ...(input.rationale ? { rationale: input.rationale } : {}),
  } as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id: sessionId },
    data: { finalPyramidJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return { sessionId };
}

/** Structural keys + icons only — display labels from workshop.expenses.categories.*. */
const EXPENSE_CATEGORY_DEFS = [
  { key: "housing", icon: "Home" },
  { key: "food_living", icon: "UtensilsCrossed" },
  { key: "transport", icon: "Bus" },
  { key: "insurance", icon: "Shield" },
  { key: "discretionary", icon: "Sparkles" },
] as const satisfies ReadonlyArray<{
  key: ExpenseCategoryKey;
  icon: string;
}>;

const EXPENSE_CATEGORY_KEY_SET = new Set<string>(
  EXPENSE_CATEGORY_DEFS.map((def) => def.key),
);

function isExpenseCategoryKey(value: string): value is ExpenseCategoryKey {
  return EXPENSE_CATEGORY_KEY_SET.has(value);
}

const PREDICT_EXPENSES_SYSTEM_PROMPT = `You estimate a Hong Kong professional's CURRENT monthly expense breakdown in HKD — realistic CURRENT spend, not ideal budgets.

Return exactly 5 categories (use these keys and labels):
1) housing — rent/mortgage + building management fees + utilities share
2) food_living — groceries, dining out, household essentials
3) transport — MTR/bus/taxi, car if likely for their income/industry
4) insurance — MONTHLY premium cost implied by their confirmed protection layer. Reason explicitly:
   - Higher medicalCoveragePercent → higher medical/hospital insurance premiums
   - Higher criticalIllnessAmountHKD → higher CI premiums (CI is often expensive relative to sum assured in HK)
   - If both medical and CI look thin/zero, insurance category should be small or near zero
   - Express as a plausible monthly HKD premium total (medical + CI + any life), not annual
5) discretionary — lifestyle, subscriptions, shopping, entertainment (distinct from pyramid "fun" if you have it — still guess current monthly cash outflow)

Each category: { "key", "icon" (lucide-react name), "amountHKD" (non-negative number) }. Optional "label" may be included for clarity but is ignored by the app (UI labels come from i18n).
Suggested icons: Home, UtensilsCrossed, Bus, Shield, Sparkles.

Do NOT invent a trusted "total" field as the source of truth (the app sums categories itself). Do not return markdown.

Return ONLY valid JSON:
{
  "categories": [
    { "key": "housing", "icon": "Home", "amountHKD": number },
    { "key": "food_living", "icon": "UtensilsCrossed", "amountHKD": number },
    { "key": "transport", "icon": "Bus", "amountHKD": number },
    { "key": "insurance", "icon": "Shield", "amountHKD": number },
    { "key": "discretionary", "icon": "Sparkles", "amountHKD": number }
  ]
}`;

function sumExpenseCategories(
  categories: Array<{ amountHKD: number }>,
): number {
  return categories.reduce((sum, cat) => sum + Math.max(0, Math.round(cat.amountHKD)), 0);
}

function normalizeExpenseKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function parseExpensesPrediction(raw: string): ExpensesState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Expense prediction returned invalid JSON.");
  }

  const root = assertRecord(parsed, "expenses");
  const categoriesRaw = root.categories;
  if (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) {
    throw new Error('Invalid expense prediction: "categories" must be a non-empty array.');
  }

  const byKey = new Map<string, { icon: string; amountHKD: number }>();

  for (let i = 0; i < categoriesRaw.length; i += 1) {
    const item = assertRecord(categoriesRaw[i], `categories[${i}]`);
    const key = normalizeExpenseKey(
      assertNonEmptyString(item.key ?? item.label, `categories[${i}].key`),
    );
    const icon = assertNonEmptyString(item.icon, `categories[${i}].icon`);
    const label =
      typeof item.label === "string" && item.label.trim()
        ? item.label.trim()
        : key;
    const amountHKD = Math.max(
      0,
      Math.round(assertFiniteNumber(item.amountHKD, `categories[${i}].amountHKD`)),
    );
    byKey.set(key, { icon, amountHKD });

    // Also index common label aliases so partial AI drift still maps.
    byKey.set(normalizeExpenseKey(label), { icon, amountHKD });
  }

  const aliasGroups: Record<ExpenseCategoryKey, string[]> = {
    housing: ["housing", "rent", "mortgage", "home"],
    food_living: ["food_living", "food", "living", "food_and_living", "groceries"],
    transport: ["transport", "transportation", "commute", "travel"],
    insurance: ["insurance", "protection", "premiums"],
    discretionary: ["discretionary", "lifestyle", "fun", "shopping", "entertainment"],
  };

  const categories: ExpenseCategory[] = EXPENSE_CATEGORY_DEFS.map((def) => {
    const aliases = aliasGroups[def.key];
    let matched: { icon: string; amountHKD: number } | undefined;
    for (const alias of aliases) {
      matched = byKey.get(alias);
      if (matched) {
        break;
      }
    }
    return {
      key: def.key,
      icon: matched?.icon ?? def.icon,
      amountHKD: matched?.amountHKD ?? 0,
    };
  });

  return {
    categories,
    totalHKD: sumExpenseCategories(categories),
  };
}

function validateExpensesState(expenses: ExpensesState): ExpensesState {
  if (!expenses?.categories || !Array.isArray(expenses.categories)) {
    throw new Error("Expenses state is incomplete.");
  }
  if (expenses.categories.length !== 5) {
    throw new Error("Expenses must include exactly 5 categories.");
  }

  const categories: ExpenseCategory[] = expenses.categories.map((cat, index) => {
    if (!cat || typeof cat !== "object") {
      throw new Error(`Expense category ${index} is invalid.`);
    }
    const keyRaw = assertNonEmptyString(cat.key, `categories[${index}].key`);
    if (!isExpenseCategoryKey(keyRaw)) {
      throw new Error(`categories[${index}].key is not a valid expense category.`);
    }
    const icon = assertNonEmptyString(cat.icon, `categories[${index}].icon`);
    if (
      typeof cat.amountHKD !== "number" ||
      !Number.isFinite(cat.amountHKD) ||
      cat.amountHKD < 0
    ) {
      throw new Error(`categories[${index}].amountHKD must be a non-negative number.`);
    }
    return {
      key: keyRaw,
      icon,
      amountHKD: Math.round(cat.amountHKD),
    };
  });

  return {
    categories,
    totalHKD: sumExpenseCategories(categories),
  };
}

export type PredictExpensesInput = {
  age: number;
  monthlyIncome: number;
  industry: string;
  householdStatus?: string;
  pyramid: PyramidState;
  tone: WorkshopTone;
};

/**
 * DeepSeek guesses monthly expense categories. totalHKD is always a deterministic sum.
 * Persists expensesJson on the existing WorkshopSession.
 */
export async function predictExpensesAction(
  sessionId: string,
  input: PredictExpensesInput,
): Promise<ExpensesState> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to predict expenses.");
  }

  if (
    typeof input.age !== "number" ||
    !Number.isFinite(input.age) ||
    input.age < 16 ||
    input.age > 100
  ) {
    throw new Error("Age must be a number between 16 and 100.");
  }
  if (
    typeof input.monthlyIncome !== "number" ||
    !Number.isFinite(input.monthlyIncome) ||
    input.monthlyIncome < 0
  ) {
    throw new Error("Monthly income must be a non-negative number (HKD).");
  }

  const industry = input.industry?.trim();
  if (!industry) {
    throw new Error("Industry is required.");
  }
  if (!WORKSHOP_TONES.has(input.tone)) {
    throw new Error("Please choose how your AI advisor should talk to you.");
  }
  if (
    !input.pyramid?.protection ||
    !input.pyramid.emergencyFund ||
    !input.pyramid.goals ||
    !input.pyramid.investment
  ) {
    throw new Error("Confirmed pyramid state is required to predict expenses.");
  }

  const protection = input.pyramid.protection;
  const userPrompt = [
    `Age: ${Math.round(input.age)}`,
    `Monthly income (HKD): ${input.monthlyIncome}`,
    `Industry: ${industry}`,
    `Household status: ${input.householdStatus?.trim() || "not specified"}`,
    "",
    "Confirmed protection layer (use this when estimating Insurance premiums):",
    `- medicalCoveragePercent: ${protection.medicalCoveragePercent}`,
    `- criticalIllnessAmountHKD: ${protection.criticalIllnessAmountHKD}`,
    "",
    "Other confirmed pyramid context:",
    `- emergencyFund.savedAmountHKD: ${input.pyramid.emergencyFund.savedAmountHKD}`,
    `- lumpSumHKD: ${input.pyramid.investment.lumpSumHKD}`,
    `- monthlyFunHKD: ${input.pyramid.investment.monthlyFunHKD}`,
    `- goals: ${JSON.stringify(input.pyramid.goals.goals.map((g) => g.label))}`,
    "",
    "Estimate CURRENT monthly cash outflows for the 5 required categories.",
    "Reason carefully about Insurance from the protection numbers above.",
  ].join("\n");

  let expenses: ExpensesState;
  try {
    expenses = await callDeepSeekParsed(
      {
        systemPrompt: PREDICT_EXPENSES_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        tone: input.tone,
      },
      parseExpensesPrediction,
      { maxParseAttempts: 2 },
    );
  } catch (error) {
    if (!isTransientWorkshopAiError(error)) {
      throw error;
    }
    console.warn(
      "[workshop] predictExpensesAction: AI unavailable after retries; using deterministic fallback",
      error instanceof Error ? error.message : error,
    );
    expenses = buildDeterministicExpensesGuess({
      monthlyIncome: input.monthlyIncome,
      pyramid: input.pyramid,
    });
  }

  const expensesJson = expenses as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id },
    data: { expensesJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return expenses;
}

export type ConfirmExpensesInput = {
  sessionId: string;
  expenses: ExpensesState;
};

/**
 * Persists user-edited monthly expenses. Recomputes totalHKD; no AI call.
 */
export async function confirmExpensesAction(
  input: ConfirmExpensesInput,
): Promise<{ sessionId: string }> {
  const sessionId = input.sessionId?.trim();
  if (!sessionId) {
    throw new Error("Session ID is required to confirm expenses.");
  }

  const expenses = validateExpensesState(input.expenses);
  const expensesJson = expenses as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id: sessionId },
    data: { expensesJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return { sessionId };
}

export type SaveRiskQuizInput = {
  sessionId: string;
  answers: RiskQuizAnswer[];
  score: number;
  profile: RiskProfile;
};

/**
 * Persists client-computed risk quiz answers + profile. No AI call.
 */
export async function saveRiskQuizAction(
  input: SaveRiskQuizInput,
): Promise<{ sessionId: string }> {
  const sessionId = input.sessionId?.trim();
  if (!sessionId) {
    throw new Error("Session ID is required to save the risk quiz.");
  }

  if (!Array.isArray(input.answers) || input.answers.length !== 5) {
    throw new Error("Risk quiz requires exactly 5 answers.");
  }

  const profiles = new Set(["conservative", "balanced", "aggressive"]);
  if (!profiles.has(input.profile)) {
    throw new Error("Invalid risk profile.");
  }
  if (
    typeof input.score !== "number" ||
    !Number.isFinite(input.score) ||
    input.score < 0 ||
    input.score > 100
  ) {
    throw new Error("Risk score must be a number between 0 and 100.");
  }

  const riskQuizJson = {
    answers: input.answers,
    score: Math.round(input.score),
    profile: input.profile,
  } as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id: sessionId },
    data: { riskQuizJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return { sessionId };
}

/**
 * Legacy thin server wrapper around `runGoalStressTest` (v2 stress path).
 * Prefer {@link runLifeTimelineAction} for the wizard stress-test step.
 */
export async function runGoalStressTestAction(
  input: GoalStressTestInput,
): Promise<StressTestResult> {
  return runGoalStressTest(input);
}

function parseExpensesState(value: unknown): ExpensesState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Confirmed expenses are missing. Please confirm expenses first.");
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.categories)) {
    throw new Error("Confirmed expenses are incomplete.");
  }
  const categories = record.categories.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Invalid expense category at index ${index}.`);
    }
    const row = item as Record<string, unknown>;
    return {
      key: String(row.key ?? "discretionary") as ExpenseCategoryKey,
      icon: String(row.icon ?? "Circle"),
      amountHKD: Math.max(0, Math.round(Number(row.amountHKD) || 0)),
    };
  });
  const totalFromCats = categories.reduce((sum, c) => sum + c.amountHKD, 0);
  const totalHKD =
    typeof record.totalHKD === "number" && Number.isFinite(record.totalHKD)
      ? Math.max(0, Math.round(record.totalHKD))
      : totalFromCats;
  return { totalHKD, categories };
}

export type RunLifeTimelineActionResult = {
  timeline: TimelineResult;
  /** Legacy StressTestResult bridge for crisis / summary / PDF consumers. */
  legacyStressTest: StressTestResult;
  /** Persisted Step 4 decisions — hydrate the rail after back-navigation. */
  journey: GoalJourneyState;
  /** Canonical post-journey pyramid / expenses from the session. */
  pyramid: PyramidState;
  expenses: ExpensesState;
};

/**
 * Math-only life timeline from the confirmed session pyramid + expenses,
 * excluding given-up goals from `goalJourneyJson`.
 * Persists a versioned payload to `macroResultJson` (replaces legacy stress shape).
 */
export async function runLifeTimelineAction(
  sessionId: string,
): Promise<RunLifeTimelineActionResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to run the life timeline.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      retirementAge: true,
      monthlyIncome: true,
      industry: true,
      finalPyramidJson: true,
      expensesJson: true,
      goalJourneyJson: true,
    },
  });

  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }
  if (!session.expensesJson) {
    throw new Error("Confirmed expenses are missing. Please confirm expenses first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const expenses = parseExpensesState(session.expensesJson);
  const journey = parseGoalJourneyState(session.goalJourneyJson);
  const retirementAge = Math.min(
    80,
    Math.max(session.age + 1, Math.round(session.retirementAge ?? 65)),
  );

  const timeline = runLifeTimeline({
    age: session.age,
    retirementAge,
    monthlyIncome: session.monthlyIncome,
    monthlyExpenses: expenses.totalHKD,
    monthlyFun: pyramid.investment.monthlyFunHKD,
    emergencyFundSavedHKD: pyramid.emergencyFund.savedAmountHKD,
    investment: {
      lumpSumHKD: pyramid.investment.lumpSumHKD,
      monthlyInvestmentHKD: pyramid.investment.monthlyInvestmentHKD,
      allocation: pyramid.investment.riskAllocation,
    },
    goals: activeGoalsForJourney(pyramid, journey),
    industry: session.industry,
  });

  const legacyStressTest = timelineToLegacyStressTest(timeline, pyramid);

  const macroResultJson = {
    version: MACRO_RESULT_VERSION_LIFE_TIMELINE,
    timeline,
  } as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id: session.id },
    data: { macroResultJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return { timeline, legacyStressTest, journey, pyramid, expenses };
}

/** Read-only: load persisted Step 4 journey for Risk Quiz consistency copy. */
export async function loadGoalJourneyAction(
  sessionId: string,
): Promise<GoalJourneyState> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to load the goal journey.");
  }
  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: { id: true, goalJourneyJson: true },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  return parseGoalJourneyState(session.goalJourneyJson);
}

export type ComputeSqueezeRecommendationActionResult = {
  timeline: TimelineResult;
  journey: GoalJourneyState;
  recommendation: SqueezeRecommendation | null;
  outlook: GoalOutlook;
};

export type ComputeGoalOutlookActionResult = {
  outlook: GoalOutlook;
  timeline: TimelineResult;
  /** Liquid pool ÷ monthly expenses at attained/target age on the concurrent timeline. */
  emergencyFundMonths: number;
};

/**
 * Math-only outlook for one goal against the concurrent journey timeline.
 */
export async function computeGoalOutlookAction(
  sessionId: string,
  goalId: string,
  allowLiquidation: boolean,
): Promise<ComputeGoalOutlookActionResult> {
  const id = sessionId?.trim();
  const targetGoalId = goalId?.trim();
  if (!id) {
    throw new Error("Session ID is required to compute goal outlook.");
  }
  if (!targetGoalId) {
    throw new Error("Goal ID is required to compute goal outlook.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      retirementAge: true,
      monthlyIncome: true,
      industry: true,
      finalPyramidJson: true,
      expensesJson: true,
      goalJourneyJson: true,
    },
  });

  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }
  if (!session.expensesJson) {
    throw new Error("Confirmed expenses are missing. Please confirm expenses first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const expenses = parseExpensesState(session.expensesJson);
  const journey = parseGoalJourneyState(session.goalJourneyJson);
  const goal = pyramid.goals.goals.find((row) => row.id === targetGoalId);
  if (!goal) {
    throw new Error("Goal not found in the confirmed pyramid.");
  }

  const workingPyramid: PyramidState = {
    ...pyramid,
    goals: {
      goals: pyramid.goals.goals.map((row) =>
        row.id === targetGoalId ? { ...row, allowLiquidation } : row,
      ),
    },
  };

  const timeline = rerunTimelineForJourney({
    age: session.age,
    retirementAge: session.retirementAge,
    monthlyIncome: session.monthlyIncome,
    industry: session.industry,
    pyramid: workingPyramid,
    expenses,
    journey,
  });

  const outlook = computeGoalOutlook(timeline, {
    ...goal,
    allowLiquidation,
  });

  const ageForEf = outlook.attainedAtAge ?? outlook.targetAge;
  const row =
    timeline.rows.find((r) => r.age === ageForEf) ??
    timeline.rows[timeline.rows.length - 1] ??
    null;
  const monthlyBurn = Math.max(1, expenses.totalHKD);
  const emergencyFundMonths = row
    ? Math.round((Math.max(0, row.liquidPool) / monthlyBurn) * 10) / 10
    : 0;

  return { outlook, timeline, emergencyFundMonths };
}

export async function computeSqueezeRecommendationAction(
  sessionId: string,
  goalId: string,
  allowLiquidation: boolean,
): Promise<ComputeSqueezeRecommendationActionResult> {
  const id = sessionId?.trim();
  const targetGoalId = goalId?.trim();
  if (!id) {
    throw new Error("Session ID is required to compute a squeeze recommendation.");
  }
  if (!targetGoalId) {
    throw new Error("Goal ID is required to compute a squeeze recommendation.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      retirementAge: true,
      monthlyIncome: true,
      industry: true,
      finalPyramidJson: true,
      expensesJson: true,
      goalJourneyJson: true,
    },
  });

  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }
  if (!session.expensesJson) {
    throw new Error("Confirmed expenses are missing. Please confirm expenses first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const expenses = parseExpensesState(session.expensesJson);
  const journey = parseGoalJourneyState(session.goalJourneyJson);
  const goal = pyramid.goals.goals.find((row) => row.id === targetGoalId);
  if (!goal) {
    throw new Error("Goal not found in the confirmed pyramid.");
  }

  const workingPyramid: PyramidState = {
    ...pyramid,
    goals: {
      goals: pyramid.goals.goals.map((row) =>
        row.id === targetGoalId
          ? { ...row, allowLiquidation }
          : row,
      ),
    },
  };

  const timeline = rerunTimelineForJourney({
    age: session.age,
    retirementAge: session.retirementAge,
    monthlyIncome: session.monthlyIncome,
    industry: session.industry,
    pyramid: workingPyramid,
    expenses,
    journey,
  });

  const outlook = computeGoalOutlook(
    timeline,
    { ...goal, allowLiquidation },
  );
  const recommendation = solveSqueeze({
    requiredExtraMonthlyHKD: outlook.requiredExtraMonthlyHKD,
    monthsLate: outlook.monthsLate,
    targetAge: goal.targetAge,
    monthlyIncomeHKD: session.monthlyIncome,
    expenses,
    monthlyFunHKD: workingPyramid.investment.monthlyFunHKD,
    monthlyInvestmentHKD: workingPyramid.investment.monthlyInvestmentHKD,
  });

  return { timeline, journey, recommendation, outlook };
}

const NARRATE_GOAL_SQUEEZE_SYSTEM_PROMPT = `You explain ONE spending-squeeze recommendation for a Hong Kong workshop participant.

You receive ALREADY-COMPUTED numbers only. You narrate — you MUST NOT invent, recalculate, or round differently than the figures provided.

Write 1–2 short bilingual sentences that explain the trade-off (cutting fun and/or discretionary) in the workshop tone.

Rules:
- Reference the ACTUAL requiredExtraMonthlyHKD and the specific funCutMonthlyHKD / discretionaryCutMonthlyHKD passed in.
- If partialCapped is true (fun+discretionary could not fully cover the need), you MUST say so honestly and mention achievableAtAge when provided.
- Do not invent different HKD amounts or ages. Do not give generic tips.

Return ONLY valid JSON:
{
  "reasoning": { "en": string, "zhHant": string }
}`;

function squeezeCutMonthly(recommendation: SqueezeRecommendation): {
  funCutMonthlyHKD: number;
  discretionaryCutMonthlyHKD: number;
  partial: boolean;
} {
  const funCurrent =
    recommendation.currentAllocation.find((s) => s.key === "fun")?.amountHKD ?? 0;
  const funNext =
    recommendation.recommendedAllocation.find((s) => s.key === "fun")?.amountHKD ??
    0;
  const discCurrent =
    recommendation.currentAllocation.find((s) => s.key === "discretionary")
      ?.amountHKD ?? 0;
  const discNext =
    recommendation.recommendedAllocation.find((s) => s.key === "discretionary")
      ?.amountHKD ?? 0;
  const funCutMonthlyHKD = Math.max(0, funCurrent - funNext);
  const discretionaryCutMonthlyHKD = Math.max(0, discCurrent - discNext);
  const achievableExtra = funCutMonthlyHKD + discretionaryCutMonthlyHKD;
  const partial =
    recommendation.requiredExtraMonthlyHKD > 0 &&
    achievableExtra + 1e-9 < recommendation.requiredExtraMonthlyHKD;
  return { funCutMonthlyHKD, discretionaryCutMonthlyHKD, partial };
}

/**
 * DeepSeek narrates an already-computed squeeze recommendation (reasoning only).
 * On transient AI failure after retries, returns a deterministic bilingual template.
 */
export async function narrateGoalSqueezeAction(
  sessionId: string,
  goalId: string,
  recommendation: SqueezeRecommendation,
  tone: WorkshopTone,
): Promise<Bilingual> {
  const id = sessionId?.trim();
  const targetGoalId = goalId?.trim();
  if (!id) {
    throw new Error("Session ID is required to narrate a squeeze recommendation.");
  }
  if (!targetGoalId) {
    throw new Error("Goal ID is required to narrate a squeeze recommendation.");
  }
  if (!WORKSHOP_TONES.has(tone)) {
    throw new Error("A valid workshop tone is required for squeeze narration.");
  }
  if (!recommendation || recommendation.requiredExtraMonthlyHKD <= 0) {
    throw new Error("A non-empty squeeze recommendation is required to narrate.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: { id: true, age: true, finalPyramidJson: true },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const goal = pyramid.goals.goals.find((row) => row.id === targetGoalId);
  if (!goal) {
    throw new Error("Goal not found in the confirmed pyramid.");
  }

  const cuts = squeezeCutMonthly(recommendation);
  const fallback = buildDeterministicSqueezeReasoning({
    funCutMonthlyHKD: cuts.funCutMonthlyHKD,
    discretionaryCutMonthlyHKD: cuts.discretionaryCutMonthlyHKD,
    achievableAtAge: recommendation.achievableAtAge,
    partial: cuts.partial,
  });

  const userPrompt = [
    `Goal: ${goal.label.en} / ${goal.label.zhHant}`,
    `Target age: ${goal.targetAge}`,
    `requiredExtraMonthlyHKD: ${recommendation.requiredExtraMonthlyHKD}`,
    `funCutMonthlyHKD: ${cuts.funCutMonthlyHKD}`,
    `discretionaryCutMonthlyHKD: ${cuts.discretionaryCutMonthlyHKD}`,
    `partialCapped: ${cuts.partial}`,
    `achievableAtAge: ${recommendation.achievableAtAge ?? "null"}`,
  ].join("\n");

  try {
    return await callDeepSeekParsed(
      {
        systemPrompt: NARRATE_GOAL_SQUEEZE_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        tone,
        bilingualFields: true,
      },
      (raw) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error(
            "DeepSeek returned invalid JSON for squeeze narration. Please try again.",
          );
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid squeeze narration: expected a JSON object.");
        }
        return assertStrictBilingual(
          (parsed as Record<string, unknown>).reasoning,
          "reasoning",
        );
      },
      { maxParseAttempts: 2 },
    );
  } catch (error) {
    if (!isTransientWorkshopAiError(error)) {
      throw error;
    }
    console.warn(
      "[workshop] narrateGoalSqueezeAction: AI unavailable after retries; using deterministic fallback",
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

export type ApplyGoalJourneyDecisionActionResult = {
  timeline: TimelineResult;
  legacyStressTest: StressTestResult;
  journey: GoalJourneyState;
  pyramid: PyramidState;
  expenses: ExpensesState;
  allocation: ReturnType<typeof currentJourneyAllocation>;
};

export async function applyGoalJourneyDecisionAction(
  sessionId: string,
  decision: GoalJourneyDecision,
): Promise<ApplyGoalJourneyDecisionActionResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to apply a goal journey decision.");
  }
  if (!decision?.goalId?.trim()) {
    throw new Error("Goal journey decision is missing a goal ID.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      retirementAge: true,
      monthlyIncome: true,
      industry: true,
      finalPyramidJson: true,
      expensesJson: true,
      goalJourneyJson: true,
    },
  });

  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }
  if (!session.expensesJson) {
    throw new Error("Confirmed expenses are missing. Please confirm expenses first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const expenses = parseExpensesState(session.expensesJson);
  const baseJourney = session.goalJourneyJson
    ? parseGoalJourneyState(session.goalJourneyJson)
    : emptyGoalJourneyState();
  const goal = pyramid.goals.goals.find((row) => row.id === decision.goalId);
  if (!goal) {
    throw new Error("Goal not found in the confirmed pyramid.");
  }

  let recommendation: SqueezeRecommendation | null = null;
  if (decision.status === "applied" && decision.acceptedSqueeze) {
    const workingPyramid: PyramidState = {
      ...pyramid,
      goals: {
        goals: pyramid.goals.goals.map((row) =>
          row.id === decision.goalId
            ? { ...row, allowLiquidation: decision.allowLiquidation }
            : row,
        ),
      },
    };
    const beforeTimeline = rerunTimelineForJourney({
      age: session.age,
      retirementAge: session.retirementAge,
      monthlyIncome: session.monthlyIncome,
      industry: session.industry,
      pyramid: workingPyramid,
      expenses,
      journey: baseJourney,
    });
    const outlook = computeGoalOutlook(beforeTimeline, {
      ...goal,
      allowLiquidation: decision.allowLiquidation,
    });
    recommendation = solveSqueeze({
      requiredExtraMonthlyHKD: outlook.requiredExtraMonthlyHKD,
      monthsLate: outlook.monthsLate,
      targetAge: goal.targetAge,
      monthlyIncomeHKD: session.monthlyIncome,
      expenses,
      monthlyFunHKD: workingPyramid.investment.monthlyFunHKD,
      monthlyInvestmentHKD: workingPyramid.investment.monthlyInvestmentHKD,
    });
  }

  const next = applyGoalDecision(
    {
      pyramid,
      expenses,
      journey: baseJourney,
      squeezeRecommendation: recommendation,
    },
    decision.goalId,
    {
      ...decision,
      squeezeCutsHKD: recommendation
        ? {
            fun:
              recommendation.currentAllocation.find((s) => s.key === "fun")
                ?.amountHKD != null &&
              recommendation.recommendedAllocation.find((s) => s.key === "fun")
                ?.amountHKD != null
                ? Math.round(
                    ((recommendation.currentAllocation.find((s) => s.key === "fun")
                      ?.amountHKD ?? 0) -
                      (recommendation.recommendedAllocation.find(
                        (s) => s.key === "fun",
                      )?.amountHKD ?? 0)) *
                      12,
                  )
                : 0,
            discretionary:
              recommendation.currentAllocation.find(
                (s) => s.key === "discretionary",
              )?.amountHKD != null &&
              recommendation.recommendedAllocation.find(
                (s) => s.key === "discretionary",
              )?.amountHKD != null
                ? Math.round(
                    ((recommendation.currentAllocation.find(
                      (s) => s.key === "discretionary",
                    )?.amountHKD ?? 0) -
                      (recommendation.recommendedAllocation.find(
                        (s) => s.key === "discretionary",
                      )?.amountHKD ?? 0)) *
                      12,
                  )
                : 0,
          }
        : decision.squeezeCutsHKD,
    },
  );

  const timeline = rerunTimelineForJourney({
    age: session.age,
    retirementAge: session.retirementAge,
    monthlyIncome: session.monthlyIncome,
    industry: session.industry,
    pyramid: next.pyramid,
    expenses: next.expenses,
    journey: next.journey,
  });
  const legacyStressTest = timelineToLegacyStressTest(timeline, next.pyramid);
  const macroResultJson = {
    version: MACRO_RESULT_VERSION_LIFE_TIMELINE,
    timeline,
  } as unknown as Prisma.InputJsonValue;

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: {
      finalPyramidJson: next.pyramid as unknown as Prisma.InputJsonValue,
      expensesJson: next.expenses as unknown as Prisma.InputJsonValue,
      goalJourneyJson: next.journey as unknown as Prisma.InputJsonValue,
      macroResultJson,
    },
  });

  return {
    timeline,
    legacyStressTest,
    journey: next.journey,
    pyramid: next.pyramid,
    expenses: next.expenses,
    allocation: currentJourneyAllocation({
      monthlyIncomeHKD: session.monthlyIncome,
      expenses: next.expenses,
      monthlyFunHKD: next.pyramid.investment.monthlyFunHKD,
      monthlyInvestmentHKD: next.pyramid.investment.monthlyInvestmentHKD,
    }),
  };
}

export type NarrateStressTestResult = {
  notes: StressTestNote[];
};

export type NarrateStressTestContext = {
  tone: WorkshopTone;
  age?: number;
  industry?: string;
  monthlyIncome?: number;
  expenses?: ExpensesState;
};

const NARRATE_STRESS_SYSTEM_PROMPT = `You explain amber/red (and oversaved emergency-fund) stress-test outcomes for a Hong Kong workshop participant.

You receive deterministic life-timeline numbers. For EACH flagged item only (amber or red goals, and emergency fund if amber/red/oversaved), write ONE short note (1–2 sentences) explaining WHY the projection needs attention — tone-flavored.

Rules:
- Reference ACTUAL numbers from the payload (target age, attained age or "not reached", inflated target HKD, EF months/target/excess/opportunity cost, surplus samples).
- For oversaved emergency fund: explain that excess cash above ~1.5× the target could be invested, citing excessHKD and opportunityCostHKD when provided. Do not invent those figures.
- Skip every green item entirely — positive-by-omission; do not write praise notes.
- Do not invent numbers. Do not give generic tips.
- id must be the goal id, or exactly "emergencyFund" for the emergency-fund card.
- Each note must be bilingual: { "en": string, "zhHant": string } — never a plain string.

Return ONLY valid JSON:
{
  "notes": [
    {
      "id": string,
      "note": { "en": string, "zhHant": string }
    }
  ]
}`;

function parseStressTestNotes(
  raw: string,
  expectedIds: string[],
): StressTestNote[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for stress-test narration. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid stress-test narration: expected a JSON object.");
  }

  const notesRaw = (parsed as Record<string, unknown>).notes;
  if (!Array.isArray(notesRaw)) {
    throw new Error('Invalid stress-test narration: "notes" must be an array.');
  }

  const expected = new Set(expectedIds);
  const notes: StressTestNote[] = [];

  for (let i = 0; i < notesRaw.length; i += 1) {
    const item = notesRaw[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(
        `Invalid stress-test narration: notes[${i}] must be an object.`,
      );
    }
    const row = item as Record<string, unknown>;
    const noteId = assertNonEmptyString(row.id, `notes[${i}].id`);
    const note = assertStrictBilingual(row.note, `notes[${i}].note`);
    if (!expected.has(noteId)) {
      // Ignore unexpected ids rather than failing the whole step.
      continue;
    }
    notes.push({ id: noteId, note });
  }

  // Ensure one note per expected id (fallback if model skipped one).
  return expectedIds.map((expectedId) => {
    const match = notes.find((n) => n.id === expectedId);
    if (match) {
      return match;
    }
    return {
      id: expectedId,
      note: {
        en: translate("en", "workshop.stressTest.noteFallback"),
        zhHant: translate("zh-Hant", "workshop.stressTest.noteFallback"),
      },
    };
  });
}

/**
 * Narrates amber/red/oversaved life-timeline items only.
 * Persists versioned TimelineResult + notes into WorkshopSession.macroResultJson.
 */
export async function narrateStressTestAction(
  sessionId: string,
  timeline: TimelineResult,
  context: NarrateStressTestContext,
): Promise<NarrateStressTestResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to narrate the stress test.");
  }
  if (!timeline || !Array.isArray(timeline.rows) || !Array.isArray(timeline.goals)) {
    throw new Error("Life timeline result is incomplete.");
  }
  if (!WORKSHOP_TONES.has(context.tone)) {
    throw new Error("A valid workshop tone is required for narration.");
  }

  const flaggedIds: string[] = [];
  const flaggedPayload: Array<Record<string, unknown>> = [];

  const ef = timeline.emergencyFund;
  if (ef && ef.status !== "green") {
    flaggedIds.push("emergencyFund");
    flaggedPayload.push({
      id: "emergencyFund",
      status: ef.status,
      targetMonths: ef.targetMonths,
      targetHKD: ef.targetHKD,
      excessHKD: ef.excessHKD ?? null,
      opportunityCostHKD: ef.opportunityCostHKD ?? null,
    });
  }

  for (const goal of timeline.goals) {
    if (goal.status === "green") {
      continue;
    }
    flaggedIds.push(goal.goalId);
    flaggedPayload.push({
      id: goal.goalId,
      status: goal.status,
      targetAge: goal.targetAge,
      attainedAtAge: goal.attainedAtAge,
      inflatedTargetHKD: goal.inflatedTargetHKD,
    });
  }

  let notes: StressTestNote[] = [];

  if (flaggedIds.length > 0) {
    const industry = context.industry?.trim() || "Other";
    const age = context.age ?? 30;
    const kind = resolveWageCurveKind(industry);
    const incomeGrowthRate =
      kind === "selfEmployed"
        ? WAGE_CURVES.selfEmployed.early
        : wageCagrForAge(kind, age);

    const housing = context.expenses?.categories?.find(
      (cat) => cat.key === "housing",
    );
    const expenseTotal =
      context.expenses?.totalHKD ??
      context.expenses?.categories?.reduce(
        (sum, cat) => sum + cat.amountHKD,
        0,
      ) ??
      0;
    const housingSharePercent =
      housing && expenseTotal > 0
        ? Math.round((housing.amountHKD / expenseTotal) * 100)
        : null;

    const earlySurplus = timeline.rows.slice(0, 3).map((row) => ({
      age: row.age,
      year: row.year,
      surplus: row.surplus,
      totalIncome: row.totalIncome,
      expenses: row.expenses,
    }));

    const userPrompt = [
      `Age: ${age}`,
      `Industry: ${industry}`,
      `Monthly income (HKD): ${context.monthlyIncome ?? "unknown"}`,
      `Approx industry income growth rate (decimal): ${incomeGrowthRate}`,
      housingSharePercent !== null
        ? `Housing share of monthly expenses: ${housingSharePercent}%`
        : "Housing share: not provided",
      `Retirement age: ${timeline.retirement.retirementAge}`,
      `Assets depleted at age: ${timeline.retirement.assetsDepletedAtAge ?? "never"}`,
      "",
      "Early surplus path (annual HKD):",
      JSON.stringify(earlySurplus),
      "",
      "Flagged amber/red/oversaved items only (write one note each):",
      JSON.stringify(flaggedPayload),
    ].join("\n");

    try {
      notes = await callDeepSeekParsed(
        {
          systemPrompt: NARRATE_STRESS_SYSTEM_PROMPT,
          userPrompt,
          jsonMode: true,
          tone: context.tone,
          bilingualFields: true,
        },
        (raw) => parseStressTestNotes(raw, flaggedIds),
        { maxParseAttempts: 2 },
      );
    } catch (error) {
      if (!isTransientWorkshopAiError(error)) {
        throw error;
      }
      console.warn(
        "[workshop] narrateStressTestAction: AI notes unavailable; continuing without notes",
        error instanceof Error ? error.message : error,
      );
      notes = [];
    }
  }

  const macroResultJson = {
    version: MACRO_RESULT_VERSION_LIFE_TIMELINE,
    timeline,
    notes,
  } as unknown as Prisma.InputJsonValue;

  const updated = await prisma.workshopSession.updateMany({
    where: { id },
    data: { macroResultJson },
  });

  if (updated.count === 0) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  return { notes };
}

export type MacroMilestoneNote = {
  year: number;
  note: Bilingual;
};

export type NarrateMacroTimelineResult = {
  milestoneNotes: MacroMilestoneNote[];
};

const NARRATE_MACRO_SYSTEM_PROMPT = `You are a sharp financial storyteller for Hong Kong professionals in a live workshop.

You receive a deterministic year-by-year wealth-pyramid simulation (HKD) plus the person's age and industry.
For EACH timeline year, write ONE short note (1–2 sentences) that explains in plain language what is happening to their pyramid at that year and why.

Rules:
- Reference the ACTUAL numbers provided (net worth, foundation, core, growth, emergency cover months).
- Reference their SPECIFIC industry and age (or age at that future year when relevant).
- Read as insight into THEIR path — not generic financial advice, tips, or platitudes.
- Do not invent numbers that are not in the timeline.
- Cover every year present in the timeline; do not add extra years.
- Each note must be bilingual: { "en": string, "zhHant": string } — never a plain string.

Return ONLY valid JSON matching this exact shape:
{
  "milestoneNotes": [
    { "year": number, "note": { "en": string, "zhHant": string } }
  ]
}`;

function parseMilestoneNotes(
  raw: string,
  expectedYears: number[],
): MacroMilestoneNote[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for macro narration. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid macro narration: expected a JSON object.");
  }

  const milestoneNotes = (parsed as Record<string, unknown>).milestoneNotes;
  if (!Array.isArray(milestoneNotes) || milestoneNotes.length === 0) {
    throw new Error(
      'Invalid macro narration: "milestoneNotes" must be a non-empty array.',
    );
  }

  const notes: MacroMilestoneNote[] = milestoneNotes.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(
        `Invalid macro narration: milestoneNotes[${index}] must be an object.`,
      );
    }
    const row = item as Record<string, unknown>;
    const year = assertFiniteNumber(row.year, `milestoneNotes[${index}].year`);
    const note = assertStrictBilingual(
      row.note,
      `milestoneNotes[${index}].note`,
    );
    return { year: Math.round(year), note };
  });

  const noteYears = new Set(notes.map((n) => n.year));
  for (const year of expectedYears) {
    if (!noteYears.has(year)) {
      throw new Error(
        `Invalid macro narration: missing note for timeline year ${year}.`,
      );
    }
  }

  // Keep notes ordered by the simulation timeline.
  return expectedYears.map((year) => {
    const match = notes.find((n) => n.year === year);
    if (!match) {
      throw new Error(
        `Invalid macro narration: missing note for timeline year ${year}.`,
      );
    }
    return match;
  });
}

/**
 * Narrates a deterministic macro timeline with DeepSeek, then persists
 * timeline + milestone notes on the WorkshopSession.
 */
export async function narrateMacroTimelineAction(
  sessionId: string,
  timeline: MacroSimulationResult,
): Promise<NarrateMacroTimelineResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to narrate the macro timeline.");
  }

  if (
    !timeline ||
    !Array.isArray(timeline.yearByYear) ||
    timeline.yearByYear.length === 0
  ) {
    throw new Error("Macro timeline must include at least one year snapshot.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      industry: true,
      monthlyIncome: true,
      householdStatus: true,
    },
  });

  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  const expectedYears = timeline.yearByYear.map((row) => row.year);

  const userPrompt = [
    `Current age: ${session.age}`,
    `Industry: ${session.industry}`,
    `Monthly income (HKD): ${session.monthlyIncome}`,
    `Household status: ${session.householdStatus ?? "not specified"}`,
    "",
    "Timeline snapshots (HKD):",
    JSON.stringify(timeline.yearByYear, null, 2),
  ].join("\n");

  const milestoneNotes = await callDeepSeekParsed(
    {
      systemPrompt: NARRATE_MACRO_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      bilingualFields: true,
    },
    (raw) => parseMilestoneNotes(raw, expectedYears),
    { maxParseAttempts: 2 },
  );

  const macroResultJson = {
    timeline,
    milestoneNotes,
  } as unknown as Prisma.InputJsonValue;

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: { macroResultJson },
  });

  return { milestoneNotes };
}

export type CrisisPersona = {
  age: number;
  industry: string;
  householdStatus?: string;
  monthlyIncome: number;
  riskProfile: RiskProfile;
  tone: WorkshopTone;
};

/** @deprecated Prefer CrisisState — kept for interim goals-step adapters. */
export type CrisisScenario = CrisisState;

const RISK_PROFILES = new Set<RiskProfile>([
  "conservative",
  "balanced",
  "aggressive",
]);

const CRISIS_TYPE_SET = new Set<string>(CRISIS_TYPES);

/** Param bounds enforced server-side (AI must stay within; we clamp / reject). */
const CRISIS_PARAM_BOUNDS: Record<
  CrisisType,
  {
    oneTimeCostHKD: [number, number];
    incomeHitPct: [number, number];
    durationMonths: [number, number];
    marketDropPct: [number, number];
  }
> = {
  medical: {
    oneTimeCostHKD: [50_000, 800_000],
    incomeHitPct: [0, 40],
    durationMonths: [1, 6],
    marketDropPct: [0, 0],
  },
  critical_illness: {
    oneTimeCostHKD: [200_000, 2_000_000],
    incomeHitPct: [0, 50],
    durationMonths: [3, 24],
    marketDropPct: [0, 0],
  },
  job_loss: {
    oneTimeCostHKD: [0, 100_000],
    incomeHitPct: [50, 100],
    durationMonths: [3, 18],
    marketDropPct: [0, 0],
  },
  market_crash: {
    oneTimeCostHKD: [0, 50_000],
    incomeHitPct: [0, 20],
    durationMonths: [1, 12],
    marketDropPct: [15, 50],
  },
  accident: {
    oneTimeCostHKD: [30_000, 500_000],
    incomeHitPct: [0, 30],
    durationMonths: [1, 12],
    marketDropPct: [0, 0],
  },
  family: {
    oneTimeCostHKD: [50_000, 400_000],
    incomeHitPct: [0, 40],
    durationMonths: [3, 18],
    marketDropPct: [0, 0],
  },
};

const GENERATE_CRISIS_SYSTEM_PROMPT = `You design ONE crisis scenario for a Hong Kong workshop participant.

You pick a crisisType and structured params. A DETERMINISTIC engine will compute all HKD impacts, coverage offsets, and cut-order absorption — you MUST NOT invent impact amounts or layer hit cards with numbers you calculated.

Allowed crisisType values (exact strings):
- "medical" — hospital / medical bill shock
- "critical_illness" — CI diagnosis cost shock
- "job_loss" — income disruption / redeployment
- "market_crash" — invested-asset mark-down
- "accident" — accident with medical cost
- "family" — family care / support cost shock

Risk-profile guidance (prefer, do not invent unknown types):
- aggressive → lean "market_crash" (still grounded in their industry/age)
- conservative → lean "medical" or "critical_illness"
- balanced → lean "job_loss" or "family" or "accident" suited to their industry

FORBIDDEN: unknown crisisType strings, generic "car accident" filler, lottery luck, or shocks that ignore industry/age/household.

Params (integers; stay within bounds — server clamps/rejects):
- medical: oneTimeCostHKD 50000–800000, incomeHitPct 0–40, durationMonths 1–6
- critical_illness: oneTimeCostHKD 200000–2000000, incomeHitPct 0–50, durationMonths 3–24
- job_loss: oneTimeCostHKD 0–100000, incomeHitPct 50–100, durationMonths 3–18
- market_crash: marketDropPct 15–50, incomeHitPct 0–20, durationMonths 1–12, oneTimeCostHKD 0–50000
- accident: oneTimeCostHKD 30000–500000, incomeHitPct 0–30, durationMonths 1–12
- family: oneTimeCostHKD 50000–400000, incomeHitPct 0–40, durationMonths 3–18

Narrative rules:
- title + description: bilingual { en, zhHant }, persona-specific, 2–4 sentences in description.
- Reference the PARAM numbers you chose (cost, %, months, drop) in prose — do NOT invent covered/uncovered HKD or which pool paid.
- headlines: optional bilingual blurbs keyed by stage id the engine may emit:
  coverage | fun | discretionary | liquid | invested | market | income | goals
  Only include keys that plausibly apply to your crisisType (e.g. never "coverage" for job_loss/market_crash/family).

Return ONLY valid JSON:
{
  "crisisType": "medical" | "critical_illness" | "job_loss" | "market_crash" | "accident" | "family",
  "oneTimeCostHKD": number,
  "incomeHitPct": number,
  "durationMonths": number,
  "marketDropPct": number,
  "title": { "en": string, "zhHant": string },
  "description": { "en": string, "zhHant": string },
  "headlines": {
    "coverage": { "en": string, "zhHant": string },
    "fun": { "en": string, "zhHant": string },
    "discretionary": { "en": string, "zhHant": string },
    "liquid": { "en": string, "zhHant": string },
    "invested": { "en": string, "zhHant": string },
    "market": { "en": string, "zhHant": string },
    "income": { "en": string, "zhHant": string },
    "goals": { "en": string, "zhHant": string }
  }
}

headlines may be {} or omit unused keys. marketDropPct required for market_crash; otherwise 0.`;

type ParsedCrisisNarrative = {
  crisisType: CrisisType;
  oneTimeCostHKD: number;
  incomeHitPct: number;
  durationMonths: number;
  marketDropPct: number;
  title: Bilingual;
  description: Bilingual;
  headlines: Partial<
    Record<
      NonNullable<CrisisImpact["stageId"]>,
      Bilingual
    >
  >;
};

function clampToBounds(value: number, bounds: [number, number]): number {
  return Math.min(bounds[1], Math.max(bounds[0], Math.round(value)));
}

function parseCrisisNarrative(raw: string): ParsedCrisisNarrative {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for crisis scenario. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid crisis scenario: expected a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  const crisisTypeRaw = assertNonEmptyString(record.crisisType, "crisisType");
  if (!CRISIS_TYPE_SET.has(crisisTypeRaw)) {
    throw new Error(
      `Invalid crisis scenario: unknown crisisType "${crisisTypeRaw}".`,
    );
  }
  const crisisType = crisisTypeRaw as CrisisType;
  const bounds = CRISIS_PARAM_BOUNDS[crisisType];

  const title = assertStrictBilingual(record.title, "title");
  const description = assertStrictBilingual(record.description, "description");

  const oneTimeCostHKD = clampToBounds(
    assertFiniteNumber(record.oneTimeCostHKD, "oneTimeCostHKD"),
    bounds.oneTimeCostHKD,
  );
  const incomeHitPct = clampToBounds(
    assertFiniteNumber(record.incomeHitPct, "incomeHitPct"),
    bounds.incomeHitPct,
  );
  const durationMonths = clampToBounds(
    assertFiniteNumber(record.durationMonths, "durationMonths"),
    bounds.durationMonths,
  );
  const marketDropRaw =
    record.marketDropPct === undefined || record.marketDropPct === null
      ? 0
      : assertFiniteNumber(record.marketDropPct, "marketDropPct");
  const marketDropPct =
    crisisType === "market_crash"
      ? clampToBounds(marketDropRaw, bounds.marketDropPct)
      : 0;

  const headlines: ParsedCrisisNarrative["headlines"] = {};
  const headlinesRaw = record.headlines;
  if (headlinesRaw && typeof headlinesRaw === "object" && !Array.isArray(headlinesRaw)) {
    const map = headlinesRaw as Record<string, unknown>;
    const keys = [
      "coverage",
      "fun",
      "discretionary",
      "liquid",
      "invested",
      "market",
      "income",
      "goals",
    ] as const;
    for (const key of keys) {
      if (map[key] == null) {
        continue;
      }
      // Reject coverage headlines for non-protection types (engine will omit the card).
      if (
        key === "coverage" &&
        crisisType !== "medical" &&
        crisisType !== "critical_illness" &&
        crisisType !== "accident"
      ) {
        continue;
      }
      headlines[key] = assertStrictBilingual(map[key], `headlines.${key}`);
    }
  }

  return {
    crisisType,
    oneTimeCostHKD,
    incomeHitPct,
    durationMonths,
    marketDropPct,
    title,
    description,
    headlines,
  };
}

function parseExpensesStateLoose(value: unknown): ExpensesState | null {
  try {
    return parseExpensesState(value);
  } catch {
    return null;
  }
}

/**
 * Generates a persona + risk-profile crisis via DeepSeek (type + params + narrative),
 * then runs the deterministic crisis-engine and persists crisisJson.
 */
export async function generateCrisisAction(
  sessionId: string,
  persona: CrisisPersona,
): Promise<CrisisState> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to generate a crisis scenario.");
  }

  if (
    typeof persona.age !== "number" ||
    !Number.isFinite(persona.age) ||
    persona.age < 16 ||
    persona.age > 100
  ) {
    throw new Error("Persona age must be a number between 16 and 100.");
  }
  if (
    typeof persona.monthlyIncome !== "number" ||
    !Number.isFinite(persona.monthlyIncome) ||
    persona.monthlyIncome < 0
  ) {
    throw new Error("Persona monthly income must be a non-negative number.");
  }
  const industry = persona.industry?.trim();
  if (!industry) {
    throw new Error("Persona industry is required.");
  }
  if (!RISK_PROFILES.has(persona.riskProfile)) {
    throw new Error("A valid risk profile is required to generate a crisis.");
  }
  if (!WORKSHOP_TONES.has(persona.tone)) {
    throw new Error("A valid workshop tone is required to generate a crisis.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      retirementAge: true,
      monthlyIncome: true,
      industry: true,
      finalPyramidJson: true,
      expensesJson: true,
      goalJourneyJson: true,
      macroResultJson: true,
    },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }
  if (!session.finalPyramidJson) {
    throw new Error("Confirmed pyramid is missing. Please confirm your pyramid first.");
  }

  const pyramid = normalizePyramidState(session.finalPyramidJson, session.age);
  const expenses =
    parseExpensesStateLoose(session.expensesJson) ??
    ({
      totalHKD: Math.round(session.monthlyIncome * 0.5),
      categories: [],
    } satisfies ExpensesState);
  const journey = parseGoalJourneyState(session.goalJourneyJson);
  const activeGoals = activeGoalsForJourney(pyramid, journey);

  const retirementAge = Math.min(
    80,
    Math.max(session.age + 1, Math.round(session.retirementAge ?? 65)),
  );

  let timeline: TimelineResult;
  const parsedMacro = parseMacroResultJson(session.macroResultJson);
  if (parsedMacro?.kind === "lifeTimeline") {
    timeline = parsedMacro.timeline;
  } else {
    timeline = runLifeTimeline({
      age: session.age,
      retirementAge,
      monthlyIncome: session.monthlyIncome,
      monthlyExpenses: expenses.totalHKD,
      monthlyFun: pyramid.investment.monthlyFunHKD,
      emergencyFundSavedHKD: pyramid.emergencyFund.savedAmountHKD,
      investment: {
        lumpSumHKD: pyramid.investment.lumpSumHKD,
        monthlyInvestmentHKD: pyramid.investment.monthlyInvestmentHKD,
        allocation: pyramid.investment.riskAllocation,
      },
      goals: activeGoals,
      industry: session.industry,
    });
  }

  const flavorHint =
    persona.riskProfile === "aggressive"
      ? "Prefer crisisType market_crash when it fits their holdings story."
      : persona.riskProfile === "conservative"
        ? "Prefer crisisType medical or critical_illness."
        : "Prefer crisisType job_loss, family, or accident suited to their industry.";

  const medicalPct = pyramid.protection.medicalCoveragePercent;
  const ciAmount = pyramid.protection.criticalIllnessAmountHKD;

  const userPrompt = [
    `Age: ${Math.round(persona.age)}`,
    `Industry: ${industry}`,
    `Monthly income (HKD): ${persona.monthlyIncome}`,
    `Household status: ${persona.householdStatus?.trim() || "not specified"}`,
    `Risk profile: ${persona.riskProfile}`,
    `Medical coverage % (engine will use — do not recompute offsets): ${medicalPct}`,
    `Critical illness cover HKD (engine will use): ${ciAmount}`,
    `Emergency fund saved HKD: ${pyramid.emergencyFund.savedAmountHKD}`,
    `Invested lump sum HKD: ${pyramid.investment.lumpSumHKD}`,
    flavorHint,
  ].join("\n");

  const narrative = await callDeepSeekParsed(
    {
      systemPrompt: GENERATE_CRISIS_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      tone: persona.tone,
      bilingualFields: true,
    },
    (raw) => parseCrisisNarrative(raw),
    { maxParseAttempts: 2 },
  );

  const impactResult = applyCrisis(
    timeline,
    {
      age: session.age,
      retirementAge,
      monthlyIncome: session.monthlyIncome,
      industry: session.industry,
      pyramid,
      expenses,
    },
    {
      crisisType: narrative.crisisType,
      oneTimeCostHKD: narrative.oneTimeCostHKD,
      durationMonths: narrative.durationMonths,
      monthlyIncomeImpactPercent: narrative.incomeHitPct,
      incomeHitPct: narrative.incomeHitPct,
      marketDropPct: narrative.marketDropPct,
    },
  );

  const impacts = buildCrisisImpactsFromEngine(
    impactResult,
    narrative.headlines,
  );

  const crisis: CrisisState = {
    crisisType: narrative.crisisType,
    title: narrative.title,
    description: narrative.description,
    riskProfile: persona.riskProfile,
    monthlyIncomeImpactPercent: narrative.incomeHitPct,
    oneTimeCostHKD: narrative.oneTimeCostHKD,
    durationMonths: narrative.durationMonths,
    incomeHitPct: narrative.incomeHitPct,
    marketDropPct:
      narrative.crisisType === "market_crash"
        ? narrative.marketDropPct
        : undefined,
    impacts,
    impactResult,
  };

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: {
      crisisJson: crisis as unknown as Prisma.InputJsonValue,
    },
  });

  return crisis;
}

export type GoalCategory = "protection" | "savings" | "investment";

export type WorkshopGoal = {
  rank: number;
  title: Bilingual;
  category: GoalCategory;
  reasoning: Bilingual;
  targetAmountHKD: number;
  targetYears: number;
};

export type GenerateGoalsContext = {
  persona: {
    age: number;
    industry: string;
    householdStatus?: string;
  };
  pyramid: {
    foundation: number;
    core: number;
    growth: number;
    apex: number;
  };
  weakestLayer: string;
  crisis: {
    title: Bilingual | string;
    monthlyIncomeImpactPercent: number;
    durationMonths: number;
  };
  fundsDepletedAtMonth: number | null;
};

export type GenerateGoalsResult = {
  goals: WorkshopGoal[];
};

const GOAL_CATEGORIES = new Set<GoalCategory>([
  "protection",
  "savings",
  "investment",
]);

const GENERATE_GOALS_SYSTEM_PROMPT = `You are a senior financial planning strategist for Hong Kong professionals in a live workshop.

Given this person's full profile — pyramid state, weakest layer, and how their specific generated crisis broke their finances — produce exactly 3 prioritized goals in order of urgency (rank 1 = most urgent).

CRITICAL: Each "reasoning" field must explicitly reference at least one concrete number or event from the input (e.g. their weakest layer amount, the crisis title, or the month funds ran out). Do not use generic phrases like "it's important to save for the future." If reasoning could apply to literally anyone, rewrite it.

title and reasoning must NEVER be plain strings — always { "en": "...", "zhHant": "..." }.

Return ONLY valid JSON matching this exact shape:
{
  "goals": [
    {
      "rank": number,
      "title": { "en": string, "zhHant": string },
      "category": "protection" | "savings" | "investment",
      "reasoning": { "en": string, "zhHant": string },
      "targetAmountHKD": number,
      "targetYears": number
    }
  ]
}

Constraints:
- Exactly 3 goals
- rank must be 1, 2, and 3 (unique)
- category must be one of: protection, savings, investment
- reasoning: 2–4 sentences, grounded in THIS person's numbers/events (bilingual object)
- targetAmountHKD: positive HKD amount
- targetYears: positive number of years`;

function parseGoalsResult(raw: string): GenerateGoalsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for goals. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid goals response: expected a JSON object.");
  }

  const goalsRaw = (parsed as Record<string, unknown>).goals;
  if (!Array.isArray(goalsRaw) || goalsRaw.length !== 3) {
    throw new Error('Invalid goals response: "goals" must be an array of exactly 3 items.');
  }

  const goals: WorkshopGoal[] = goalsRaw.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Invalid goals response: goals[${index}] must be an object.`);
    }
    const row = item as Record<string, unknown>;
    const rank = Math.round(assertFiniteNumber(row.rank, `goals[${index}].rank`));
    const title = assertStrictBilingual(row.title, `goals[${index}].title`);
    const categoryRaw = assertNonEmptyString(
      row.category,
      `goals[${index}].category`,
    );
    if (!GOAL_CATEGORIES.has(categoryRaw as GoalCategory)) {
      throw new Error(
        `Invalid goals response: goals[${index}].category must be protection, savings, or investment.`,
      );
    }
    const reasoning = assertStrictBilingual(
      row.reasoning,
      `goals[${index}].reasoning`,
    );
    const targetAmountHKD = assertFiniteNumber(
      row.targetAmountHKD,
      `goals[${index}].targetAmountHKD`,
    );
    const targetYears = assertFiniteNumber(
      row.targetYears,
      `goals[${index}].targetYears`,
    );

    if (targetAmountHKD <= 0) {
      throw new Error(
        `Invalid goals response: goals[${index}].targetAmountHKD must be positive.`,
      );
    }
    if (targetYears <= 0) {
      throw new Error(
        `Invalid goals response: goals[${index}].targetYears must be positive.`,
      );
    }

    return {
      rank,
      title,
      category: categoryRaw as GoalCategory,
      reasoning,
      targetAmountHKD,
      targetYears,
    };
  });

  const ranks = goals.map((g) => g.rank).sort((a, b) => a - b);
  if (ranks[0] !== 1 || ranks[1] !== 2 || ranks[2] !== 3) {
    throw new Error(
      'Invalid goals response: ranks must be unique values 1, 2, and 3.',
    );
  }

  return {
    goals: [...goals].sort((a, b) => a.rank - b.rank),
  };
}

/**
 * Generates 3 prioritized goals via DeepSeek and saves them to goalsJson.
 */
export async function generateGoalsAction(
  sessionId: string,
  context: GenerateGoalsContext,
): Promise<GenerateGoalsResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to generate goals.");
  }

  const industry = context.persona?.industry?.trim();
  if (!industry) {
    throw new Error("Persona industry is required.");
  }
  if (
    typeof context.persona.age !== "number" ||
    !Number.isFinite(context.persona.age)
  ) {
    throw new Error("Persona age is required.");
  }
  if (!context.weakestLayer?.trim()) {
    throw new Error("Weakest layer is required.");
  }
  const crisisTitle =
    typeof context.crisis?.title === "string"
      ? context.crisis.title.trim()
      : context.crisis?.title &&
          typeof context.crisis.title === "object" &&
          typeof context.crisis.title.en === "string"
        ? context.crisis.title.en.trim()
        : "";
  if (!crisisTitle) {
    throw new Error("Crisis title is required.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  const userPrompt = [
    "Persona:",
    `- Age: ${Math.round(context.persona.age)}`,
    `- Industry: ${industry}`,
    `- Household status: ${context.persona.householdStatus?.trim() || "not specified"}`,
    "",
    "Confirmed pyramid (HKD):",
    `- Foundation: ${context.pyramid.foundation}`,
    `- Core: ${context.pyramid.core}`,
    `- Growth: ${context.pyramid.growth}`,
    `- Apex: ${context.pyramid.apex}`,
    `- Weakest layer: ${context.weakestLayer}`,
    "",
    "Crisis stress test:",
    `- Title: ${crisisTitle}`,
    `- Monthly income impact: ${context.crisis.monthlyIncomeImpactPercent}%`,
    `- Duration: ${context.crisis.durationMonths} months`,
    `- Funds depleted at month: ${
      context.fundsDepletedAtMonth === null
        ? "not depleted within the shock window"
        : context.fundsDepletedAtMonth
    }`,
  ].join("\n");

  const result = await callDeepSeekParsed(
    {
      systemPrompt: GENERATE_GOALS_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      bilingualFields: true,
    },
    parseGoalsResult,
    { maxParseAttempts: 2 },
  );

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: {
      goalsJson: result as unknown as Prisma.InputJsonValue,
    },
  });

  return result;
}

const ACTION_GOAL_CATEGORIES = new Set([
  "protection",
  "savings",
  "investment",
  "goal",
]);

const ACTION_CATEGORY_META: Array<{
  actionCategory: ActionGoal["category"];
  ratingKey: RatingCategory;
  icon: string;
}> = [
  { actionCategory: "protection", ratingKey: "protection", icon: "Shield" },
  { actionCategory: "savings", ratingKey: "emergencyFund", icon: "PiggyBank" },
  { actionCategory: "goal", ratingKey: "goalsOnTrack", icon: "Target" },
  {
    actionCategory: "investment",
    ratingKey: "crisisResilience",
    icon: "TrendingUp",
  },
];

const GENERATE_ACTION_GOALS_SYSTEM_PROMPT = `You write exactly 3 ranked action goals for a Hong Kong workshop participant.

You receive:
1. A DETERMINISTIC rating breakdown and a pre-ranked list of 3 seed goals (rank, category, icon, impactPoints already fixed).
2. A curated "decisions" block from their goal journey and crisis stress test — this is the only behavioral context you may cite.

Your job is ONLY to write:
- title — short, specific, action-oriented (not generic), as bilingual { en, zhHant }
- reasoning — 2–3 sentences explaining WHY the math recommends this action, as bilingual { en, zhHant }

Rules:
- You are explaining WHY the math recommends each action. Every reasoning paragraph MUST reference at least one specific decision the user made in their goal journey (a goal they protected, gave up, or funded via liquidation; a squeeze they accepted/rejected) OR the crisis stress test outcome. Generic financial advice with no reference to their decisions is a failure.
- You may NOT invent, round, or modify any number. Use only the numbers provided in the payload, verbatim.
- Keep rank, category, icon, and impactPoints EXACTLY as given in the seeds — echo impactPoints unchanged.
- If crisisStressTest.verdict is PENETRATED, the highest-ranked protection-category action goal must explicitly connect the recommendation to the affected goal and delay (e.g., "this is what stops your [goal] from being delayed by [N] years").
- If profileBehaviorMismatch is true, exactly one action goal's reasoning may reference the gap between their quiz profile and their actual behavior — as an insight, never as criticism.
- Never shame the user for goals they gave up. Frame given-up goals as deliberate prioritization if referenced.
- Do not reference step numbers ("Step 4", "Step 6") — refer to experiences ("your goal journey", "the stress test"). Step numbering changed and must not leak into user-facing copy.
- title and reasoning must NEVER be plain strings — always { "en": "...", "zhHant": "..." }.
- Do not return markdown.

Return ONLY valid JSON:
{
  "actionGoals": [
    {
      "rank": 1,
      "title": { "en": string, "zhHant": string },
      "category": "protection" | "savings" | "investment" | "goal",
      "icon": string,
      "impactPoints": number,
      "reasoning": { "en": string, "zhHant": string }
    }
  ]
}`;

export type GenerateActionGoalsInput = {
  tone: WorkshopTone;
  pyramid: PyramidState;
  benchmarks: {
    medicalCoveragePercent: number;
    criticalIllnessAmountHKD: number;
    emergencyFundTargetMonths: number;
    emergencyFundTargetHKD: number;
  };
  stressTest: StressTestResult;
  /** Final mutated expenses (post Step 4 squeezes). */
  expenses: ExpensesState;
  monthlyIncome: number;
  /** Optional — old sessions may still have crisisJson; new flows may omit it. */
  crisis?: CrisisState | null;
  age?: number;
  industry?: string;
};

type ActionGoalSeed = {
  rank: number;
  category: ActionGoal["category"];
  icon: string;
  impactPoints: number;
  ratingKey: RatingCategory;
  currentScore: number;
  gap: number;
};

function buildActionGoalSeeds(
  rating: SummaryRating,
  impactContext?: GoalImpactContext,
): ActionGoalSeed[] {
  const candidates = ACTION_CATEGORY_META.map((meta) => {
    const currentScore = rating.breakdown[meta.ratingKey];
    const gap = Math.max(0, 100 - currentScore);
    const impactPoints = computeGoalImpactPoints(
      meta.ratingKey,
      gap,
      RATING_WEIGHTS[meta.ratingKey],
      impactContext,
    );
    return {
      category: meta.actionCategory,
      icon: meta.icon,
      impactPoints,
      ratingKey: meta.ratingKey,
      currentScore,
      gap,
    };
  });

  return [...candidates]
    .sort((a, b) => {
      if (b.impactPoints !== a.impactPoints) {
        return b.impactPoints - a.impactPoints;
      }
      return b.gap - a.gap;
    })
    .slice(0, 3)
    .map((seed, index) => ({
      ...seed,
      rank: index + 1,
    }));
}

function parseActionGoalsResult(
  raw: string,
  seeds: ActionGoalSeed[],
): ActionGoal[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "DeepSeek returned invalid JSON for action goals. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid action goals response: expected a JSON object.");
  }

  const goalsRaw = (parsed as Record<string, unknown>).actionGoals;
  if (!Array.isArray(goalsRaw) || goalsRaw.length !== 3) {
    throw new Error(
      'Invalid action goals response: "actionGoals" must be an array of exactly 3 items.',
    );
  }

  const byRank = new Map(seeds.map((seed) => [seed.rank, seed]));

  const goals: ActionGoal[] = goalsRaw.map((item, index) => {
    const row = assertRecord(item, `actionGoals[${index}]`);
    const rank = Math.round(
      assertFiniteNumber(row.rank, `actionGoals[${index}].rank`),
    );
    const seed = byRank.get(rank);
    if (!seed) {
      throw new Error(
        `Invalid action goals response: unexpected rank ${rank}.`,
      );
    }

    const title = assertStrictBilingual(row.title, `actionGoals[${index}].title`);
    const categoryRaw = assertNonEmptyString(
      row.category,
      `actionGoals[${index}].category`,
    );
    if (!ACTION_GOAL_CATEGORIES.has(categoryRaw)) {
      throw new Error(
        `Invalid action goals response: actionGoals[${index}].category is invalid.`,
      );
    }
    const reasoning = assertStrictBilingual(
      row.reasoning,
      `actionGoals[${index}].reasoning`,
    );

    const impactPoints = assertFiniteNumber(
      row.impactPoints,
      `actionGoals[${index}].impactPoints`,
    );
    if (impactPoints !== seed.impactPoints) {
      throw new Error(
        `Invalid action goals response: impactPoints mismatch at rank ${rank} (got ${impactPoints}, expected ${seed.impactPoints}).`,
      );
    }

    // Deterministic fields from seeds — AI may only supply title/reasoning.
    return {
      rank: seed.rank,
      title,
      category: seed.category,
      icon: seed.icon,
      impactPoints: seed.impactPoints,
      reasoning,
    };
  });

  const ranks = goals.map((g) => g.rank).sort((a, b) => a - b);
  if (ranks[0] !== 1 || ranks[1] !== 2 || ranks[2] !== 3) {
    throw new Error(
      "Invalid action goals response: ranks must be unique values 1, 2, and 3.",
    );
  }

  return [...goals].sort((a, b) => a.rank - b.rank);
}

/**
 * Parse risk profile from persisted riskQuizJson (additive / defensive).
 */
function parseRiskProfileFromQuiz(value: unknown): RiskProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const profile = (value as Record<string, unknown>).profile;
  if (
    profile === "conservative" ||
    profile === "balanced" ||
    profile === "aggressive"
  ) {
    return profile;
  }
  return null;
}

/**
 * Computes rating + impactPoints deterministically, asks DeepSeek only for
 * titles/reasoning, saves SummaryState into goalsJson.
 * Also runs the silent Summary Crisis Stress Test (pure TS — no AI).
 */
export async function generateActionGoalsAction(
  sessionId: string,
  input: GenerateActionGoalsInput,
): Promise<SummaryState> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to generate action goals.");
  }
  if (!WORKSHOP_TONES.has(input.tone)) {
    throw new Error("A valid workshop tone is required.");
  }
  if (!input.pyramid || !input.benchmarks || !input.stressTest || !input.expenses) {
    throw new Error("Full session context is required for action goals.");
  }
  if (
    typeof input.monthlyIncome !== "number" ||
    !Number.isFinite(input.monthlyIncome) ||
    input.monthlyIncome < 0
  ) {
    throw new Error("Monthly income is required for action goals.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: {
      id: true,
      age: true,
      industry: true,
      monthlyIncome: true,
      retirementAge: true,
      macroResultJson: true,
      goalJourneyJson: true,
      crisisJson: true,
      riskQuizJson: true,
      expensesJson: true,
      finalPyramidJson: true,
    },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  const parsedMacro = parseMacroResultJson(session.macroResultJson);
  const timeline =
    parsedMacro?.kind === "lifeTimeline" ? parsedMacro.timeline : null;
  const journey = parseGoalJourneyState(session.goalJourneyJson);
  // Prefer caller-supplied crisis; fall back to persisted crisisJson (legacy).
  const crisis =
    input.crisis ??
    (session.crisisJson
      ? (session.crisisJson as unknown as CrisisState)
      : null);

  const age = input.age ?? session.age;
  const industry = (input.industry?.trim() || session.industry || "").trim();
  const monthlyIncome =
    input.monthlyIncome > 0 ? input.monthlyIncome : session.monthlyIncome;
  const riskProfile = parseRiskProfileFromQuiz(session.riskQuizJson) ?? "balanced";

  // Prefer session mutated plan (post goal-journey) over possibly-stale wizard props.
  const pyramid = session.finalPyramidJson
    ? normalizePyramidState(session.finalPyramidJson, age)
    : input.pyramid;
  let expenses = input.expenses;
  if (session.expensesJson) {
    try {
      expenses = parseExpensesState(session.expensesJson);
    } catch {
      expenses = input.expenses;
    }
  }

  const stressTestResult = runCrisisStressTest({
    age,
    retirementAge: session.retirementAge,
    monthlyIncome,
    industry,
    riskProfile,
    pyramid,
    expenses,
    journey,
    timeline,
  });
  const crisisStressTest = toCrisisStressTestSummary(stressTestResult);

  const rating = computeFinancialRating({
    pyramid,
    benchmarks: input.benchmarks,
    stressTest: input.stressTest,
    crisis,
    crisisStressTest,
    timeline,
    journey,
  });

  const coverage =
    stressTestResult.impactResult.coverage ??
    crisis?.impactResult?.coverage;
  const coverageRatio =
    coverage && coverage.grossCostHKD > 0
      ? coverage.coveredHKD / coverage.grossCostHKD
      : undefined;

  const impactContext: GoalImpactContext = {
    efStatus: timeline?.emergencyFund.status,
    excessHKD: timeline?.emergencyFund.excessHKD,
    coverageRatio,
    assetsDepletedAtAge: timeline?.retirement.assetsDepletedAtAge ?? null,
  };

  const seeds = buildActionGoalSeeds(rating, impactContext);
  const decisions = buildActionGoalsDecisionsPayload({
    pyramid,
    expenses,
    monthlyIncome,
    journey,
    crisisStressTest,
    riskProfile,
    timeline,
  });

  const userPrompt = [
    `Age: ${age}`,
    `Industry: ${industry || "unknown"}`,
    `Planned retirement age: ${session.retirementAge ?? "unknown"}`,
    "",
    "Rating (deterministic — do not invent scores):",
    JSON.stringify(rating),
    "",
    "Pre-ranked action seeds (keep rank/category/icon/impactPoints exact — echo impactPoints verbatim):",
    JSON.stringify(
      seeds.map((s) => ({
        rank: s.rank,
        category: s.category,
        icon: s.icon,
        impactPoints: s.impactPoints,
        currentScore: s.currentScore,
        gap: s.gap,
        ratingKey: s.ratingKey,
      })),
    ),
    "",
    "decisions (curated — cite these facts; do not invent):",
    JSON.stringify(decisions),
    "",
    "Write title + reasoning for each seed. Every reasoning must reference a goal-journey decision and/or the stress test. Numbers verbatim. No step numbers.",
  ].join("\n");

  let actionGoals: ActionGoal[];
  try {
    actionGoals = await callDeepSeekParsed(
      {
        systemPrompt: GENERATE_ACTION_GOALS_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        tone: input.tone,
        bilingualFields: true,
      },
      (raw) => parseActionGoalsResult(raw, seeds),
      { maxParseAttempts: 2 },
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown action-goals failure";
    logActionGoalsFallback({
      sessionId: session.id,
      ranks: seeds.map((s) => s.rank),
      categories: seeds.map((s) => s.category),
      reason,
    });
    actionGoals = buildDeterministicActionGoalsFallback(seeds, decisions);
  }

  const summary: SummaryState = { rating, actionGoals, crisisStressTest };

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: {
      goalsJson: summary as unknown as Prisma.InputJsonValue,
    },
  });

  return summary;
}
