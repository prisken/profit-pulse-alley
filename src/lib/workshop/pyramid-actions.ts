"use server";

import { Prisma } from "@prisma/client";

import {
  callDeepSeekParsed,
  isTransientWorkshopAiError,
} from "@/lib/workshop/deepseek-client";
import {
  buildDeterministicExpensesGuess,
  buildDeterministicPyramidGuess,
} from "@/lib/workshop/ai-fallbacks";
import { assertStrictBilingual } from "@/lib/workshop/bilingual";
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
  buildPyramidBenchmarks,
  computeLayerFlags,
  type PyramidBenchmarkSnapshot,
} from "@/lib/workshop/pyramid-benchmarks";
import {
  RATING_WEIGHTS,
  computeFinancialRating,
  computeGoalImpactPoints,
  type RatingCategory,
} from "@/lib/workshop/financial-rating";
import type {
  ActionGoal,
  Bilingual,
  CrisisImpact,
  CrisisState,
  ExpenseCategory,
  ExpenseCategoryKey,
  ExpensesState,
  GoalItem,
  LayerFlags,
  PyramidState,
  RiskProfile,
  RiskQuizAnswer,
  StressTestNote,
  StressTestResult,
  SummaryRating,
  SummaryState,
  WorkshopTone,
} from "@/lib/workshop/types";
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

Given age, monthly income (HKD), industry, and household status, return realistic CURRENT-state guesses:

1) protection.medicalCoveragePercent — 0–100 integer guess of their current medical/hospital coverage %.
2) protection.criticalIllnessAmountHKD — current CI sum assured in HKD (often 0 if they likely have none).
3) emergencyFund.savedAmountHKD — current liquid emergency savings in HKD.
4) goals.goals — array of 2–4 GoalItem objects inferred from age + household:
   - unmarried / single and under 35 → often include a wedding fund
   - age under 28 → may include further-education / upskilling fund
   - has kids (married with kids / single parent) → include kids' education fund
   - always include at least one sensible retirement-adjacent or long-horizon goal if the list would otherwise be thin
   Each goal needs: id (short slug like "wedding"), icon (a lucide-react icon name string e.g. "Heart", "GraduationCap", "PiggyBank", "Home", "Plane"), label as bilingual { en, zhHant }, targetAmountHKD (income-relative), targetYear (an actual calendar year in the future).
5) investment.monthlyInvestmentHKD and investment.monthlyFunHKD — plausible monthly amounts given income minus a rough expense load for their profile.
6) investment.riskAllocation — your FIRST GUESS of how they might currently allocate risk as integer % { low, mid, high } summing to 100. This is informational flavor only.
7) rationale — 2–3 sentences, tone-flavored, referencing THEIR specific guessed numbers (not generic advice). Must be bilingual { en, zhHant }.

Do NOT invent recommended "should have" targets as the primary numbers — estimate CURRENT reality. Do not return markdown.

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
        "targetYear": number
      }
    ]
  },
  "investment": {
    "riskAllocation": { "low": number, "mid": number, "high": number },
    "monthlyInvestmentHKD": number,
    "monthlyFunHKD": number
  },
  "rationale": { "en": string, "zhHant": string }
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

function parseGoalItem(value: unknown, index: number): GoalItem {
  const field = `goals.goals[${index}]`;
  const record = assertRecord(value, field);
  const id = assertNonEmptyString(record.id, `${field}.id`);
  const icon = assertNonEmptyString(record.icon, `${field}.icon`);
  const label = assertStrictBilingual(record.label, `${field}.label`);
  const targetAmountHKD = assertFiniteNumber(
    record.targetAmountHKD,
    `${field}.targetAmountHKD`,
  );
  const targetYear = Math.round(
    assertFiniteNumber(record.targetYear, `${field}.targetYear`),
  );
  if (targetAmountHKD < 0) {
    throw new Error(`Invalid pyramid prediction: "${field}.targetAmountHKD" cannot be negative.`);
  }
  if (targetYear < 2000 || targetYear > 2100) {
    throw new Error(
      `Invalid pyramid prediction: "${field}.targetYear" must be a plausible calendar year.`,
    );
  }
  return { id, icon, label, targetAmountHKD, targetYear };
}

type ParsedAiPyramid = {
  pyramid: PyramidState;
  rationale: Bilingual;
};

