/**
 * Deterministic Action Goal reasoning when DeepSeek fails validation.
 * Pure TypeScript — no AI, no randomness, tone-neutral.
 */

import type { ActionGoalsDecisionsPayload } from "@/lib/workshop/action-goals-decisions";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { ActionGoal, Bilingual } from "@/lib/workshop/types";

export type RankedIntervention = {
  rank: number;
  category: ActionGoal["category"];
  icon: string;
  impactPoints: number;
  /** Rating gap (0–100) used when penetrationAmount is unavailable. */
  gap?: number;
  currentScore?: number;
};

/**
 * Decisions payload for fallback templates. Mirrors the curated AI block but
 * allows nullish stress / post-journey fields so missing data falls through
 * gracefully without crashing.
 */
export type DecisionsPayload = {
  goalsApplied: ActionGoalsDecisionsPayload["goalsApplied"];
  goalsGivenUp: ActionGoalsDecisionsPayload["goalsGivenUp"];
  squeezesAccepted: ActionGoalsDecisionsPayload["squeezesAccepted"];
  squeezesRejected: ActionGoalsDecisionsPayload["squeezesRejected"];
  postJourneyState: {
    remainingMonthlySurplus: number | null;
    emergencyFundMonthsRemaining: number | null;
    investmentBalanceRemaining: number | null;
  };
  crisisStressTest?: {
    scenario: string;
    verdict: string;
    penetrationAmount: number | null;
    affectedGoal: string | null;
    delayYears: number | null;
  } | null;
  riskQuizProfile: ActionGoalsDecisionsPayload["riskQuizProfile"] | null;
  profileBehaviorMismatch: boolean;
};

const SCENARIO_LABELS: Record<string, Bilingual> = {
  medical: { en: "medical crisis", zhHant: "醫療危機" },
  critical_illness: { en: "critical illness", zhHant: "危疾" },
  job_loss: { en: "income loss", zhHant: "收入中斷" },
  market_crash: { en: "market drawdown", zhHant: "市場急挫" },
  accident: { en: "accident", zhHant: "意外" },
};

