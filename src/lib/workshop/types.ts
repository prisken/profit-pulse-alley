export type WorkshopTone =
  | "fun"
  | "professional"
  | "simple"
  | "direct"
  | "warm";

/** UI/AI copy that must be stored in both site locales. */
export type Bilingual = { en: string; zhHant: string };

export type LayerFlag = "green" | "amber" | "red";

export type ProtectionLayer = {
  medicalCoveragePercent: number;
  criticalIllnessAmountHKD: number;
};

export type EmergencyFundLayer = {
  savedAmountHKD: number;
};

export type GoalItem = {
  id: string;
  icon: string;
  label: Bilingual;
  targetAmountHKD: number;
  /** Source of truth — age the user will be when the goal is due. */
  targetAge: number;
  /**
   * Derived calendar year: `currentYear + (targetAge − userAge)`.
   * Kept for stress-test / PDF display; recompute when age or targetAge changes.
   */
  targetYear: number;
  /**
   * Every goal is a spend goal (cash outflow at target age) — no nest-egg type.
   * Spend goals must explicitly opt in before invested assets may be liquidated.
   */
  allowLiquidation?: boolean;
};

export type GoalsLayer = {
  goals: GoalItem[];
};

export type InvestmentLayer = {
  riskAllocation: { low: number; mid: number; high: number };
  /** Current total invested capital (HKD). */
  lumpSumHKD: number;
};

export type PyramidState = {
  protection: ProtectionLayer;
  emergencyFund: EmergencyFundLayer;
  goals: GoalsLayer;
  investment: InvestmentLayer;
};

export type LayerFlags = {
  protection: LayerFlag;
  emergencyFund: LayerFlag;
  goals: LayerFlag;
  investment: LayerFlag;
};

/** Fixed expense category keys — display labels come from the i18n catalog. */
export type ExpenseCategoryKey =
  | "housing"
  | "food_living"
  | "transport"
  | "insurance"
  | "discretionary";

export type ExpenseCategory = {
  key: ExpenseCategoryKey;
  icon: string;
  amountHKD: number;
};

export type ExpensesState = {
  categories: ExpenseCategory[];
  totalHKD: number;
};

export type GoalJourneyDecision = {
  goalId: string;
  status: "pending" | "applied" | "given_up";
  allowLiquidation: boolean;
  acceptedSqueeze: boolean;
  squeezeCutsHKD?: { fun: number; discretionary: number };
};

export type GoalJourneyState = {
  decisions: GoalJourneyDecision[];
  updatedAt: string;
};

export type AllocationSlice = {
  key: string;
  label: Bilingual;
  amountHKD: number;
  changed: boolean;
};

export type SqueezeRecommendation = {
  requiredExtraMonthlyHKD: number;
  currentAllocation: AllocationSlice[];
  recommendedAllocation: AllocationSlice[];
  achievableAtAge: number | null;
  reasoning: Bilingual;
};

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type RiskQuizAnswer = { questionId: string; choice: "a" | "b" | "c" };

export type RiskQuizState = {
  answers: RiskQuizAnswer[];
  score: number;
  /** Display labels for profile come from the i18n catalog. */
  profile: RiskProfile;
};

export type CrisisImpact = {
  layer: "protection" | "emergencyFund" | "investment" | "goals";
  icon: string;
  headline: Bilingual;
  detailHKD?: number;
  detailMonths?: number;
  /** Engine stage id when impact was synthesised from crisis-engine. */
  stageId?:
    | "coverage"
    | "fun"
    | "discretionary"
    | "liquid"
    | "invested"
    | "market"
    | "income"
    | "goals";
};

export type CrisisType =
  | "medical"
  | "critical_illness"
  | "job_loss"
  | "market_crash"
  | "accident"
  | "family";

export const CRISIS_TYPES = [
  "medical",
  "critical_illness",
  "job_loss",
  "market_crash",
  "accident",
  "family",
] as const satisfies ReadonlyArray<CrisisType>;

export type CrisisCoverageOffset = {
  grossCostHKD: number;
  coveredHKD: number;
  uncoveredHKD: number;
  coverageKind: "medical_percent" | "critical_illness" | "none";
  medicalCoveragePercent?: number;
  ciAmountHKD?: number;
};

export type CrisisCutOrder = {
  funAbsorbedHKD: number;
  discretionaryAbsorbedHKD: number;
  liquidAbsorbedHKD: number;
  investedAbsorbedHKD: number;
  remainingUncoveredHKD: number;
};

