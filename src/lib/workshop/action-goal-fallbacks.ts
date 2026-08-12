/**
 * Deterministic Action Goal reasoning when DeepSeek fails validation.
 * Pure TypeScript — no AI, no randomness, tone-neutral.
 *
 * v5: templates are lever-type aware (instant / structural / behavioral),
 * grounded in the user's actual journey decisions, and use authentic
 * Hong Kong financial texture (VHIS, MPF, first-home down payments).
 */

import type { ActionGoalsDecisionsPayload } from "@/lib/workshop/action-goals-decisions";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { ActionGoal, Bilingual } from "@/lib/workshop/types";

export type RankedIntervention = {
  rank: number;
  category: ActionGoal["category"];
  leverType: ActionGoal["leverType"];
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
  runway?: {
    beforeAge: number | null;
    afterAge: number | null;
  } | null;
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

/** Total monthly discretionary cut across accepted squeezes (HKD). */
function acceptedSqueezeMonthly(decisions: DecisionsPayload): number {
  return decisions.squeezesAccepted.reduce((sum, row) => {
    if (row.category === "discretionary") {
      return sum + Math.max(0, row.monthlyAmount);
    }
    return sum;
  }, 0);
}

/** Age label for the runway hero (null = sustained past 90). */
function runwayLabel(age: number | null): Bilingual {
  if (age == null) {
    return { en: "past 90", zhHant: "90 歲之後" };
  }
  return { en: `age ${age}`, zhHant: `${age} 歲` };
}

function withPts(template: Bilingual, impactPoints: number): Bilingual {
  const pts = formatPts(impactPoints);
  return {
    en: template.en.replaceAll("{impactPoints}", pts),
    zhHant: template.zhHant.replaceAll("{impactPoints}", pts),
  };
}

/**
 * INSTANT lever — do this week. Primary candidate: savings / emergency fund.
 * Cites the accepted squeeze (money the user already freed) + HK 3–6 month runway.
 */
function instantReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const months = decisions.postJourneyState.emergencyFundMonthsRemaining;
  const cutMonthly = acceptedSqueezeMonthly(decisions);
  const pts = formatPts(goal.impactPoints);
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;

  if (isPresentNumber(months) && months < 3) {
    const monthsLabel = formatMonths(months);
    const cutLine = cutMonthly > 0
      ? {
          en: ` You already freed ${formatCompactHkd(cutMonthly)}/mo by cutting discretionary — move that into emergency cash this week.`,
          zhHant: ` 你已透過削減可選開支每月騰出 ${formatCompactHkd(cutMonthly)}——本週把它撥入應急現金。`,
        }
      : { en: "", zhHant: "" };
    return {
      en: `Your emergency runway is about ${monthsLabel} months — thin for Hong Kong living costs.${cutLine.en} Target 3–6 months of expenses as your shock absorber. Estimated rating impact: +${pts} pts.`,
      zhHant: `你的應急跑道只剩約 ${monthsLabel} 個月——以香港的生活開支來說偏薄。${cutLine.zhHant}目標是儲備 3–6 個月開支作為緩衝。估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentNumber(months) && cutMonthly > 0) {
    const monthsLabel = formatMonths(months);
    return {
      en: `You freed ${formatCompactHkd(cutMonthly)}/mo by cutting discretionary — routing it into emergency cash this week extends your runway from ${monthsLabel} months toward the 3–6 month HK benchmark. Estimated rating impact: +${pts} pts.`,
      zhHant: `你削減可選開支後每月騰出 ${formatCompactHkd(cutMonthly)}——本週將它撥入應急現金，可把跑道由 ${monthsLabel} 個月推近香港常見的 3–6 個月基準。估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentNumber(months)) {
    const monthsLabel = formatMonths(months);
    return {
      en: `Extending your emergency runway from ${monthsLabel} months toward 3–6 months of expenses protects every other decision in your plan — do it this week, not next month. Estimated rating impact: +${pts} pts.`,
      zhHant: `把應急跑道由 ${monthsLabel} 個月延伸至 3–6 個月開支，能保護計劃中的每一項決定——請本週完成，別拖到下個月。估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentNumber(surplus) && surplus > 0) {
    return {
      en: `Move ${formatCompactHkd(surplus)} of your monthly surplus into emergency cash this week — a 3–6 month buffer is the cheapest insurance against an income gap in HK. Estimated rating impact: +${pts} pts.`,
      zhHant: `本週把每月盈餘中的 ${formatCompactHkd(surplus)} 撥入應急現金——3–6 個月的緩衝，是應對收入空窗最便宜的保險。估計評分影響：+${pts} 分。`,
    };
  }

  return null;
}

/**
 * STRUCTURAL lever — set it up once. Primary candidate: protection.
 * Cites the crisis stress test outcome + HK health-cost reality (VHIS, private hospitals).
 */
function structuralReasoning(
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
      en: `Our stress test simulated a ${scenario.en} and found a ${amount} gap — enough to delay your ${name} goal by ${years} years. A VHIS-qualified plan (premiums can be tax-deductible up to HK$8,000 per person per year) set up once closes the worst of it. Estimated rating impact: +${pts} pts.`,
      zhHant: `壓力測試模擬了${scenario.zhHant}，發現 ${amount} 的缺口——足以令你的「${name}」目標延遲 ${years} 年。一次過投保合資格自願醫保計劃（保費每年每人最多可扣稅 HK$8,000），即可補上最大部分。估計評分影響：+${pts} 分。`,
    };
  }

  if (
    stress?.verdict === "PENETRATED" &&
    isPresentNumber(stress.penetrationAmount)
  ) {
    const amount = formatCompactHkd(stress.penetrationAmount);
    return {
      en: `The stress test found a ${amount} protection gap — a private hospital stay in HK can reach six figures quickly. Sort your medical cover once (VHIS-qualified plans offer up to HK$8,000/yr tax deduction per person) and stop relying on luck. Estimated rating impact: +${pts} pts.`,
      zhHant: `壓力測試發現 ${amount} 的保障缺口——香港私營醫院一次住院可輕易達六位數字。一次過處理醫療保障（合資格自願醫保每年每人最多扣稅 HK$8,000），別再靠運氣。估計評分影響：+${pts} 分。`,
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
    en: `Your protection layer has a measurable gap of ${amount}. In HK, critical-illness cover of a few times annual income is the standard set-it-and-forget-it layer — review it once and you are done. Estimated rating impact: +${pts} pts.`,
    zhHant: `你的保障層有可量度的缺口 ${amount}。在香港，危疾保障一般以年收入的數倍為基準——這是「設定一次、長年有效」的層級，檢視一次即可。估計評分影響：+${pts} 分。`,
  };
}

/**
 * BEHAVIORAL lever — the monthly habit. Primary candidates: goal / investment.
 * Cites the runway before→after (the user's own decisions moved it) and the
 * squeezed discretionary level as the habit to keep.
 */
function behavioralReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const pts = formatPts(goal.impactPoints);
  const cutMonthly = acceptedSqueezeMonthly(decisions);
  const runway = decisions.runway;
  const applied = decisions.goalsApplied[0];
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;
  const profile = decisions.riskQuizProfile;

  const runwayLine =
    runway &&
    isPresentNumber(runway.beforeAge) &&
    isPresentNumber(runway.afterAge) &&
    runway.afterAge !== runway.beforeAge
      ? {
          en: ` Your decisions stretched your money from ${runwayLabel(runway.beforeAge).en} to ${runwayLabel(runway.afterAge).en} — this habit is what keeps that.`,
          zhHant: ` 你的決定已把資金可維持年期由${runwayLabel(runway.beforeAge).zhHant}延長至${runwayLabel(runway.afterAge).zhHant}——這個習慣正是維持成果的關鍵。`,
        }
      : { en: "", zhHant: "" };

  if (cutMonthly > 0) {
    return {
      en: `Keep the discretionary cap you accepted in your goal journey (about ${formatCompactHkd(cutMonthly)}/mo trimmed) as a standing monthly habit — not a one-off.${runwayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `把目標旅程中你接納的可選開支上限（每月約削減 ${formatCompactHkd(cutMonthly)}）變成恆常習慣，而非一次性。${runwayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentString(profile) && isPresentNumber(surplus) && surplus > 0) {
    const surplusLabel = formatCompactHkd(surplus);
    return {
      en: `You have ${surplusLabel} of monthly surplus not yet working for you. Set a standing rule — for example a voluntary MPF contribution or an auto-transfer on payday — sized to your ${profile} profile, so the habit runs without willpower.${runwayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `你每月尚有 ${surplusLabel} 盈餘未投入運用。設立一條恆常規則——例如自願性強積金供款或出糧日的自動轉賬——按你的「${profile}」取向設定，讓習慣不靠意志力也能持續。${runwayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentString(applied?.name)) {
    const name = applied!.name.trim();
    return {
      en: `After your goal journey, keeping ${name} on track is the monthly habit that compounds every other choice you made.${runwayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `在目標旅程之後，讓「${name}」保持進度，是把其餘決定持續放大的每月習慣。${runwayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  return null;
}

/**
 * Build bilingual fallback reasoning for one ranked intervention.
 * Picks the lever-type template; falls back to a category generic.
 */
export function buildFallbackReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual {
  let primary: Bilingual | null = null;

  switch (goal.leverType) {
    case "instant":
      primary = instantReasoning(goal, decisions);
      break;
    case "structural":
      primary = structuralReasoning(goal, decisions);
      break;
    case "behavioral":
      primary = behavioralReasoning(goal, decisions);
      break;
    default: {
      const _exhaustive: never = goal.leverType;
      return _exhaustive;
    }
  }

  if (primary) {
    return primary;
  }

  const generic: Record<ActionGoal["category"], Bilingual> = {
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
  return withPts(generic[goal.category], goal.impactPoints);
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