function formatPts(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toLocaleString("en-HK", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function formatMonths(value: number): string {
  return value.toLocaleString("en-HK", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function scenarioLabel(scenario: string): Bilingual {
  return (
    SCENARIO_LABELS[scenario] ?? {
      en: scenario.replace(/_/g, " "),
      zhHant: scenario.replace(/_/g, " "),
    }
  );
}

function isPresentNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPresentString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const GENERIC: Record<ActionGoal["category"], Bilingual> = {
  protection: {
    en: "Strengthening your protection layer is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
    zhHant:
      "加強保障層是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
  },
  savings: {
    en: "Rebuilding emergency cash is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
    zhHant:
      "重建應急現金是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
  },
  investment: {
    en: "Putting idle capacity into long-term growth is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
    zhHant:
      "把閒置空間投入長期增長，是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
  },
  goal: {
    en: "Keeping your priority goals on track is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
    zhHant:
      "讓優先目標保持進度，是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
  },
};

function withPts(template: Bilingual, impactPoints: number): Bilingual {
  const pts = formatPts(impactPoints);
  return {
    en: template.en.replaceAll("{impactPoints}", pts),
    zhHant: template.zhHant.replaceAll("{impactPoints}", pts),
  };
}

function protectionReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const stress = decisions.crisisStressTest;
  const pts = formatPts(goal.impactPoints);

  if (
    stress?.verdict === "PENETRATED" &&
    isPresentString(stress.affectedGoal) &&
    isPresentNumber(stress.delayYears) &&
    isPresentNumber(stress.penetrationAmount) &&
    isPresentString(stress.scenario)
  ) {
    const scenario = scenarioLabel(stress.scenario);
    const amount = formatCompactHkd(stress.penetrationAmount);
    const years = formatPts(stress.delayYears);
    const name = stress.affectedGoal.trim();
    return {
      en: `Our stress test simulated a ${scenario.en} and found a gap of ${amount}. Closing it protects your ${name} goal from a ${years}-year delay. Estimated rating impact: +${pts} pts.`,
      zhHant: `壓力測試模擬了${scenario.zhHant}，並找出 ${amount} 的缺口。補上後可避免你的「${name}」目標延遲 ${years} 年。估計評分影響：+${pts} 分。`,
    };
  }

  const gapAmount = isPresentNumber(stress?.penetrationAmount)
    ? stress!.penetrationAmount
    : isPresentNumber(goal.gap)
      ? goal.gap
      : null;
  if (gapAmount == null) {
    return null;
  }

  const amount = formatCompactHkd(gapAmount);
  return {
    en: `Your protection layer has a measurable gap of ${amount}. Strengthening it is the single largest improvement available to your plan. Estimated rating impact: +${pts} pts.`,
    zhHant: `你的保障層有可量度的缺口 ${amount}。加強保障，是目前計劃可取得的最大單一改善。估計評分影響：+${pts} 分。`,
  };
}

function savingsReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const months = decisions.postJourneyState.emergencyFundMonthsRemaining;
  if (!isPresentNumber(months)) {
    return null;
  }

  const pts = formatPts(goal.impactPoints);
  const monthsLabel = formatMonths(months);

  if (months < 3) {
    return {
      en: `After your goal journey decisions, your emergency runway stands at ${monthsLabel} months. Rebuilding it toward 6 months keeps a market dip or income gap from forcing you to unwind the goals you secured. Estimated rating impact: +${pts} pts.`,
      zhHant: `在你完成目標旅程的決定後，應急跑道剩約 ${monthsLabel} 個月。重建至約 6 個月，可避免市況下跌或收入空窗迫使你動搖已鎖定的目標。估計評分影響：+${pts} 分。`,
    };
  }

  return {
    en: `Extending your emergency runway from ${monthsLabel} to 6 months adds a buffer that protects every other decision in your plan. Estimated rating impact: +${pts} pts.`,
    zhHant: `把應急跑道由 ${monthsLabel} 個月延伸至 6 個月，可為計劃裡每一項決定多加一層緩衝。估計評分影響：+${pts} 分。`,
  };
}

function investmentReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;
  const profile = decisions.riskQuizProfile;
  if (!isPresentString(profile)) {
    return null;
  }

  const pts = formatPts(goal.impactPoints);

  if (isPresentNumber(surplus) && surplus > 0) {
    const surplusLabel = formatCompactHkd(surplus);
    return {
      en: `You have ${surplusLabel} in monthly surplus not yet working toward a goal. A systematic allocation aligned with your ${profile} profile keeps your long-term targets on track. Estimated rating impact: +${pts} pts.`,
      zhHant: `你每月尚有 ${surplusLabel} 盈餘未投入目標。按你的「${profile}」風險取向作系統配置，有助長期目標保持進度。估計評分影響：+${pts} 分。`,
    };
  }

  if (!isPresentNumber(surplus)) {
    return null;
  }

  // surplus === 0 or negative → else branch
  return {
    en: `Once your accepted budget adjustments free up surplus, directing it automatically into growth assets aligned with your ${profile} profile prevents drift. Estimated rating impact: +${pts} pts.`,
    zhHant: `當你已接納的預算調整釋出盈餘後，自動導向符合「${profile}」取向的增長資產，可避免資金閒置。估計評分影響：+${pts} 分。`,
  };
}

function goalReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const applied = decisions.goalsApplied[0];
  if (!applied || !isPresentString(applied.name)) {
    return null;
  }
  const pts = formatPts(goal.impactPoints);
  const name = applied.name.trim();
  const age = isPresentNumber(applied.targetAge)
    ? formatPts(applied.targetAge)
    : null;
  if (age == null) {
    return {
      en: `After your goal journey, keeping ${name} on track is the lever that compounds every other choice you made. Estimated rating impact: +${pts} pts.`,
      zhHant: `在目標旅程之後，讓「${name}」保持進度，是把其餘決定持續放大的槓桿。估計評分影響：+${pts} 分。`,
    };
  }
  return {
    en: `After your goal journey, keeping ${name} (target age ${age}) on track is the lever that compounds every other choice you made. Estimated rating impact: +${pts} pts.`,
    zhHant: `在目標旅程之後，讓「${name}」（目標年齡 ${age}）保持進度，是把其餘決定持續放大的槓桿。估計評分影響：+${pts} 分。`,
  };
}

/**
 * Build bilingual fallback reasoning for one ranked intervention.
 * Selects a category template and interpolates ONLY payload values.
 */
export function buildFallbackReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual {
  let primary: Bilingual | null = null;

  switch (goal.category) {
    case "protection":
      primary = protectionReasoning(goal, decisions);
      break;
    case "savings":
      primary = savingsReasoning(goal, decisions);
      break;
    case "investment":
      primary = investmentReasoning(goal, decisions);
      break;
    case "goal":
      primary = goalReasoning(goal, decisions);
      break;
    default: {
      const _exhaustive: never = goal.category;
      return _exhaustive;
    }
  }

  if (primary) {
    return primary;
  }

  return withPts(GENERIC[goal.category], goal.impactPoints);
}

export type ActionGoalsFallbackLogEvent = {
  event: "workshop.action_goals.fallback";
  sessionId: string;
  ranks: number[];
  categories: ActionGoal["category"][];
  reason: string;
};

/** Structured monitor log — never surfaced to the UI. */
export function logActionGoalsFallback(
  input: Omit<ActionGoalsFallbackLogEvent, "event">,
): void {
  const payload: ActionGoalsFallbackLogEvent = {
    event: "workshop.action_goals.fallback",
    sessionId: input.sessionId,
    ranks: input.ranks,
    categories: input.categories,
    reason: input.reason,
  };
  console.info(JSON.stringify(payload));
}
