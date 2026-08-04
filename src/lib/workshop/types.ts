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
  targetYear: number;
};

export type GoalsLayer = {
  goals: GoalItem[];
};

export type InvestmentLayer = {
  riskAllocation: { low: number; mid: number; high: number };
  monthlyInvestmentHKD: number;
  monthlyFunHKD: number;
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
};

export type CrisisState = {
  title: Bilingual;
  description: Bilingual;
  riskProfile: RiskProfile;
  monthlyIncomeImpactPercent: number;
  oneTimeCostHKD: number;
  durationMonths: number;
  impacts: CrisisImpact[];
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

export type ActionGoal = {
  rank: number;
  title: Bilingual;
  category: "protection" | "savings" | "investment" | "goal";
  icon: string;
  impactPoints: number;
  reasoning: Bilingual;
};

export type SummaryState = {
  rating: SummaryRating;
  actionGoals: ActionGoal[];
};