export type CrisisGoalDelay = {
  goalId: string;
  label: Bilingual;
  beforeAge: number | null;
  afterAge: number | null;
};

/** Deterministic engine output attached to CrisisState after applyCrisis. */
export type CrisisImpactResult = {
  crisisType: CrisisType;
  coverage: CrisisCoverageOffset | null;
  cutOrder: CrisisCutOrder;
  marketDropHKD: number;
  incomeHitPct: number;
  durationMonths: number;
  oneTimeCostHKD: number;
  efStatusBefore: string;
  efStatusAfter: string;
  assetsDepletedAtAgeBefore: number | null;
  assetsDepletedAtAgeAfter: number | null;
  goalDelays: CrisisGoalDelay[];
};

export type CrisisState = {
  crisisType: CrisisType;
  title: Bilingual;
  description: Bilingual;
  riskProfile: RiskProfile;
  /** Synced from incomeHitPct for rating / PDF compat. */
  monthlyIncomeImpactPercent: number;
  oneTimeCostHKD: number;
  durationMonths: number;
  /** Optional structured params (clamped server-side). */
  incomeHitPct?: number;
  marketDropPct?: number;
  impacts: CrisisImpact[];
  /** Present after generateCrisisAction runs the engine. */
  impactResult?: CrisisImpactResult;
};

export type GoalProjection = {
  goalId: string;
  label: Bilingual;
  icon: string;
  targetAmountHKD: number;
  targetYear: number;
  projectedYear: number | null; // null = never reached within cap
  status: LayerFlag;
  note?: Bilingual;
};

export type StressTestResult = {
  monthlySurplusByYear: Array<{
    year: number;
    income: number;
    expenses: number;
    surplus: number;
  }>;
  emergencyFundProjection: {
    targetMonths: number;
    projectedMonths: number;
    status: LayerFlag;
  };
  goalProjections: GoalProjection[];
};

/** AI amber/red notes for the stress-test step. */
export type StressTestNote = {
  id: string;
  note: Bilingual;
};

export type SummaryRatingLabelKey =
  | "needsAttention"
  | "goodRoomToGrow"
  | "strongFoundation";

export type SummaryRating = {
  score: number;
  labelKey: SummaryRatingLabelKey;
  breakdown: {
    protection: number;
    emergencyFund: number;
    goalsOnTrack: number;
    crisisResilience: number;
  };
};

export type ActionGoalLeverType = "instant" | "structural" | "behavioral";

export type ActionGoal = {
  rank: number;
  title: Bilingual;
  category: "protection" | "savings" | "investment" | "goal";
  /**
   * Lever type differentiates the three goals:
   * instant = do this week (e.g. move cash into the emergency fund),
   * structural = set it up once (e.g. protection cover),
   * behavioral = the monthly habit that moves the plan.
   */
  leverType: ActionGoalLeverType;
  icon: string;
  impactPoints: number;
  reasoning: Bilingual;
};

/**
 * Persisted Summary crisis stress-test snapshot (additive on SummaryState).
 * Omits heavy engine payload; rating uses resilienceScore as SSOT.
 */
export type CrisisStressTestSummary = {
  scenario:
    | "medical"
    | "critical_illness"
    | "job_loss"
    | "market_crash"
    | "accident";
  crisisType: CrisisType;
  shieldedAmount: number;
  penetrationAmount: number;
  affectedGoalId: string | null;
  affectedGoalLabel: Bilingual | null;
  delayYears: number | null;
  verdict: "SHIELDED" | "PARTIAL" | "PENETRATED";
  /** 0–100 — must match rating.breakdown.crisisResilience. */
  resilienceScore: number;
  oneTimeCostHKD: number;
  incomeHitPct: number;
  marketDropPct: number;
  durationMonths: number;
};

export type SummaryState = {
  rating: SummaryRating;
  actionGoals: ActionGoal[];
  /** Silent Summary stress test — additive; older sessions may omit. */
  crisisStressTest?: CrisisStressTestSummary;
  /**
   * Hero "money runway" moment (v5): how long assets last without the user's
   * goal-journey decisions (beforeAge) vs with them (afterAge).
   * `null` age = sustained past 90. Older sessions may omit.
   */
  runway?: {
    beforeAge: number | null;
    afterAge: number | null;
  };
};