function parseAiPyramidPrediction(raw: string): ParsedAiPyramid {
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
  const goals = goalsRaw.goals.map((item, index) => parseGoalItem(item, index));

  const monthlyInvestmentHKD = assertFiniteNumber(
    investmentRaw.monthlyInvestmentHKD,
    "investment.monthlyInvestmentHKD",
  );
  const monthlyFunHKD = assertFiniteNumber(
    investmentRaw.monthlyFunHKD,
    "investment.monthlyFunHKD",
  );
  if (monthlyInvestmentHKD < 0 || monthlyFunHKD < 0) {
    throw new Error(
      "Invalid pyramid prediction: investment monthly amounts cannot be negative.",
    );
  }

  const riskAllocation = parseRiskAllocation(
    investmentRaw.riskAllocation,
    "investment.riskAllocation",
  );
  const rationale = assertStrictBilingual(root.rationale, "rationale");

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
        monthlyInvestmentHKD: Math.round(monthlyInvestmentHKD),
        monthlyFunHKD: Math.round(monthlyFunHKD),
      },
    },
    rationale,
  };
}

function validatePredictInput(input: PredictPyramidInput): {
  age: number;
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
    age: Math.round(input.age),
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

  const userPrompt = [
    `Age: ${validated.age}`,
    `Monthly income (HKD): ${validated.monthlyIncome}`,
    `Industry: ${formatIndustryForAi(validated.industry, validated.industryOther)}`,
    `Household status: ${formatHouseholdForAi(validated.householdStatus)}`,
    "",
    "Estimate CURRENT coverage and balances — not ideal recommendations.",
  ].join("\n");

  const industryForMath = formatIndustryForAi(
    validated.industry,
    validated.industryOther,
  );

  let aiPyramid: PyramidState;
  let rationale: Bilingual;

  try {
    const parsed = await callDeepSeekParsed(
      {
        systemPrompt: PREDICT_PYRAMID_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        tone: validated.tone,
        bilingualFields: true,
      },
      parseAiPyramidPrediction,
      { maxParseAttempts: 2 },
    );
    aiPyramid = parsed.pyramid;
    rationale = parsed.rationale;
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
    });
    aiPyramid = fallback.pyramid;
    rationale = fallback.rationale;
  }

  const benchmarks = buildPyramidBenchmarks({
    age: validated.age,
    monthlyIncomeHKD: validated.monthlyIncome,
    industry: industryForMath,
  });

  const finalPyramid: PyramidState = {
    ...aiPyramid,
    investment: {
      ...aiPyramid.investment,
      // Editable starting risk = deterministic glide path, not the AI guess.
      riskAllocation: { ...benchmarks.riskAllocation },
    },
  };

  const layerFlags = computeLayerFlags(aiPyramid, benchmarks);

  const aiPyramidJson = {
    ...aiPyramid,
    rationale,
  } as unknown as Prisma.InputJsonValue;

  const finalPyramidJson = {
    ...finalPyramid,
    rationale,
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

  const finalPyramidJson = {
    ...pyramid,
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
    `- monthlyInvestmentHKD: ${input.pyramid.investment.monthlyInvestmentHKD}`,
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
 * Thin server wrapper around pure `runGoalStressTest` for client components.
 */
export async function runGoalStressTestAction(
  input: GoalStressTestInput,
): Promise<StressTestResult> {
  return runGoalStressTest(input);
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

const NARRATE_STRESS_SYSTEM_PROMPT = `You explain amber/red stress-test outcomes for a Hong Kong workshop participant.

You receive deterministic stress-test numbers. For EACH flagged item only (amber or red goals, and emergency fund if amber/red), write ONE short note (1–2 sentences) explaining WHY the projection is behind — tone-flavored.

Rules:
- Reference ACTUAL numbers from the payload (target year, projected year or "not reached", months, surplus, rent/housing share of expenses if given, income growth rate, goal label).
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
    const id = assertNonEmptyString(row.id, `notes[${i}].id`);
    const note = assertStrictBilingual(row.note, `notes[${i}].note`);
    if (!expected.has(id)) {
      // Ignore unexpected ids rather than failing the whole step.
      continue;
    }
    notes.push({ id, note });
  }

  // Ensure one note per expected id (fallback if model skipped one).
  return expectedIds.map((id) => {
    const match = notes.find((n) => n.id === id);
    if (match) {
      return match;
    }
    return {
      id,
      note: {
        en: translate("en", "workshop.stressTest.noteFallback"),
        zhHant: translate("zh-Hant", "workshop.stressTest.noteFallback"),
      },
    };
  });
}

/**
 * Narrates amber/red stress-test items only. Persists StressTestResult + notes
 * into WorkshopSession.macroResultJson.
 */
export async function narrateStressTestAction(
  sessionId: string,
  result: StressTestResult,
  context: NarrateStressTestContext,
): Promise<NarrateStressTestResult> {
  const id = sessionId?.trim();
  if (!id) {
    throw new Error("Session ID is required to narrate the stress test.");
  }
  if (!result || !Array.isArray(result.goalProjections)) {
    throw new Error("Stress test result is incomplete.");
  }
  if (!WORKSHOP_TONES.has(context.tone)) {
    throw new Error("A valid workshop tone is required for narration.");
  }

  const flaggedIds: string[] = [];
  const flaggedPayload: Array<Record<string, unknown>> = [];

  if (
    result.emergencyFundProjection &&
    result.emergencyFundProjection.status !== "green"
  ) {
    flaggedIds.push("emergencyFund");
    flaggedPayload.push({
      id: "emergencyFund",
      status: result.emergencyFundProjection.status,
      targetMonths: result.emergencyFundProjection.targetMonths,
      projectedMonths: result.emergencyFundProjection.projectedMonths,
    });
  }

  for (const goal of result.goalProjections) {
    if (goal.status === "green") {
      continue;
    }
    flaggedIds.push(goal.goalId);
    flaggedPayload.push({
      id: goal.goalId,
      label: goal.label.en,
      status: goal.status,
      targetYear: goal.targetYear,
      projectedYear: goal.projectedYear,
      targetAmountHKD: goal.targetAmountHKD,
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

    const earlySurplus = result.monthlySurplusByYear.slice(0, 3);

    const userPrompt = [
      `Age: ${age}`,
      `Industry: ${industry}`,
      `Monthly income (HKD): ${context.monthlyIncome ?? "unknown"}`,
      `Approx industry income growth rate (decimal): ${incomeGrowthRate}`,
      housingSharePercent !== null
        ? `Housing share of monthly expenses: ${housingSharePercent}%`
        : "Housing share: not provided",
      "",
      "Early surplus path (monthly HKD):",
      JSON.stringify(earlySurplus),
      "",
      "Flagged amber/red items only (write one note each):",
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
    ...result,
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

const CRISIS_LAYERS = new Set([
  "protection",
  "emergencyFund",
  "investment",
  "goals",
]);

const RISK_PROFILES = new Set<RiskProfile>([
  "conservative",
  "balanced",
  "aggressive",
]);

const GENERATE_CRISIS_SYSTEM_PROMPT = `You are a risk actuary designing a single stress-test crisis for a Hong Kong professional in a live workshop.

Generate ONE highly specific, realistic financial shock tailored EXACTLY to this person's industry, age, household status, AND risk profile.

Risk-profile scenario flavor (mandatory):
- aggressive → market-crash-triggered liquidation / leveraged-growth unwind scenario (still grounded in THEIR industry/age — e.g. concentrated stock/options hit for a tech seller, property leverage shock for a realtor)
- conservative → medical / health-gap fear scenario (hospital bill, CI gap, caregiver cost) that exploits thin protection for THEIR life stage
- balanced → mixed career / income disruption scenario (redeployment, client loss, role obsolescence) specific to THEIR industry

Explicitly FORBIDDEN generic scenarios: car accidents, broken laptops/phones, generic "unexpected expense", lottery-style luck events, or any shock that could apply equally to any profession.

Also return impacts: an array of 2–4 CrisisImpact objects. Each impact tags which pyramid layer is hit and includes a punchy bilingual headline plus either detailHKD or detailMonths (not both required, but at least one should usually be set).
Examples:
- { "layer": "protection", "icon": "ShieldOff", "headline": { "en": "No Critical Illness Cover", "zhHant": "沒有危疾保障" }, "detailHKD": 340000 }
- { "layer": "emergencyFund", "icon": "PiggyBank", "headline": { "en": "Cash runway collapses", "zhHant": "現金緩衝崩潰" }, "detailMonths": 4 }
- { "layer": "investment", "icon": "TrendingDown", "headline": { "en": "Forced sale at the bottom", "zhHant": "低位被迫斬倉" }, "detailHKD": 180000 }
- { "layer": "goals", "icon": "Target", "headline": { "en": "Wedding fund delayed", "zhHant": "婚禮儲蓄延期" }, "detailMonths": 24 }

Return ONLY valid JSON matching this exact shape:
{
  "title": { "en": string, "zhHant": string },
  "description": { "en": string, "zhHant": string },
  "monthlyIncomeImpactPercent": number,
  "oneTimeCostHKD": number,
  "durationMonths": number,
  "impacts": [
    {
      "layer": "protection" | "emergencyFund" | "investment" | "goals",
      "icon": string,
      "headline": { "en": string, "zhHant": string },
      "detailHKD": number,
      "detailMonths": number
    }
  ]
}

Constraints on numbers:
- monthlyIncomeImpactPercent: integer 0–100
- oneTimeCostHKD: non-negative HKD
- durationMonths: positive integer
- description: 2–4 sentences, persona-specific — no generic advice language (bilingual object)
- impacts: 2–4 items; detailHKD and detailMonths are optional but include at least one concrete number across the set`;

function parseCrisisState(
  raw: string,
  riskProfile: RiskProfile,
): CrisisState {
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
  const title = assertStrictBilingual(record.title, "title");
  const description = assertStrictBilingual(record.description, "description");
  const monthlyIncomeImpactPercent = assertFiniteNumber(
    record.monthlyIncomeImpactPercent,
    "monthlyIncomeImpactPercent",
  );
  const oneTimeCostHKD = assertFiniteNumber(
    record.oneTimeCostHKD,
    "oneTimeCostHKD",
  );
  const durationMonths = assertFiniteNumber(
    record.durationMonths,
    "durationMonths",
  );

  if (monthlyIncomeImpactPercent < 0 || monthlyIncomeImpactPercent > 100) {
    throw new Error(
      'Invalid crisis scenario: "monthlyIncomeImpactPercent" must be between 0 and 100.',
    );
  }
  if (oneTimeCostHKD < 0) {
    throw new Error(
      'Invalid crisis scenario: "oneTimeCostHKD" cannot be negative.',
    );
  }
  if (!Number.isFinite(durationMonths) || durationMonths < 1) {
    throw new Error(
      'Invalid crisis scenario: "durationMonths" must be a positive number.',
    );
  }

  const impactsRaw = record.impacts;
  if (!Array.isArray(impactsRaw) || impactsRaw.length < 2 || impactsRaw.length > 4) {
    throw new Error(
      'Invalid crisis scenario: "impacts" must be an array of 2–4 items.',
    );
  }

  const impacts: CrisisImpact[] = impactsRaw.map((item, index) => {
    const row = assertRecord(item, `impacts[${index}]`);
    const layer = assertNonEmptyString(row.layer, `impacts[${index}].layer`);
    if (!CRISIS_LAYERS.has(layer)) {
      throw new Error(
        `Invalid crisis scenario: impacts[${index}].layer must be protection|emergencyFund|investment|goals.`,
      );
    }
    const icon = assertNonEmptyString(row.icon, `impacts[${index}].icon`);
    const headline = assertStrictBilingual(
      row.headline,
      `impacts[${index}].headline`,
    );

    const impact: CrisisImpact = {
      layer: layer as CrisisImpact["layer"],
      icon,
      headline,
    };

    if (row.detailHKD !== undefined && row.detailHKD !== null) {
      const detailHKD = assertFiniteNumber(
        row.detailHKD,
        `impacts[${index}].detailHKD`,
      );
      if (detailHKD < 0) {
        throw new Error(
          `Invalid crisis scenario: impacts[${index}].detailHKD cannot be negative.`,
        );
      }
      impact.detailHKD = Math.round(detailHKD);
    }
    if (row.detailMonths !== undefined && row.detailMonths !== null) {
      const detailMonths = assertFiniteNumber(
        row.detailMonths,
        `impacts[${index}].detailMonths`,
      );
      if (detailMonths < 0) {
        throw new Error(
          `Invalid crisis scenario: impacts[${index}].detailMonths cannot be negative.`,
        );
      }
      impact.detailMonths = Math.round(detailMonths);
    }

    return impact;
  });

  return {
    title,
    description,
    riskProfile,
    monthlyIncomeImpactPercent: Math.round(monthlyIncomeImpactPercent),
    oneTimeCostHKD: Math.round(oneTimeCostHKD),
    durationMonths: Math.round(durationMonths),
    impacts,
  };
}

/**
 * Generates a persona + risk-profile-specific crisis via DeepSeek and saves crisisJson.
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
    select: { id: true },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  const flavorHint =
    persona.riskProfile === "aggressive"
      ? "Flavor: market-crash-triggered liquidation scenario."
      : persona.riskProfile === "conservative"
        ? "Flavor: medical / health-gap fear scenario."
        : "Flavor: mixed career / income disruption scenario.";

  const userPrompt = [
    `Age: ${Math.round(persona.age)}`,
    `Industry: ${industry}`,
    `Monthly income (HKD): ${persona.monthlyIncome}`,
    `Household status: ${persona.householdStatus?.trim() || "not specified"}`,
    `Risk profile: ${persona.riskProfile}`,
    flavorHint,
  ].join("\n");

  const crisis = await callDeepSeekParsed(
    {
      systemPrompt: GENERATE_CRISIS_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      tone: persona.tone,
      bilingualFields: true,
    },
    (raw) => parseCrisisState(raw, persona.riskProfile),
    { maxParseAttempts: 2 },
  );

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

You receive a DETERMINISTIC rating breakdown and a pre-ranked list of 3 seed goals. Each seed already has:
- rank (1–3)
- category
- icon
- impactPoints (how many overall score points fixing this gap would add)

Your job is ONLY to write:
- title — short, specific, action-oriented (not generic), as bilingual { en, zhHant }
- reasoning — 2–3 sentences that reference the ACTUAL numbers and events provided (rating gaps, crisis title/impacts, stress-test red goals, pyramid figures). No templated advice. As bilingual { en, zhHant }.

Rules:
- Keep rank, category, icon, and impactPoints EXACTLY as given in the seeds — do not invent or change impactPoints.
- Reasoning must cite specific numbers/events from the payload.
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
  crisis: CrisisState;
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

function buildActionGoalSeeds(rating: SummaryRating): ActionGoalSeed[] {
  const candidates = ACTION_CATEGORY_META.map((meta) => {
    const currentScore = rating.breakdown[meta.ratingKey];
    const gap = Math.max(0, 100 - currentScore);
    const impactPoints = computeGoalImpactPoints(
      meta.ratingKey,
      gap,
      RATING_WEIGHTS[meta.ratingKey],
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

    // Force deterministic fields from seeds — AI must not invent impactPoints.
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
 * Computes rating + impactPoints deterministically, asks DeepSeek only for
 * titles/reasoning, saves SummaryState into goalsJson.
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
  if (!input.pyramid || !input.benchmarks || !input.stressTest || !input.crisis) {
    throw new Error("Full session context is required for action goals.");
  }

  const session = await prisma.workshopSession.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!session) {
    throw new Error("Workshop session not found. Please restart from intake.");
  }

  const rating = computeFinancialRating({
    pyramid: input.pyramid,
    benchmarks: input.benchmarks,
    stressTest: input.stressTest,
    crisis: input.crisis,
  });

  const seeds = buildActionGoalSeeds(rating);
  const redGoals = input.stressTest.goalProjections.filter(
    (g) => g.status === "red",
  );
  const amberGoals = input.stressTest.goalProjections.filter(
    (g) => g.status === "amber",
  );

  const userPrompt = [
    `Age: ${input.age ?? "unknown"}`,
    `Industry: ${input.industry?.trim() || "unknown"}`,
    "",
    "Rating:",
    JSON.stringify(rating),
    "",
    "Pre-ranked action seeds (keep rank/category/icon/impactPoints exact):",
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
    "Pyramid snapshot:",
    JSON.stringify({
      protection: input.pyramid.protection,
      emergencyFund: input.pyramid.emergencyFund,
      goals: input.pyramid.goals.goals.map((g) => ({
        label: g.label.en,
        targetAmountHKD: g.targetAmountHKD,
        targetYear: g.targetYear,
      })),
      investment: {
        monthlyInvestmentHKD: input.pyramid.investment.monthlyInvestmentHKD,
        monthlyFunHKD: input.pyramid.investment.monthlyFunHKD,
      },
    }),
    "",
    "Benchmarks:",
    JSON.stringify(input.benchmarks),
    "",
    "Crisis:",
    JSON.stringify({
      title: input.crisis.title.en,
      monthlyIncomeImpactPercent: input.crisis.monthlyIncomeImpactPercent,
      oneTimeCostHKD: input.crisis.oneTimeCostHKD,
      durationMonths: input.crisis.durationMonths,
      impacts: input.crisis.impacts.map((impact) => ({
        layer: impact.layer,
        icon: impact.icon,
        headline: impact.headline.en,
        detailHKD: impact.detailHKD,
        detailMonths: impact.detailMonths,
      })),
    }),
    "",
    "Stress-test reds/ambers:",
    JSON.stringify({
      redGoals,
      amberGoals,
      emergencyFund: input.stressTest.emergencyFundProjection,
    }),
    "",
    "Write title + reasoning for each seed. Cite real numbers above.",
  ].join("\n");

  const actionGoals = await callDeepSeekParsed(
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
  const summary: SummaryState = { rating, actionGoals };

  await prisma.workshopSession.update({
    where: { id: session.id },
    data: {
      goalsJson: summary as unknown as Prisma.InputJsonValue,
    },
  });

  return summary;
}
